'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { getRateLimitStatus, formatTimeUntilReset } from '@/lib/rate-limit';

export default function SearchBar() {
  const {
    setMobileTab,
    setChatMessages,
    setChatAssistantResponseCount,
    setChatSessionStartedAt,
    setChatPendingQuery,
  } = useStore();

  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const launchChatWithQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const status = getRateLimitStatus();
    if (!status.canSend) {
      setError(`Rate limit reached. Try again in ${formatTimeUntilReset()}.`);
      return;
    }

    setError(null);
    setInputValue('');
    setChatMessages([]);
    setChatAssistantResponseCount(0);
    setChatSessionStartedAt(Date.now());
    setChatPendingQuery(trimmed);
    setMobileTab('chat');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    launchChatWithQuery(inputValue);
  };

  return (
    <div
      className="absolute left-0 right-0 p-4"
      style={{
        bottom: 0,
        zIndex: 1000,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.25rem)',
      }}
    >
      <form onSubmit={handleSubmit} className="relative w-full flex items-center gap-2 bg-white/90 backdrop-blur-md text-gray-900 rounded-xl shadow-lg border border-white/60 overflow-hidden">
        <FiSearch className="ml-3 text-emerald-600 flex-shrink-0" size={18} />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Find events — powered by Cohere"
          className="flex-1 min-w-0 bg-transparent text-gray-900 placeholder-gray-500 px-2 py-3 text-sm focus:outline-none"
          autoComplete="off"
        />
        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 mr-1 rounded-md bg-emerald-50 border border-emerald-100 pointer-events-none">
          <img src="/cohere-logo.png" alt="Cohere" className="h-3.5 w-3.5 opacity-90" />
        </span>
      </form>
      {error && (
        <p className="mt-1.5 px-1 text-xs text-amber-400">{error}</p>
      )}
    </div>
  );
}
