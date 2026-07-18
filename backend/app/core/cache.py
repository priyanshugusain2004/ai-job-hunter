import redis
import json
import hashlib
from typing import Optional, Any
from app.core.config import settings

# Create a connection pool for Redis
try:
    redis_pool = redis.ConnectionPool(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=0,
        decode_responses=True,
        socket_timeout=2.0
    )
    redis_client = redis.Redis(connection_pool=redis_pool)
except Exception as e:
    print(f"Failed to initialize Redis connection pool: {e}")
    redis_client = None

def get_cache(key: str) -> Optional[Any]:
    """Retrieve value from cache. Return parsed JSON or string, or None if key does not exist or Redis error."""
    if not redis_client:
        return None
    try:
        val = redis_client.get(key)
        if val:
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return val
        return None
    except Exception as e:
        print(f"Redis cache get error: {e}")
        return None

def set_cache(key: str, value: Any, expire_seconds: int = 86400) -> bool:
    """Set value in cache. Serialize dict/list into JSON string. Default expiry 1 day."""
    if not redis_client:
        return False
    try:
        if isinstance(value, (dict, list)):
            val_str = json.dumps(value)
        else:
            val_str = str(value)
        return bool(redis_client.set(key, val_str, ex=expire_seconds))
    except Exception as e:
        print(f"Redis cache set error: {e}")
        return False

def generate_input_hash(data: Any) -> str:
    """Generate SHA256 hex digest of serialized data for input-hash caching."""
    if isinstance(data, (dict, list)):
        serialized = json.dumps(data, sort_keys=True)
    else:
        serialized = str(data)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()
