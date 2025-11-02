#!/usr/bin/env python3
"""
Setup script for GitaGPT Supabase database
Run this to initialize your Supabase database with all required tables
"""

import asyncio
import sys
from app.db.supabase_client import test_supabase_connection, create_supabase_tables
from app.services.supabase_service import get_supabase_service

async def setup_supabase():
    """Complete Supabase setup"""
    print("🕉️ GitaGPT Supabase Setup")
    print("=" * 50)
    
    # Test connection
    print("1. Testing Supabase connection...")
    if test_supabase_connection():
        print("   ✅ Supabase connection successful!")
    else:
        print("   ❌ Supabase connection failed!")
        print("   Please check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file")
        return False
    
    # Check tables
    print("\n2. Checking Supabase tables...")
    if create_supabase_tables():
        print("   ✅ Supabase tables are accessible!")
    else:
        print("   ⚠️ Some tables might be missing")
        print("   Please run the SQL script in supabase_setup.sql in your Supabase SQL Editor")
    
    # Test service
    print("\n3. Testing Supabase service...")
    try:
        service = get_supabase_service()
        print("   ✅ Supabase service initialized successfully!")
    except Exception as e:
        print(f"   ❌ Supabase service failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Supabase setup completed!")
    print("\nNext steps:")
    print("1. Run the SQL script in 'supabase_setup.sql' in your Supabase SQL Editor")
    print("2. Make sure Row Level Security (RLS) is enabled")
    print("3. Test your authentication with Firebase")
    print("4. Start chatting and see your data in Supabase!")
    
    return True

if __name__ == "__main__":
    success = asyncio.run(setup_supabase())
    sys.exit(0 if success else 1)