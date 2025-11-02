"""
Analytics API endpoints for spiritual progress and user insights
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.auth import require_auth
from app.models.user import User
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/spiritual-progress")
async def get_spiritual_progress(
    timeframe: str = "month",
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get user's spiritual progress analytics.
    
    Args:
        timeframe: Time period for analytics ('week', 'month', 'year')
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Spiritual progress data and analytics
    """
    try:
        # Try direct database connection first
        try:
            # This would contain complex analytics queries
            # For now, return basic data structure
            return {
                "total_conversations": 0,
                "verses_explored": 0,
                "current_streak": 0,
                "favorite_emotion": "Peace",
                "timeframe": timeframe,
                "user_id": str(current_user.id)
            }
            
        except Exception as db_error:
            logger.warning(f"Direct database analytics failed, using Supabase service: {db_error}")
            
            # Fallback to Supabase service
            from app.services.supabase_service import get_supabase_service
            supabase_service = get_supabase_service()
            
            progress_data = await supabase_service.get_user_spiritual_progress(str(current_user.id))
            
            return {
                "total_conversations": progress_data.get("total_conversations", 0),
                "verses_explored": progress_data.get("verses_explored", 0),
                "current_streak": progress_data.get("spiritual_streak_days", 0),
                "favorite_emotion": progress_data.get("most_common_emotion", "Peace"),
                "timeframe": timeframe,
                "user_id": str(current_user.id)
            }
        
    except Exception as e:
        logger.error(f"Error getting spiritual progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve spiritual progress"
        )


@router.get("/health")
async def analytics_health() -> dict:
    """Health check for analytics service"""
    return {
        "status": "healthy",
        "service": "analytics",
        "message": "Analytics service is operational"
    }