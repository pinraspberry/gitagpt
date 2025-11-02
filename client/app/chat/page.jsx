'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, BookOpen, Brain, MessageSquare, Smile, Heart, Cloud, Zap, Loader2, RotateCcw, Copy, Share2, Star, ChevronDown, AlertCircle } from 'lucide-react';
import { sendChatMessage, createSession } from '@/lib/api';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = () => {
  const [darkMode, setDarkMode] = useThemeMode();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('wisdom');
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const modes = [
    { 
      id: 'wisdom', 
      icon: BookOpen, 
      label: 'Wisdom', 
      description: 'Direct teachings and clear insights from Krishna',
      color: 'orange'
    },
    { 
      id: 'socratic', 
      icon: Brain, 
      label: 'Socratic', 
      description: 'Guided self-discovery through thoughtful questions',
      color: 'purple'
    },
    { 
      id: 'story', 
      icon: MessageSquare, 
      label: 'Story', 
      description: 'Narrative context and stories from the Mahabharata',
      color: 'blue'
    }
  ];



  // Don't initialize session on mount - let the chat API handle it
  // This avoids the 401 error for unauthenticated users
  useEffect(() => {
    // Session will be created automatically on first message
    console.log('Chat interface initialized - session will be created on first message');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Call backend API
      console.log('🚀 Sending message:', currentInput);
      console.log('📡 API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1');
      const response = await sendChatMessage(currentInput, sessionId, mode);
      console.log('✅ Received response:', response);
      console.log('📝 Response reflection length:', response.reflection?.length);
      console.log('🔍 Full reflection content:', response.reflection);
      console.log('📊 Response keys:', Object.keys(response));
      console.log('😊 Emotion:', response.emotion);
      console.log('📖 Verses count:', response.verses?.length);
      console.log('🎯 Intent:', response.intent);
      console.log('⚠️ Fallback used:', response.fallback_used);
      
      // Update session ID if it was created
      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
      }
      
      // Create AI message from response
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reflection,
        emotion: response.emotion,
        verses: response.verses,
        timestamp: new Date(),
        confidence: response.emotion?.confidence || null,
        intent: response.intent,
        intent_confidence: response.intent_confidence
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        role: 'error',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const currentMode = modes.find(m => m.id === mode);

  return (
    <div className={`flex h-screen transition-colors duration-500 ${
      darkMode 
        ? 'dark' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100'
    }`}>
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
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-6 h-6 ${
                  darkMode ? 'text-amber-400' : 'text-orange-600'
                }`} />
                <h2 className={`font-bold ${
                  darkMode ? 'text-amber-100' : 'text-slate-900'
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
                  ? 'bg-amber-900/30 text-amber-200' 
                  : 'bg-orange-100 text-orange-700'
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
      {/* Header */}
      <div className={`backdrop-blur-md border-b transition-all relative z-30 ${
        darkMode 
          ? 'bg-slate-900/80 border-amber-900/30' 
          : 'bg-white/80 border-amber-200/50'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center justify-between mb-2">
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
              
              {/* Back to Dashboard */}
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
              
              <div className={`p-2 rounded-xl ${
                darkMode ? 'bg-amber-900/30' : 'bg-orange-100'
              }`}>
                <Sparkles className={`w-5 h-5 ${
                  darkMode ? 'text-amber-400' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${
                  darkMode ? 'text-amber-100' : 'text-slate-900'
                }`}>
                  GitaGPT Companion
                </h1>
                <p className={`text-xs ${
                  darkMode ? 'text-amber-300' : 'text-slate-600'
                }`}>
                  Your spiritual guide powered by AI
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-300' 
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mode Selector */}
          <div className="relative z-40">
            <button
              onClick={() => setShowModeInfo(!showModeInfo)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                darkMode
                  ? 'bg-slate-800/50 hover:bg-slate-800 border border-amber-700/30'
                  : 'bg-white hover:bg-gray-50 border border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {React.createElement(currentMode.icon, { 
                  className: `w-5 h-5 text-${currentMode.color}-500` 
                })}
                <div className="text-left">
                  <p className={`font-semibold ${
                    darkMode ? 'text-amber-100' : 'text-slate-900'
                  }`}>
                    {currentMode.label} Mode
                  </p>
                  <p className={`text-xs ${
                    darkMode ? 'text-amber-300' : 'text-slate-600'
                  }`}>
                    {currentMode.description}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${
                showModeInfo ? 'rotate-180' : ''
              } ${darkMode ? 'text-amber-400' : 'text-slate-600'}`} />
            </button>

            {showModeInfo && (
              <div className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-xl border z-50 ${
                darkMode
                  ? 'bg-slate-800 border-amber-700/30'
                  : 'bg-white border-amber-200 shadow-xl'
              }`}>
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      setShowModeInfo(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      mode === m.id
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                        : darkMode
                        ? 'hover:bg-slate-700 text-amber-200'
                        : 'hover:bg-gray-100 text-slate-700'
                    }`}
                  >
                    {React.createElement(m.icon, { className: 'w-5 h-5' })}
                    <div className="text-left flex-1">
                      <p className="font-semibold">{m.label}</p>
                      <p className={`text-xs ${
                        mode === m.id ? 'text-white/80' : 'opacity-75'
                      }`}>
                        {m.description}
                      </p>
                    </div>
                    {mode === m.id && <Zap className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Error Banner */}
          {error && (
            <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
              darkMode
                ? 'bg-red-900/20 border-red-700/30 text-red-200'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className={`inline-flex p-6 rounded-full mb-6 ${
                darkMode ? 'bg-amber-900/30' : 'bg-orange-100'
              }`}>
                <Heart className={`w-16 h-16 ${
                  darkMode ? 'text-amber-400' : 'text-orange-500'
                }`} />
              </div>
              <h2 className={`text-3xl font-bold mb-4 ${
                darkMode ? 'text-amber-100' : 'text-slate-900'
              }`}>
                Welcome, {isAuthenticated ? (user?.displayName?.split(' ')[0] || 'Seeker') : 'Seeker'} 🙏
              </h2>
              <p className={`text-lg mb-6 ${
                darkMode ? 'text-amber-200' : 'text-slate-600'
              }`}>
                Share what's on your mind. I'm here to guide you with wisdom from the Bhagavad Gita.
              </p>

              
              {!isAuthenticated && (
                <div className={`max-w-md mx-auto p-4 rounded-xl border mb-6 ${
                  darkMode 
                    ? 'bg-amber-900/20 border-amber-700/30 text-amber-200' 
                    : 'bg-orange-50 border-orange-200 text-orange-800'
                }`}>
                  <p className="text-sm">
                    💡 <strong>Sign in</strong> to save your conversations and track your spiritual journey!
                  </p>
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                {[
                  { icon: Brain, text: "I understand your emotions", color: "blue" },
                  { icon: BookOpen, text: "I find relevant verses", color: "orange" },
                  { icon: Sparkles, text: "I provide personalized guidance", color: "purple" }
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? 'bg-slate-800/50 border-amber-700/30'
                        : 'bg-white border-amber-200 shadow-lg'
                    }`}
                  >
                    {React.createElement(feature.icon, {
                      className: `w-8 h-8 mx-auto mb-3 text-${feature.color}-500`
                    })}
                    <p className={`text-sm ${
                      darkMode ? 'text-amber-200' : 'text-slate-700'
                    }`}>
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } animate-fade-in relative z-10`}
            >
              <div className={`max-w-[85%] ${
                message.role === 'user' ? 'ml-12' : 'mr-12'
              }`}>
                {/* User Message */}
                {message.role === 'user' && (
                  <div className="relative group">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-lg">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-xs mt-2 opacity-75">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {message.role === 'error' && (
                  <div className={`rounded-2xl rounded-tl-sm p-6 border-2 ${
                    darkMode
                      ? 'bg-red-900/20 border-red-700/30'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <AlertCircle className={`w-6 h-6 flex-shrink-0 ${
                        darkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                      <div className="flex-1">
                        <p className={`font-semibold mb-2 ${
                          darkMode ? 'text-red-200' : 'text-red-800'
                        }`}>
                          Error
                        </p>
                        <p className={`leading-relaxed ${
                          darkMode ? 'text-red-300' : 'text-red-700'
                        }`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                    <p className={`text-xs mt-4 ${
                      darkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {/* AI Message */}
                {message.role === 'assistant' && (
                  <div className={`rounded-2xl rounded-tl-sm p-6 ${
                    darkMode
                      ? 'bg-gradient-to-br from-slate-800/90 to-amber-900/20 border border-amber-700/30'
                      : 'bg-white border border-amber-200 shadow-xl'
                  }`}>
                    {/* Emotion Indicator */}
                    {message.emotion && (
                      <div className={`inline-flex items-center space-x-3 mb-4 px-4 py-2 rounded-full ${
                        darkMode ? 'bg-slate-700/50' : 'bg-orange-50'
                      }`}>
                        <span className="text-2xl">{message.emotion.emoji}</span>
                        <div>
                          <p className={`text-sm font-semibold ${
                            darkMode ? 'text-amber-200' : 'text-slate-800'
                          }`}>
                            Detected: {message.emotion.label}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                                style={{ width: `${message.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs opacity-75">
                              {Math.round(message.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verses */}
                    {message.verses && message.verses.length > 0 && (
                      <div className="space-y-4 mb-6">
                        {message.verses.map((verse, vIdx) => (
                          <div
                            key={vIdx}
                            className={`p-5 rounded-xl border-l-4 ${
                              darkMode
                                ? 'bg-amber-900/20 border-amber-500'
                                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-orange-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-bold text-orange-600">
                                📖 Chapter {verse.chapter}, Verse {verse.verse}
                              </p>
                              <button
                                onClick={() => copyMessage(verse.shloka)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  darkMode ? 'hover:bg-slate-700' : 'hover:bg-orange-100'
                                }`}
                              >
                                <Copy className="w-4 h-4 opacity-50" />
                              </button>
                            </div>
                            <p className={`font-serif text-xl mb-3 leading-relaxed ${
                              darkMode ? 'text-amber-200' : 'text-slate-800'
                            }`}>
                              {verse.shloka}
                            </p>
                            {verse.transliteration && (
                              <p className={`text-sm italic mb-2 ${
                                darkMode ? 'text-amber-300' : 'text-slate-600'
                              }`}>
                                {verse.transliteration}
                              </p>
                            )}
                            <p className={`text-sm font-medium ${
                              darkMode ? 'text-amber-100' : 'text-slate-700'
                            }`}>
                              {verse.eng_meaning || verse.meaning}
                            </p>
                            {verse.similarity_score && (
                              <p className={`text-xs mt-2 ${
                                darkMode ? 'text-amber-400' : 'text-slate-500'
                              }`}>
                                Relevance: {Math.round(verse.similarity_score * 100)}%
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Response */}
                    <div className="leading-relaxed mb-4 max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom styling for code blocks (Sanskrit)
                          code: ({node, inline, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            
                            if (inline) {
                              return (
                                <code 
                                  className={`px-2 py-1 rounded text-sm font-mono ${
                                    darkMode 
                                      ? 'bg-amber-900/30 text-amber-300' 
                                      : 'bg-orange-100 text-orange-700 font-semibold'
                                  }`} 
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }
                            
                            return (
                              <div className={`my-4 p-5 rounded-xl border-l-4 ${
                                darkMode 
                                  ? 'bg-amber-900/20 border-amber-500' 
                                  : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-400 shadow-sm'
                              }`}>
                                <pre className={`font-serif text-xl leading-relaxed overflow-x-auto ${
                                  language === 'sanskrit' 
                                    ? darkMode ? 'text-amber-200' : 'text-orange-800 font-medium'
                                    : darkMode ? 'text-amber-300' : 'text-orange-700 font-medium'
                                }`}>
                                  <code {...props}>{children}</code>
                                </pre>
                              </div>
                            );
                          },
                          // Custom styling for blockquotes
                          blockquote: ({children}) => (
                            <blockquote className={`border-l-4 pl-4 py-3 my-4 italic font-medium ${
                              darkMode 
                                ? 'border-amber-500 bg-amber-900/20 text-amber-100' 
                                : 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 shadow-sm'
                            }`}>
                              {children}
                            </blockquote>
                          ),
                          // Custom styling for headings
                          h1: ({children}) => (
                            <h1 className={`text-2xl font-bold mb-4 ${
                              darkMode ? 'text-amber-100' : 'text-orange-800'
                            }`}>
                              {children}
                            </h1>
                          ),
                          h2: ({children}) => (
                            <h2 className={`text-xl font-bold mb-3 mt-6 ${
                              darkMode ? 'text-amber-100' : 'text-orange-700'
                            }`}>
                              {children}
                            </h2>
                          ),
                          h3: ({children}) => (
                            <h3 className={`text-lg font-semibold mb-2 mt-4 ${
                              darkMode ? 'text-amber-200' : 'text-orange-600'
                            }`}>
                              {children}
                            </h3>
                          ),
                          // Custom styling for horizontal rules
                          hr: () => (
                            <hr className={`my-6 border-t-2 ${
                              darkMode ? 'border-amber-700/30' : 'border-orange-300'
                            }`} />
                          ),
                          // Custom styling for lists
                          ul: ({children}) => (
                            <ul className={`list-disc list-inside space-y-2 my-4 ${
                              darkMode ? 'text-amber-100' : 'text-slate-800'
                            }`}>
                              {children}
                            </ul>
                          ),
                          li: ({children}) => (
                            <li className={`leading-relaxed ${
                              darkMode ? 'text-amber-100' : 'text-slate-800'
                            }`}>{children}</li>
                          ),
                          // Custom styling for paragraphs
                          p: ({children}) => (
                            <p className={`mb-4 leading-relaxed ${
                              darkMode ? 'text-amber-100' : 'text-slate-800'
                            }`}>
                              {children}
                            </p>
                          ),
                          // Custom styling for strong/bold text
                          strong: ({children}) => (
                            <strong className={`font-semibold ${
                              darkMode ? 'text-amber-200' : 'text-orange-700'
                            }`}>
                              {children}
                            </strong>
                          ),
                          // Custom styling for emphasis/italic text
                          em: ({children}) => (
                            <em className={`italic ${
                              darkMode ? 'text-amber-200' : 'text-orange-600'
                            }`}>
                              {children}
                            </em>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Message Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-amber-700/20">
                      <p className={`text-xs ${
                        darkMode ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'hover:bg-slate-700 text-amber-300'
                              : 'hover:bg-orange-100 text-slate-600'
                          }`}
                          title="Copy message"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'hover:bg-slate-700 text-amber-300'
                              : 'hover:bg-orange-100 text-slate-600'
                          }`}
                          title="Save to favorites"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'hover:bg-slate-700 text-amber-300'
                              : 'hover:bg-orange-100 text-slate-600'
                          }`}
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className={`max-w-[85%] mr-12 rounded-2xl rounded-tl-sm p-6 ${
                darkMode
                  ? 'bg-gradient-to-br from-slate-800/90 to-amber-900/20 border border-amber-700/30'
                  : 'bg-white border border-amber-200 shadow-xl'
              }`}>
                <div className="flex items-center space-x-4">
                  <Loader2 className={`w-6 h-6 animate-spin ${
                    darkMode ? 'text-amber-400' : 'text-orange-500'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      darkMode ? 'text-amber-200' : 'text-slate-800'
                    }`}>
                      Contemplating your words...
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full animate-bounce ${
                              darkMode ? 'bg-amber-400' : 'bg-orange-500'
                            }`}
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        darkMode ? 'text-amber-400' : 'text-slate-600'
                      }`}>
                        Analyzing emotions → Finding verses → Crafting response
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={`border-t backdrop-blur-md ${
        darkMode 
          ? 'bg-slate-900/80 border-amber-900/30' 
          : 'bg-white/80 border-amber-200/50'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind... (Press Enter to send)"
                className={`w-full px-4 py-2 pr-12 rounded-xl resize-none border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-amber-700/30 text-amber-100 placeholder-amber-400/50'
                    : 'bg-white border-amber-200 text-slate-900 placeholder-slate-400'
                }`}
                disabled={loading}
                rows={input.split('\n').length > 3 ? 3 : Math.max(1, input.split('\n').length)}
              />
              <button
                onClick={() => setInput('')}
                className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors ${
                  input.trim()
                    ? darkMode
                      ? 'hover:bg-slate-700 text-amber-400'
                      : 'hover:bg-gray-100 text-slate-600'
                    : 'opacity-0'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                loading || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          <div className={`mt-2 flex items-center justify-between text-xs ${
            darkMode ? 'text-amber-400' : 'text-slate-500'
          }`}>
            <p>
              <span className="font-semibold">Shift + Enter</span> for new line • Powered by RoBERTa + ChromaDB + Gemini
            </p>
            <p>
              {input.length} characters
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      </div>
    </div>
  );
};

export default ChatInterface;