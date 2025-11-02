from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.database import get_db
from app.core.auth import require_auth
from app.models.user import User
from app.models.conversation import ConversationSession, ConversationMessage
from app.models.emotion_log import EmotionLog
from app.services.supabase_service import get_supabase_service
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime
    last_active: datetime
    preferences: Dict[str, Any]
    
    # Spiritual metrics
    total_conversations: int
    total_messages: int
    favorite_interaction_mode: str
    most_common_emotion: str
    spiritual_streak_days: int
    verses_explored: int
    
    class Config:
        from_attributes = True


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
) -> UserProfileResponse:
    """
    Get comprehensive user profile with spiritual progress metrics.
    
    Returns user information along with spiritual journey statistics
    including conversation counts, emotional patterns, and engagement metrics.
    """
    try:
        # Get Supabase service for enhanced analytics
        supabase_service = get_supabase_service()
        
        # Get spiritual progress from Supabase (more comprehensive)
        try:
            supabase_progress = await supabase_service.get_user_spiritual_progress(str(current_user.id))
        except Exception as e:
            logger.warning(f"Failed to get Supabase progress, falling back to SQLAlchemy: {e}")
            supabase_progress = {}
        
        # Get conversation statistics (fallback to SQLAlchemy if Supabase fails)
        total_conversations = supabase_progress.get('total_conversations') or db.query(ConversationSession).filter(
            ConversationSession.user_id == current_user.id
        ).count()
        
        total_messages = db.query(ConversationMessage).join(ConversationSession).filter(
            ConversationSession.user_id == current_user.id,
            ConversationMessage.role == "user"
        ).count()
        
        # Get favorite interaction mode
        favorite_mode_result = db.query(
            ConversationSession.interaction_mode,
            func.count(ConversationSession.interaction_mode).label('count')
        ).filter(
            ConversationSession.user_id == current_user.id
        ).group_by(ConversationSession.interaction_mode).order_by(desc('count')).first()
        
        favorite_interaction_mode = favorite_mode_result[0] if favorite_mode_result else "wisdom"
        
        # Get most common emotion
        most_common_emotion_result = db.query(
            EmotionLog.emotion_label,
            func.count(EmotionLog.emotion_label).label('count')
        ).filter(
            EmotionLog.user_id == current_user.id
        ).group_by(EmotionLog.emotion_label).order_by(desc('count')).first()
        
        most_common_emotion = most_common_emotion_result[0] if most_common_emotion_result else "neutral"
        
        # Calculate spiritual streak (days with conversations)
        recent_conversations = db.query(
            func.date(ConversationSession.started_at).label('date')
        ).filter(
            ConversationSession.user_id == current_user.id,
            ConversationSession.started_at >= datetime.utcnow() - timedelta(days=30)
        ).distinct().order_by(desc('date')).all()
        
        # Calculate consecutive days
        spiritual_streak_days = 0
        if recent_conversations:
            current_date = datetime.utcnow().date()
            for conv_date in recent_conversations:
                if conv_date[0] == current_date - timedelta(days=spiritual_streak_days):
                    spiritual_streak_days += 1
                else:
                    break
        
        # Count unique verses explored
        verses_explored = db.query(ConversationMessage.verse_id).join(ConversationSession).filter(
            ConversationSession.user_id == current_user.id,
            ConversationMessage.verse_id.isnot(None)
        ).distinct().count()
        
        return UserProfileResponse(
            id=str(current_user.id),
            email=current_user.email or "",
            display_name=current_user.display_name or "",
            created_at=current_user.created_at,
            last_active=current_user.last_active or current_user.created_at,
            preferences=current_user.preferences or {},
            total_conversations=total_conversations,
            total_messages=total_messages,
            favorite_interaction_mode=favorite_interaction_mode,
            most_common_emotion=most_common_emotion,
            spiritual_streak_days=spiritual_streak_days,
            verses_explored=verses_explored
        )
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )


@router.put("/preferences")
async def update_user_preferences(
    preferences: Dict[str, Any],
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Update user preferences.
    
    Allows users to customize their spiritual journey experience
    including notification settings, preferred interaction modes, etc.
    """
    try:
        current_user.preferences = preferences
        db.commit()
        
        logger.info(f"Updated preferences for user {current_user.id}")
        return {"message": "Preferences updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )


@router.get("/health")
async def user_service_health(db: Session = Depends(get_db)) -> dict:
    """
    Health check endpoint for the user service.
    
    Returns the status of user management functionality.
    """
    try:
        # Test database connectivity
        db.query(User).limit(1).all()
        
        return {
            "status": "healthy",
            "service": "user_management",
            "database": "connected",
            "message": "User service is operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "User service is not operational"
        }