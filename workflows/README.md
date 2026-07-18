# n8n Automation Workflows — Setup & Configuration

This directory contains pre-configured automation workflows for **n8n** to automate job hunting, compatibility checks, and application asset generation.

n8n is running locally as a Docker service in your stack.

---

## 🚀 How to Access n8n
Open your web browser and navigate to:
👉 **[http://localhost:9005](http://localhost:9005)**

*(If this is your first run, n8n will prompt you to create an owner account. This account is entirely local and private to your machine).*

---

## 📁 Available Workflows

### 1. Daily Job Search & Evaluator
* **File:** [daily_job_search.json](./daily_job_search.json)
* **Description:** Periodically fetches your target jobs feed, sends each description to the ATS Matcher API, and sends a notification alert (to Slack/Discord webhook or Email) if the compatibility score is **75% or higher**.

### 2. Application Assistant Webhook Package
* **File:** [application_assistant.json](./application_assistant.json)
* **Description:** Exposes a webhook trigger. When called with a JSON body containing `job_description` and `resume_id`, it orchestrates calls to your backend to:
  1. Tailor the resume to match the job.
  2. Generate a professional cover letter matching the tailored resume.
  3. Analyze ATS keywords and compile optimization checklist items.
  4. Returns the compiled asset package immediately in the HTTP response.

---

## ⚙️ How to Import and Setup

1. **Download / Copy the JSON:**
   * Open [daily_job_search.json](./daily_job_search.json) or [application_assistant.json](./application_assistant.json) in your code editor and copy the entire JSON.
2. **Import into n8n:**
   * In the n8n UI, click **Workflows** &rarr; **Add Workflow** &rarr; **New Workflow**.
   * Click the three dots (top-right menu button) &rarr; **Import from File / Paste JSON**.
   * Paste the copied JSON and click **Import**.
3. **Configure Authentication:**
   * The HTTP Request nodes communicate directly with your backend container via `http://backend:8000/`.
   * Double-click the HTTP Request nodes and edit the `Authorization` header parameter:
     * Replace `Bearer YOUR_JWT_ACCESS_TOKEN_HERE` with your actual login JWT token (obtainable from browser developer tools or `/api/v1/auth/login` login endpoint).
4. **Activate & Run:**
   * Click **Save** (top right) and toggle the **Active** switch to enable the workflow cron triggers or webhooks.
   * You can click **Test step** or **Listen for test event** on nodes to verify they execute correctly against your running local backend database.
