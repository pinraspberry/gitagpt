'use client';
import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/shared/Navigation';
import WelcomeSection from '@/components/dashboard/WelcomeSection';
import TodaysVerse from '@/components/dashboard/TodaysVerse';
import SpiritualProgress from '@/components/dashboard/SpiritualProgress';
import RecentChats from '@/components/dashboard/RecentChats';
import { useThemeMode } from '@/hooks/useThemeMode';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useThemeMode();
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900">
        <div className="text-amber-100 text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const userName = user?.displayName?.split(' ')[0] || 'Seeker';

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode 
        ? 'dark' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 text-slate-800'
    }`}>
      <Navigation darkMode={darkMode}>
        <div className="p-6">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full transition-all ${
                darkMode 
                  ? 'bg-amber-900/50 hover:bg-amber-900 text-amber-300' 
                  : 'bg-white hover:bg-gray-100 text-slate-700 shadow-md'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="max-w-7xl mx-auto space-y-8">
            <WelcomeSection darkMode={darkMode} userName={userName} />
            
            <div className="grid lg:grid-cols-2 gap-8">
              <TodaysVerse darkMode={darkMode} />
              <SpiritualProgress darkMode={darkMode} />
            </div>

            <RecentChats darkMode={darkMode} />
          </div>
        </div>
      </Navigation>
    </div>
  );
}