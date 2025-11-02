//Conversation history component for dashboard
'use client';
import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
// import { getChatHistory } from '@/lib/api'; // Commented out - using static data

const RecentChats = ({ darkMode }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    // Static demo data instead of API call
    const loadStaticData = () => {
      setLoading(true);
      
      // Simulate loading delay
      setTimeout(() => {
        const staticChats = [
          {
            id: 'static-1',
            title: 'Finding Inner Peace in Chaos',
            timestamp: '2 hours ago',
            emotion: 'anxiety',
            preview: 'How can I find peace when everything around me feels overwhelming and chaotic?',
            messageCount: 12,
            interactionMode: 'wisdom'
          },
          {
            id: 'static-2',
            title: 'Understanding My Life Purpose',
            timestamp: 'Yesterday',
            emotion: 'confusion',
            preview: 'What is my dharma? How do I discover my true calling in life?',
            messageCount: 18,
            interactionMode: 'socratic'
          },
          {
            id: 'static-3',
            title: 'Dealing with Difficult Relationships',
            timestamp: '2 days ago',
            emotion: 'sadness',
            preview: 'Someone I trusted betrayed me. How do I handle this pain and move forward?',
            messageCount: 14,
            interactionMode: 'story'
          },
          {
            id: 'static-4',
            title: 'Morning Meditation Insights',
            timestamp: '3 days ago',
            emotion: 'peace',
            preview: 'During meditation today, I felt a deep connection. What does this experience mean?',
            messageCount: 8,
            interactionMode: 'wisdom'
          },
          {
            id: 'static-5',
            title: 'Overcoming Self-Doubt',
            timestamp: '1 week ago',
            emotion: 'anxiety',
            preview: 'I constantly doubt my abilities and feel like I\'m not good enough. How can I build confidence?',
            messageCount: 16,
            interactionMode: 'socratic'
          }
        ];
        
        setRecentChats(staticChats);
        setTotalSessions(staticChats.length);
        setError(null);
        setLoading(false);
      }, 500); // 500ms delay to simulate loading
    };

    loadStaticData();
  }, []);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl border ${
        darkMode
          ? 'bg-gradient-to-br from-slate-800/50 to-amber-900/30 border-amber-700/20'
          : 'bg-white border-amber-200 shadow-lg'
      }`}>
        <div className="flex items-center space-x-2 mb-6">
          <Clock className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-orange-600'}`} />
          <h3 className={`text-xl font-bold ${darkMode ? 'text-amber-100' : 'text-slate-900'}`}>
            Recent Conversations
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-amber-400' : 'text-orange-600'}`} />
          <span className={`ml-2 ${darkMode ? 'text-amber-300' : 'text-slate-600'}`}>
            Loading conversations...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border ${
      darkMode
        ? 'bg-gradient-to-br from-slate-800/50 to-amber-900/30 border-amber-700/20'
        : 'bg-white border-amber-200 shadow-lg'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-orange-600'}`} />
          <h3 className={`text-xl font-bold ${darkMode ? 'text-amber-100' : 'text-slate-900'}`}>
            Recent Conversations
          </h3>
        </div>
        {totalSessions > 0 && (
          <span className={`text-sm px-3 py-1 rounded-full ${
            darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-orange-100 text-orange-700'
          }`}>
            {totalSessions} total
          </span>
        )}
      </div>

      {error && (
        <div className={`p-4 rounded-lg mb-4 ${
          darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
        }`}>
          <p className="text-sm">Failed to load conversations: {error}</p>
        </div>
      )}

      <div className="space-y-3">
        {recentChats.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-amber-300' : 'text-slate-600'}`}>
            <MessageCircle className={`w-12 h-12 mx-auto mb-3 opacity-50 ${
              darkMode ? 'text-amber-400' : 'text-orange-400'
            }`} />
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start your spiritual journey by asking a question!</p>
          </div>
        ) : (
          recentChats.map(chat => (
            <Link key={chat.id} href={`/chat?session_id=${chat.id}`}>
              <div className={`p-4 rounded-lg transition-all cursor-pointer ${
                darkMode
                  ? 'bg-slate-800/50 hover:bg-slate-800 border border-amber-900/20'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <MessageCircle className={`w-5 h-5 mt-1 flex-shrink-0 ${
                    darkMode ? 'text-amber-400' : 'text-orange-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold ${
                        darkMode ? 'text-amber-100' : 'text-slate-900'
                      }`}>
                        {chat.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {chat.messageCount > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            darkMode ? 'bg-slate-700 text-amber-300' : 'bg-gray-200 text-slate-600'
                          }`}>
                            {chat.messageCount} msgs
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {chat.interactionMode}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mb-2 truncate ${
                      darkMode ? 'text-amber-300' : 'text-slate-600'
                    }`}>
                      {chat.preview}
                    </p>
                    <span className={`text-xs ${
                      darkMode ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {chat.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link href="/my-journey">
        <button className={`w-full mt-4 py-2 rounded-lg font-medium transition-all ${
          darkMode
            ? 'bg-amber-900/50 text-amber-200 hover:bg-amber-900'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        }`}>
          View All Conversations
        </button>
      </Link>
    </div>
  );
};

export default RecentChats;