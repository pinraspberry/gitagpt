"""
Comprehensive Supabase service for GitaGPT
Handles all database operations using Supabase client
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class SupabaseService:
    """Service class for all Supabase operations"""
    
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    
    # User Management
    async def create_or_update_user(self, firebase_uid: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user in Supabase"""
        try:
            # Check if user exists
            existing_user = self.client.table('users').select('*').eq('firebase_uid', firebase_uid).execute()
            
            if existing_user.data:
                # Update existing user
                result = self.client.table('users').update({
                    'email': user_data.get('email'),
                    'display_name': user_data.get('display_name'),
                    'last_active': datetime.utcnow().isoformat(),
                    'preferences': user_data.get('preferences', {})
                }).eq('firebase_uid', firebase_uid).execute()
                
                logger.info(f"Updated user {firebase_uid}")
                return result.data[0] if result.data else {}
            else:
                # Create new user
                result = self.client.table('users').insert({
                    'firebase_uid': firebase_uid,
                    'email': user_data.get('email'),
                    'display_name': user_data.get('display_name'),
                    'preferences': user_data.get('preferences', {}),
                    'last_active': datetime.utcnow().isoformat()
                }).execute()
                
                logger.info(f"Created new user {firebase_uid}")
                return result.data[0] if result.data else {}
                
        except Exception as e:
            logger.error(f"Error creating/updating user: {e}")
            raise
    
    async def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Get user by Firebase UID"""
        try:
            result = self.client.table('users').select('*').eq('firebase_uid', firebase_uid).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            return None
    
    # Conversation Management
    async def create_conversation_session(self, user_id: str, interaction_mode: str = 'wisdom') -> Dict[str, Any]:
        """Create a new conversation session"""
        try:
            result = self.client.table('conversation_sessions').insert({
                'user_id': user_id,
                'interaction_mode': interaction_mode,
                'started_at': datetime.utcnow().isoformat()
            }).execute()
            
            logger.info(f"Created conversation session for user {user_id}")
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Error creating conversation session: {e}")
            raise
    
    async def add_message_to_conversation(self, session_id: str, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a message to a conversation session"""
        try:
            # Get current message count for sequence number
            session_result = self.client.table('conversation_sessions').select('message_count').eq('id', session_id).execute()
            current_count = session_result.data[0]['message_count'] if session_result.data else 0
            
            # Insert message
            result = self.client.table('conversation_messages').insert({
                'session_id': session_id,
                'role': message_data['role'],
                'content': message_data['content'],
                'emotion_label': message_data.get('emotion_label'),
                'emotion_confidence': message_data.get('emotion_confidence'),
                'emotion_emoji': message_data.get('emotion_emoji'),
                'emotion_color': message_data.get('emotion_color'),
                'verse_id': message_data.get('verse_id'),
                'sequence_number': current_count + 1,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            
            logger.info(f"Added message to session {session_id}")
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Error adding message: {e}")
            raise
    
    async def get_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's conversation history"""
        try:
            # Get recent sessions
            sessions_result = self.client.table('conversation_sessions').select(
                '*, conversation_messages(*)'
            ).eq('user_id', user_id).order('started_at', desc=True).limit(limit).execute()
            
            return sessions_result.data if sessions_result.data else []
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def get_session_context(self, session_id: str, window_size: int = 10) -> List[Dict[str, Any]]:
        """Get recent messages from a conversation session"""
        try:
            result = self.client.table('conversation_messages').select('*').eq(
                'session_id', session_id
            ).order('sequence_number', desc=True).limit(window_size).execute()
            
            # Reverse to get chronological order
            messages = list(reversed(result.data)) if result.data else []
            return messages
        except Exception as e:
            logger.error(f"Error getting session context: {e}")
            return []
    
    # Analytics and Progress
    async def log_emotion(self, user_id: str, session_id: str, emotion_data: Dict[str, Any], user_input: str, verse_ids: List[str] = None) -> Dict[str, Any]:
        """Log emotion for analytics"""
        try:
            result = self.client.table('emotion_logs').insert({
                'user_id': user_id,
                'session_id': session_id,
                'emotion_label': emotion_data['label'],
                'emotion_confidence': emotion_data['confidence'],
                'emotion_emoji': emotion_data.get('emoji'),
                'emotion_color': emotion_data.get('color'),
                'user_input': user_input,
                'verse_ids': verse_ids or [],
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Error logging emotion: {e}")
            raise
    
    async def get_user_spiritual_progress(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive spiritual progress for a user"""
        try:
            # Get total conversations
            conversations_result = self.client.table('conversation_sessions').select(
                'id', count='exact'
            ).eq('user_id', user_id).execute()
            total_conversations = conversations_result.count or 0
            
            # Get total messages
            messages_result = self.client.table('conversation_messages').select(
                'id', count='exact'
            ).eq('session_id', 'in', f"(SELECT id FROM conversation_sessions WHERE user_id = '{user_id}')").eq('role', 'user').execute()
            total_messages = messages_result.count or 0
            
            # Get favorite interaction mode
            mode_result = self.client.rpc('get_favorite_interaction_mode', {'user_uuid': user_id}).execute()
            favorite_mode = mode_result.data[0] if mode_result.data else 'wisdom'
            
            # Get most common emotion
            emotion_result = self.client.table('emotion_logs').select(
                'emotion_label'
            ).eq('user_id', user_id).execute()
            
            emotions = [log['emotion_label'] for log in emotion_result.data] if emotion_result.data else []
            most_common_emotion = max(set(emotions), key=emotions.count) if emotions else 'neutral'
            
            # Get verses explored
            verses_result = self.client.table('conversation_messages').select(
                'verse_id'
            ).neq('verse_id', None).execute()
            unique_verses = len(set([msg['verse_id'] for msg in verses_result.data])) if verses_result.data else 0
            
            # Calculate spiritual streak
            recent_sessions = self.client.table('conversation_sessions').select(
                'started_at'
            ).eq('user_id', user_id).gte(
                'started_at', (datetime.utcnow() - timedelta(days=30)).isoformat()
            ).order('started_at', desc=True).execute()
            
            # Calculate consecutive days
            spiritual_streak = 0
            if recent_sessions.data:
                dates = [datetime.fromisoformat(session['started_at'].replace('Z', '+00:00')).date() 
                        for session in recent_sessions.data]
                unique_dates = sorted(set(dates), reverse=True)
                
                current_date = datetime.utcnow().date()
                for date in unique_dates:
                    if date == current_date - timedelta(days=spiritual_streak):
                        spiritual_streak += 1
                    else:
                        break
            
            return {
                'total_conversations': total_conversations,
                'total_messages': total_messages,
                'favorite_interaction_mode': favorite_mode,
                'most_common_emotion': most_common_emotion,
                'spiritual_streak_days': spiritual_streak,
                'verses_explored': unique_verses
            }
            
        except Exception as e:
            logger.error(f"Error getting spiritual progress: {e}")
            return {}
    
    async def get_recent_activity(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent activity for analytics"""
        try:
            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            result = self.client.table('conversation_sessions').select(
                'started_at', 'interaction_mode'
            ).eq('user_id', user_id).gte('started_at', start_date).execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting recent activity: {e}")
            return []
    
    # Verse Management
    async def update_verse_usage(self, verse_id: str, verse_data: Dict[str, Any] = None) -> None:
        """Update verse usage statistics"""
        try:
            # Check if verse exists
            existing = self.client.table('verse_metadata').select('*').eq('id', verse_id).execute()
            
            if existing.data:
                # Update usage count
                self.client.table('verse_metadata').update({
                    'usage_count': existing.data[0]['usage_count'] + 1,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('id', verse_id).execute()
            elif verse_data:
                # Create new verse entry
                self.client.table('verse_metadata').insert({
                    'id': verse_id,
                    'chapter': verse_data.get('chapter', 0),
                    'verse': verse_data.get('verse', 0),
                    'shloka': verse_data.get('shloka', ''),
                    'transliteration': verse_data.get('transliteration', ''),
                    'eng_meaning': verse_data.get('eng_meaning', ''),
                    'usage_count': 1
                }).execute()
                
        except Exception as e:
            logger.error(f"Error updating verse usage: {e}")

# Singleton instance
_supabase_service = None

def get_supabase_service() -> SupabaseService:
    """Get or create singleton Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service