"""
Supabase client configuration and utilities
"""
import os
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = None

def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global supabase
    if supabase is None:
        try:
            supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    return supabase

def test_supabase_connection() -> bool:
    """Test Supabase connection"""
    try:
        client = get_supabase_client()
        # Try to access the auth service
        response = client.auth.get_session()
        logger.info("Supabase connection test successful")
        return True
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return False

def create_supabase_tables():
    """Create tables using Supabase client if they don't exist"""
    try:
        client = get_supabase_client()
        
        # Check if tables exist by trying to query them
        tables_to_check = ['users', 'conversation_sessions', 'conversation_messages', 'emotion_logs']
        
        for table in tables_to_check:
            try:
                result = client.table(table).select("*").limit(1).execute()
                logger.info(f"Table '{table}' exists and is accessible")
            except Exception as e:
                logger.warning(f"Table '{table}' might not exist or is not accessible: {e}")
        
        return True
    except Exception as e:
        logger.error(f"Error checking Supabase tables: {e}")
        return False