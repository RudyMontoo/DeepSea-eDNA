"""
Minimal in-process rate limiter for authentication endpoints
(per client IP; use a shared store such as Redis when running several API replicas)
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str):
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.max_requests:
                retry_after = int(self.window - (now - hits[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many attempts. Please wait and try again.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)

    def reset(self):
        with self._lock:
            self._hits.clear()


def client_ip(request: Request) -> str:
    """
    Client address for rate limiting. Behind CloudFront every request comes from an edge IP,
    so deployments that only accept CloudFront traffic set TRUSTED_PROXY_HEADER to
    "cloudfront-viewer-address" (set by CloudFront itself as "<ip>:<port>"; viewers can't forge it).
    """
    from app.core.config import settings

    if settings.TRUSTED_PROXY_HEADER:
        value = request.headers.get(settings.TRUSTED_PROXY_HEADER)
        if value:
            return value.rsplit(":", 1)[0].strip("[]")
    return request.client.host if request.client else "unknown"
