#!/usr/bin/env python3
"""
Production startup script for GitaGPT
Ensures all services are ready before starting the server
"""

import asyncio
import sys
from app.db.supabase_client import test_supabase_connection
from app.services.supabase_service import get_supabase_service
from app.services.emotion_detection import get_emotion_service
from app.services.reflection_generation import get_reflection_service

async def startup_checks():
    """Run all startup checks"""
    print("🕉️ GitaGPT Production Startup")
    print("=" * 50)
    
    checks_passed = 0
    total_checks = 4
    
    # 1. Test Supabase connection
    print("1. Testing Supabase connection...")
    if test_supabase_connection():
        print("   ✅ Supabase connection successful!")
        checks_passed += 1
    else:
        print("   ❌ Supabase connection failed!")
    
    # 2. Test Supabase service
    print("2. Testing Supabase service...")
    try:
        service = get_supabase_service()
        print("   ✅ Supabase service ready!")
        checks_passed += 1
    except Exception as e:
        print(f"   ❌ Supabase service failed: {e}")
    
    # 3. Test emotion detection
    print("3. Testing emotion detection...")
    try:
        emotion_service = get_emotion_service()
        test_result = emotion_service.detect_emotion("I am happy", threshold=0.15)
        print(f"   ✅ Emotion detection ready! (detected: {test_result[0]['label']})")
        checks_passed += 1
    except Exception as e:
        print(f"   ❌ Emotion detection failed: {e}")
    
    # 4. Test reflection generation
    print("4. Testing reflection generation...")
    try:
        reflection_service = get_reflection_service()
        print("   ✅ Reflection generation ready!")
        checks_passed += 1
    except Exception as e:
        print(f"   ❌ Reflection generation failed: {e}")
    
    print("\n" + "=" * 50)
    print(f"Startup checks: {checks_passed}/{total_checks} passed")
    
    if checks_passed == total_checks:
        print("🎉 All systems ready! Starting GitaGPT server...")
        return True
    else:
        print("⚠️ Some systems not ready. Server may have limited functionality.")
        return False

if __name__ == "__main__":
    success = asyncio.run(startup_checks())
    if success:
        print("\n🚀 Run: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    sys.exit(0 if success else 1)