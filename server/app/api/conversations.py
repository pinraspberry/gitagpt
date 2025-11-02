from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.core.auth import require_auth, check_user_access
from app.models.user import User
from app.models.conversation import ConversationSession, ConversationMessage
from app.services.conversation_manager import ConversationManager
from app.schemas.conversation import (
    ConversationSessionCreate,
    ConversationSessionResponse,
    ConversationMessageCreate,
    ConversationMessageResponse,
    ConversationContextResponse,
    InteractionMode,
    MessageRole
)
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["conversations"])


# Request/Response models for API endpoints
class CreateSessionRequest(BaseModel):
    interaction_mode: InteractionMode = InteractionMode.WISDOM


class AddMessageRequest(BaseModel):
    role: MessageRole
    content: str
    emotion_data: Optional[Dict[str, Any]] = None
    verse_id: Optional[str] = None


class EndSessionRequest(BaseModel):
    summary: Optional[str] = None


# Dependency to get conversation manager
def get_conversation_manager(db: Session = Depends(get_db)) -> ConversationManager:
    return ConversationManager(db)


async def verify_session_ownership(
    session_id: uuid.UUID,
    current_user: User,
    conversation_manager: ConversationManager
) -> None:
    """Verify that the current user owns the specified session."""
    from app.models.conversation import ConversationSession
    
    session = conversation_manager.db.query(ConversationSession).filter(
        ConversationSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {session_id} not found"
        )
    
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this session"
        )


@router.post("/sessions", response_model=ConversationSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: CreateSessionRequest,
    current_user: User = Depends(require_auth),
    conversation_manager: ConversationManager = Depends(get_conversation_manager)
) -> ConversationSessionResponse:
    """
    Create a new conversation session for a user.
    
    This endpoint initializes a new conversation session with the specified
    interaction mode. The session will track all messages and maintain context
    for multi-turn dialogue.
    
    - **user_id**: UUID of the user starting the conversation
    - **interaction_mode**: Mode of interaction (socratic, wisdom, story)
    
    Returns the created session with its unique ID and metadata.
    """
    try:
        session = await conversation_manager.create_session(
            user_id=current_user.id,
            interaction_mode=request.interaction_mode
        )
        
        logger.info(f"Created conversation session {session.id} for user {current_user.id}")
        return session
        
    except ValueError as e:
        logger.error(f"Invalid request for session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating conversation session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation session"
        )


@router.post("/messages", response_model=ConversationMessageResponse, status_code=status.HTTP_201_CREATED)
async def add_message(
    session_id: uuid.UUID,
    request: AddMessageRequest,
    current_user: User = Depends(require_auth),
    conversation_manager: ConversationManager = Depends(get_conversation_manager)
) -> ConversationMessageResponse:
    """
    Add a message to an existing conversation session.
    
    This endpoint stores a new message in the conversation history and updates
    the session's message count. Messages can include emotion data and verse
    references for enhanced context tracking.
    
    - **session_id**: UUID of the conversation session (path parameter)
    - **role**: Role of the message sender (user or assistant)
    - **content**: The message content
    - **emotion_data**: Optional emotion detection data with label, confidence, emoji, color
    - **verse_id**: Optional verse ID if a verse was referenced
    
    Returns the created message with its metadata and sequence number.
    """
    try:
        # Verify session ownership
        await verify_session_ownership(session_id, current_user, conversation_manager)
        
        message = await conversation_manager.add_message(
            session_id=session_id,
            role=request.role,
            content=request.content,
            emotion_data=request.emotion_data,
            verse_id=request.verse_id
        )
        
        logger.info(f"Added message {message.id} to session {session_id}")
        return message
        
    except ValueError as e:
        logger.error(f"Invalid request for adding message: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error adding message to session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add message to conversation"
        )


@router.get("/{session_id}/context", response_model=ConversationContextResponse)
async def get_conversation_context(
    session_id: uuid.UUID,
    window_size: Optional[int] = None,
    current_user: User = Depends(require_auth),
    conversation_manager: ConversationManager = Depends(get_conversation_manager)
) -> ConversationContextResponse:
    """
    Retrieve recent conversation context for a session.
    
    This endpoint returns the recent message history for a conversation session,
    which can be used to maintain context in multi-turn dialogues. The default
    window size returns the last 10 messages (5 exchanges).
    
    - **session_id**: UUID of the conversation session
    - **window_size**: Number of recent messages to retrieve (optional, default: 10)
    
    Returns the conversation context with messages in chronological order
    and the total message count for the session.
    """
    try:
        # Verify session ownership
        await verify_session_ownership(session_id, current_user, conversation_manager)
        
        context = await conversation_manager.get_context(
            session_id=session_id,
            window_size=window_size
        )
        
        logger.info(f"Retrieved context for session {session_id}: {len(context.messages)} messages")
        return context
        
    except ValueError as e:
        logger.error(f"Invalid request for conversation context: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving conversation context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation context"
        )


