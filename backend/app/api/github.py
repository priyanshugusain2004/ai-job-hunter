from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
import httpx
import json

from app.database.session import get_db
from app.models.user import User
from app.models.ai_report import AIReport
from app.schemas.ai_report import GitHubRequest, AIReportOut
from app.api.deps import get_current_user, get_ai_provider_dep
from app.ai.base import AIProvider
from app.core.cache import get_cache, set_cache, generate_input_hash

router = APIRouter()

@router.post("/analyze", response_model=AIReportOut, tags=["GitHub"])
async def analyze_github_profile(
    req_body: GitHubRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider_dep)
):
    username = req_body.username.strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub username cannot be empty"
        )
        
    input_hash = generate_input_hash(username.lower())
    
    # Check DB first
    existing_report = db.query(AIReport).filter(
        AIReport.user_id == current_user.id,
        AIReport.report_type == "github_analysis",
        AIReport.input_hash == input_hash
    ).first()
    
    if existing_report:
        return existing_report

    # Check cache as secondary backup
    cache_key = f"github_analysis:{username.lower()}"
    cached_val = get_cache(cache_key)
    if cached_val and isinstance(cached_val, dict):
        # Save cache back into DB to keep user record
        db_report = AIReport(
            user_id=current_user.id,
            report_type="github_analysis",
            input_hash=input_hash,
            result_json=cached_val
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    # Fetch from GitHub
    user_url = f"https://api.github.com/users/{username}"
    repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
    headers = {"User-Agent": "AI-Job-Hunter-App"}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Fetch user profile details
        user_res = await client.get(user_url, headers=headers)
        if user_res.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GitHub user '{username}' not found"
            )
        elif user_res.status_code in [403, 429]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit exceeded. Please try again later."
            )
        elif user_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API error: Status {user_res.status_code}"
            )
            
        # Fetch repos
        repos_res = await client.get(repos_url, headers=headers)
        if repos_res.status_code in [403, 429]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit exceeded. Please try again later."
            )
        elif repos_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API error when fetching repos: Status {repos_res.status_code}"
            )

    user_data = user_res.json()
    repos_data = repos_res.json()
    
    # Process and summarize GitHub profile
    simplified_repos = []
    for r in repos_data:
        simplified_repos.append({
            "name": r.get("name"),
            "description": r.get("description"),
            "language": r.get("language"),
            "stars": r.get("stargazers_count"),
            "forks": r.get("forks_count"),
            "updated_at": r.get("updated_at")
        })
        
    github_payload = {
        "username": username,
        "name": user_data.get("name"),
        "bio": user_data.get("bio"),
        "public_repos": user_data.get("public_repos"),
        "followers": user_data.get("followers"),
        "repos": simplified_repos[:30] # Limit to top 30 active repos to avoid huge prompt payloads
    }

    try:
        # Run AI analysis
        ai_result = await ai_provider.analyze_github(json.dumps(github_payload))
        
        # Save to DB
        db_report = AIReport(
            user_id=current_user.id,
            report_type="github_analysis",
            input_hash=input_hash,
            result_json=ai_result
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # Cache results in Redis
        set_cache(cache_key, ai_result, expire_seconds=86400)
        
        return db_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GitHub profile AI analysis failed: {str(e)}"
        )

@router.get("/analyze/{report_id}", response_model=AIReportOut, tags=["GitHub"])
def get_prior_github_analysis(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(AIReport).filter(
        AIReport.id == report_id,
        AIReport.user_id == current_user.id,
        AIReport.report_type == "github_analysis"
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub analysis report not found"
        )
    return report
