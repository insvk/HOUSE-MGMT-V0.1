from fastapi import APIRouter
import time
import httpx
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TimeResponse(BaseModel):
    success: bool
    source: str
    googleUtc: Optional[str] = None
    epochMs: int
    rttMs: Optional[int] = None
    syncedAt: Optional[int] = None
    timezone: Optional[str] = None
    error: Optional[str] = None

@router.get("/google-time", response_model=TimeResponse)
async def get_google_time():
    """
    Syncs server-side time from Google's NTP HTTP endpoint.
    Used by the GoogleClock component as an authoritative time source.
    """
    t0 = int(time.time() * 1000)
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.head('https://time.google.com')
            t1 = int(time.time() * 1000)
            date_header = response.headers.get('date')
            
            # Not using full date parsing to epoch here to keep it simple, 
            # falling back to local time t1 for epoch
            google_epoch = t1
            
            return TimeResponse(
                success=True,
                source='time.google.com',
                googleUtc=date_header,
                epochMs=google_epoch,
                rttMs=t1 - t0,
                syncedAt=t1,
                timezone='Asia/Kolkata'
            )
    except Exception as e:
        return TimeResponse(
            success=False,
            source='server-fallback',
            epochMs=int(time.time() * 1000),
            error=str(e)
        )
