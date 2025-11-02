'use client';
import React, { useState } from 'react';
import { Sparkles, MessageSquare, BookOpen, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

const Navigation = ({ darkMode, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Pages that should show the back button
  const pagesWithBackButton = ['/profile', '/settings', '/spiritual-progress', '/my-journey'];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${darkMode ? 'bg-slate-900' : 'bg-white'} border-r ${
        darkMode ? 'border-amber-700/30' : 'border-orange-200'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`p-4 border-b ${
            darkMode ? 'border-amber-700/30' : 'border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="relative">
                  <Sparkles className={`w-6 h-6 transition-all duration-300 ${
                    darkMode 
                      ? 'text-amber-400 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]' 
                      : 'text-orange-600 group-hover:text-orange-500 drop-shadow-[0_0_8px_rgba(234,88,12,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(234,88,12,0.6)]'
                  }`} />
                  <div className={`absolute inset-0 rounded-full blur-md transition-all duration-300 ${
                    darkMode 
                      ? 'bg-amber-400/20 group-hover:bg-amber-300/30' 
                      : 'bg-orange-600/15 group-hover:bg-orange-500/25'
                  }`}></div>
                </div>
                <h2 className={`font-bold transition-all duration-300 ${
                  darkMode 
                    ? 'text-amber-100 group-hover:text-amber-50 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)] group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                    : 'text-slate-900 group-hover:text-slate-800 drop-shadow-[0_0_4px_rgba(234,88,12,0.2)] group-hover:drop-shadow-[0_0_8px_rgba(234,88,12,0.4)]'
                }`}>
                  GitaGPT
                </h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-1 rounded ${
                  darkMode ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-gray-100 text-slate-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* User Status */}
          {isAuthenticated && user && (
            <div className={`p-4 border-b ${
              darkMode ? 'border-amber-700/30' : 'border-orange-200'
            }`}>
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-amber-900/30' : 'bg-orange-100'
                  }`}>
                    <span className={`text-sm font-semibold ${
                      darkMode ? 'text-amber-300' : 'text-orange-600'
                    }`}>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    darkMode ? 'text-amber-200' : 'text-slate-900'
                  }`}>
                    {user.displayName || 'Spiritual Seeker'}
                  </p>
                  <p className={`text-xs truncate ${
                    darkMode ? 'text-amber-400' : 'text-slate-600'
                  }`}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            <a
              href="/dashboard"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-amber-900/30 text-amber-200' 
                  : 'hover:bg-orange-100 text-slate-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              <span>Dashboard</span>
            </a>
            
            <a
              href="/chat"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-amber-900/30 text-amber-200' 
                  : 'hover:bg-orange-100 text-slate-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </a>
            
            <a
              href="/my-journey"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-amber-900/30 text-amber-200' 
                  : 'hover:bg-orange-100 text-slate-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>My Journey</span>
            </a>
            
            <a
              href="/spiritual-progress"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-amber-900/30 text-amber-200' 
                  : 'hover:bg-orange-100 text-slate-700'
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Spiritual Progress</span>
            </a>
            
            <a
              href="/profile"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-amber-900/30 text-amber-200' 
                  : 'hover:bg-orange-100 text-slate-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </a>
            
            <a
              href="/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-amber-900/30 text-amber-200' 
                  : 'hover:bg-orange-100 text-slate-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </a>
            
            {/* Authentication */}
            <div className="mt-4 pt-4 border-t border-amber-700/30">
              {isAuthenticated ? (
                <button
                  onClick={async () => {
                    const { logOut } = await import('@/lib/firebase');
                    await logOut();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-red-900/30 text-red-300' 
                      : 'hover:bg-red-100 text-red-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const { signInWithGoogle } = await import('@/lib/firebase');
                    await signInWithGoogle();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-amber-900/30 text-amber-200' 
                      : 'hover:bg-orange-100 text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Top Navigation Bar */}
        <div className={`backdrop-blur-md border-b transition-all relative z-30 ${
          darkMode 
            ? 'bg-slate-900/80 border-amber-900/30' 
            : 'bg-white/80 border-amber-200/50'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Sidebar Toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-300' 
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Back to Dashboard - Only show on specific pages */}
                {pagesWithBackButton.includes(pathname) && (
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-300' 
                        : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                    }`}
                    title="Back to Dashboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                )}
                
                {/* GitaGPT Logo with Book and Mastery Effect + Glow */}
                <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.href = '/dashboard'}>
                  <div className={`relative p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    darkMode 
                      ? 'bg-amber-900/30 group-hover:bg-amber-900/50 shadow-[0_0_20px_rgba(251,191,36,0.3)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]' 
                      : 'bg-orange-100 group-hover:bg-orange-200 shadow-[0_0_15px_rgba(234,88,12,0.2)] group-hover:shadow-[0_0_25px_rgba(234,88,12,0.4)]'
                  }`}>
                    <BookOpen className={`w-5 h-5 transition-all duration-300 ${
                      darkMode 
                        ? 'text-amber-400 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,1)]' 
                        : 'text-orange-600 group-hover:text-orange-500 drop-shadow-[0_0_6px_rgba(234,88,12,0.6)] group-hover:drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]'
                    }`} />
                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-all duration-300 ${
                      darkMode 
                        ? 'bg-amber-400 group-hover:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)] group-hover:shadow-[0_0_12px_rgba(251,191,36,1)]' 
                        : 'bg-orange-500 group-hover:bg-orange-400 shadow-[0_0_6px_rgba(234,88,12,0.7)] group-hover:shadow-[0_0_10px_rgba(234,88,12,0.9)]'
                    } group-hover:scale-125`}></div>
                    {/* Additional glow layer for the book icon */}
                    <div className={`absolute inset-0 rounded-xl blur-md transition-all duration-300 ${
                      darkMode 
                        ? 'bg-amber-400/20 group-hover:bg-amber-300/30' 
                        : 'bg-orange-600/15 group-hover:bg-orange-500/25'
                    }`}></div>
                  </div>
                  <div className="transition-all duration-300 group-hover:translate-x-1">
                    <h1 className={`text-lg font-bold transition-all duration-300 ${
                      darkMode 
                        ? 'text-amber-100 group-hover:text-amber-50 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] group-hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]' 
                        : 'text-slate-900 group-hover:text-slate-800 drop-shadow-[0_0_8px_rgba(234,88,12,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(234,88,12,0.6)]'
                    }`}>
                      GitaGPT
                    </h1>
                    <p className={`text-xs transition-all duration-300 ${
                      darkMode 
                        ? 'text-amber-300 group-hover:text-amber-200 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                        : 'text-slate-600 group-hover:text-slate-700 drop-shadow-[0_0_4px_rgba(234,88,12,0.3)] group-hover:drop-shadow-[0_0_6px_rgba(234,88,12,0.4)]'
                    }`}>
                      Your spiritual companion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Navigation;