@router.post("/{session_id}/end", response_model=ConversationSessionResponse)
async def end_session(
    session_id: uuid.UUID,
    request: EndSessionRequest,
    current_user: User = Depends(require_auth),
    conversation_manager: ConversationManager = Depends(get_conversation_manager)
) -> ConversationSessionResponse:
    """
    End a conversation session and optionally add a summary.
    
    This endpoint marks a conversation session as ended and can store a
    summary of the conversation for future reference. Once ended, no new
    messages can be added to the session.
    
    - **session_id**: UUID of the conversation session
    - **summary**: Optional summary of the conversation
    
    Returns the updated session with the end timestamp and summary.
    """
    try:
        # Verify session ownership
        await verify_session_ownership(session_id, current_user, conversation_manager)
        
        session = await conversation_manager.end_session(
            session_id=session_id,
            summary=request.summary
        )
        
        logger.info(f"Ended conversation session {session_id}")
        return session
        
    except ValueError as e:
        logger.error(f"Invalid request for ending session: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error ending conversation session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end conversation session"
        )


@router.get("/{session_id}", response_model=ConversationSessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
) -> ConversationSessionResponse:
    """
    Retrieve details for a specific conversation session.
    
    This endpoint returns the metadata for a conversation session including
    start/end times, interaction mode, message count, and summary.
    
    - **session_id**: UUID of the conversation session
    
    Returns the session details.
    """
    try:
        from app.models.conversation import ConversationSession
        
        session = db.query(ConversationSession).filter(
            ConversationSession.id == session_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session with id {session_id} not found"
            )
        
        # Verify session ownership
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You don't have permission to access this session"
            )
        
        return ConversationSessionResponse.from_orm(session)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session"
        )


@router.get("/history")
async def get_chat_history(
    limit: int = 10,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get user's chat history with recent conversations and messages.
    
    Returns a summary of recent conversations including session metadata
    and the most recent messages from each session.
    """
    try:
        # Try direct database connection first
        try:
            # Get recent conversation sessions
            sessions = db.query(ConversationSession).filter(
                ConversationSession.user_id == current_user.id
            ).order_by(desc(ConversationSession.started_at)).limit(limit).all()
            
            chat_history = []
            for session in sessions:
                # Get recent messages from this session
                messages = db.query(ConversationMessage).filter(
                    ConversationMessage.session_id == session.id
                ).order_by(ConversationMessage.sequence_number).limit(10).all()
                
                session_data = {
                    "session_id": str(session.id),
                    "started_at": session.started_at.isoformat(),
                    "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                    "interaction_mode": session.interaction_mode,
                    "message_count": session.message_count,
                    "summary": session.summary,
                    "messages": [
                        {
                            "id": str(msg.id),
                            "role": msg.role,
                            "content": msg.content[:200] + "..." if len(msg.content) > 200 else msg.content,
                            "emotion_label": msg.emotion_label,
                            "emotion_emoji": msg.emotion_emoji,
                            "verse_id": msg.verse_id,
                            "created_at": msg.created_at.isoformat()
                        }
                        for msg in messages
                    ]
                }
                chat_history.append(session_data)
            
            return {
                "chat_history": chat_history,
                "total_sessions": len(sessions),
                "user_id": str(current_user.id)
            }
            
        except Exception as db_error:
            logger.warning(f"Direct database connection failed, trying Supabase service: {db_error}")
            logger.info("This is likely due to network connectivity issues with the PostgreSQL connection")
            
            # Fallback to Supabase service
            from app.services.supabase_service import get_supabase_service
            supabase_service = get_supabase_service()
            logger.info("Using Supabase REST API as fallback")
            
            # Get conversation history using Supabase service
            conversations = await supabase_service.get_conversation_history(str(current_user.id), limit)
            
            chat_history = []
            for session in conversations:
                messages = session.get('conversation_messages', [])
                
                session_data = {
                    "session_id": str(session['id']),
                    "started_at": session['started_at'],
                    "ended_at": session.get('ended_at'),
                    "interaction_mode": session.get('interaction_mode', 'wisdom'),
                    "message_count": session.get('message_count', len(messages)),
                    "summary": session.get('summary'),
                    "messages": [
                        {
                            "id": str(msg['id']),
                            "role": msg['role'],
                            "content": msg['content'][:200] + "..." if len(msg['content']) > 200 else msg['content'],
                            "emotion_label": msg.get('emotion_label'),
                            "emotion_emoji": msg.get('emotion_emoji'),
                            "verse_id": msg.get('verse_id'),
                            "created_at": msg['created_at']
                        }
                        for msg in messages[:10]  # Limit to 10 messages
                    ]
                }
                chat_history.append(session_data)
            
            return {
                "chat_history": chat_history,
                "total_sessions": len(conversations),
                "user_id": str(current_user.id)
            }
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat history"
        )


@router.get("/health")
async def conversation_service_health(
    db: Session = Depends(get_db)
) -> dict:
    """
    Health check endpoint for the conversation service.
    
    Returns the status of the conversation management service and database connectivity.
    """
    try:
        # Test database connectivity
        from app.models.conversation import ConversationSession
        db.query(ConversationSession).limit(1).all()
        
        return {
            "status": "healthy",
            "service": "conversation_management",
            "database": "connected",
            "message": "Conversation service is operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Conversation service is not operational"
        }