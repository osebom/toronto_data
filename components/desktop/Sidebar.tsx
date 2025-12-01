'use client';

import { useMemo, useState } from 'react';
import { FiInfo, FiSearch, FiChevronDown, FiFilter, FiCalendar, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import EventList from './EventList';
import AIResultsList from './AIResultsList';
import { getThemeIcon } from '@/lib/event-metadata';
import { useEffect, useRef } from 'react';
import { filterEventsWithAIFilters, rankAndLimitEvents, generateEventSummary } from '@/lib/ai-filter-events';
import { ExtractedFilters } from '@/app/api/ai-search/route';
import { Event } from '@/types';
import { getRateLimitStatus, recordMessage, formatTimeUntilReset } from '@/lib/rate-limit';

export default function Sidebar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    selectedSort,
    setSelectedSort,
    events,
    selectedThemes,
    setSelectedThemes,
    selectedCategories,
    setSelectedCategories,
    selectedDateRange,
    setSelectedDateRange,
    userLocation,
  } = useStore();

  const themeOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      event.themes?.forEach((theme) => set.add(theme));
    });
    return Array.from(set).sort();
  }, [events]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      event.categories?.forEach((category) => set.add(category));
    });
    return Array.from(set).sort();
  }, [events]);

  const [selectedPreset, setSelectedPreset] = useState<'today' | 'weekend' | 'next30' | null>(null);
  const [showDatePanel, setShowDatePanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [searchMode, setSearchMode] = useState<'keyword' | 'ai'>('keyword');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hi! I'm here to help you discover amazing events in Toronto. Just tell me what you're looking for—whether it's free events, family-friendly activities, specific dates, or anything else!" },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResults, setAiResults] = useState<Event[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState(getRateLimitStatus());
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages, isTyping]);

  // Update rate limit status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStatus(getRateLimitStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (value: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(parsed);
  };

  const dateSummary = useMemo(() => {
    const start = formatDisplayDate(selectedDateRange.start);
    const end = formatDisplayDate(selectedDateRange.end);
    if (start && end) return `${start} – ${end}`;
    if (start) return `${start}`;
    if (end) return `Until ${end}`;
    return 'Any date';
  }, [selectedDateRange]);

  const applyToday = () => {
    const today = new Date();
    const value = formatInputDate(today);
    setSelectedDateRange({ start: value, end: value });
    setSelectedPreset('today');
    setShowDatePanel(false);
  };

  const applyWeekend = () => {
    const now = new Date();
    const day = now.getDay();
    const daysToSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysToSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    setSelectedDateRange({
      start: formatInputDate(saturday),
      end: formatInputDate(sunday),
    });
    setSelectedPreset('weekend');
    setShowDatePanel(false);
  };

  const applyNextMonth = () => {
    const today = new Date();
    const inThirty = new Date(today);
    inThirty.setDate(today.getDate() + 30);
    setSelectedDateRange({
      start: formatInputDate(today),
      end: formatInputDate(inThirty),
    });
    setSelectedPreset('next30');
    setShowDatePanel(false);
  };

  const clearDates = () => {
    setSelectedDateRange({ start: null, end: null });
    setSelectedPreset(null);
  };

  const toggleTheme = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter((t) => t !== theme));
    } else {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  const themeSummary = () => {
    if (selectedThemes.length === 0) return 'Any';
    if (selectedThemes.length === 1) return selectedThemes[0];
    return `${selectedThemes[0]} +${selectedThemes.length - 1}`;
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const categorySummary = () => {
    if (selectedCategories.length === 0) return 'Any';
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories[0]} +${selectedCategories.length - 1}`;
  };

  // Get distinct categories and themes from actual events for AI search
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      event.categories?.forEach((category) => set.add(category));
    });
    return Array.from(set);
  }, [events]);

  const availableThemes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      event.themes?.forEach((theme) => set.add(theme));
    });
    return Array.from(set);
  }, [events]);

  const handleAISearch = async (query: string) => {
    // Check rate limit before processing
    const currentStatus = getRateLimitStatus();
    
    if (!currentStatus.canSend) {
      const resetTime = formatTimeUntilReset();
      setChatMessages((prev) => [...prev, { 
        sender: 'ai', 
        text: `You've reached your message limit of 4 messages per 2 minutes. Please try again in ${resetTime}.` 
      }]);
      setRateLimitStatus(currentStatus);
      return;
    }

    // Record the message
    const allowed = recordMessage();
    if (!allowed) {
      const resetTime = formatTimeUntilReset();
      setChatMessages((prev) => [...prev, { 
        sender: 'ai', 
        text: `You've reached your message limit of 4 messages per 2 minutes. Please try again in ${resetTime}.` 
      }]);
      setRateLimitStatus(getRateLimitStatus());
      return;
    }

    // Update rate limit status
    setRateLimitStatus(getRateLimitStatus());

    try {
      setIsTyping(true);
      
      // Call AI API to extract filters
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          availableThemes,
          availableCategories,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || 'Failed to process AI search';
        console.error('AI search API error:', errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const { filters } = await response.json() as { filters: ExtractedFilters };

      // Filter events using extracted filters
      const filtered = filterEventsWithAIFilters(events, filters, userLocation);
      
      // Rank and get top 5
      const top5 = rankAndLimitEvents(filtered, 5, userLocation);
      setAiResults(top5);

      // Generate summaries for top 3
      const top3 = top5.slice(0, 3);
      const summaries = top3.map(generateEventSummary);

      // Add AI response with summaries
      if (summaries.length > 0) {
        const summaryText = `Found ${top5.length} event${top5.length !== 1 ? 's' : ''}:\n\n${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        setChatMessages((prev) => [...prev, { sender: 'ai', text: summaryText }]);
      } else {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: "I couldn't find any events matching your criteria. Try adjusting your search." }]);
      }

      // Update rate limit status after successful search
      setRateLimitStatus(getRateLimitStatus());
    } catch (error) {
      console.error('AI search error:', error);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: "Sorry, I encountered an error processing your request. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full lg:w-1/3 bg-dark-sidebar h-screen flex flex-col overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white border border-white/60 flex items-center justify-center overflow-hidden shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.icons8.com/ios/50/cn-tower.png"
              alt="CN Tower logo"
              className="w-7 h-7 object-contain"
            />
          </div>
          <span className="text-white font-semibold">event buddy</span>
        </div>
        <button className="text-white hover:text-gray-300">
          <FiInfo size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <span className="uppercase tracking-wide text-[11px] text-gray-500">Search mode</span>
          <div className="flex gap-2 bg-dark-card border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                setSearchMode('keyword');
                setAiResults([]);
              }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                searchMode === 'keyword'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Keyword
            </button>
            <button
              onClick={() => {
                setSearchMode('ai');
                setAiResults([]);
              }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                searchMode === 'ai'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/cohere-logo.png" 
                alt="Cohere" 
                className="w-4 h-4 object-contain"
              />
              <span>AI</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Beta
              </span>
            </button>
          </div>
        </div>

        {searchMode === 'keyword' ? (
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-card text-white placeholder-gray-400 px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        ) : (
          <div className="bg-dark-card border border-gray-700 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <FiSearch size={14} className="text-gray-400" />
                <span>AI search</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className={rateLimitStatus.remaining === 0 ? 'text-amber-400' : 'text-gray-400'}>
                  {rateLimitStatus.remaining} / 4 messages
                </span>
                {rateLimitStatus.remaining === 0 && (
                  <span className="text-amber-400">• Resets in {formatTimeUntilReset()}</span>
                )}
              </div>
            </div>
            <div ref={chatRef} className="bg-black/30 border border-gray-700 rounded-lg p-3 space-y-3 h-56 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div key={`${msg.sender}-${idx}`} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm border whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-gray-800 text-gray-100 border-gray-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm border bg-gray-800 text-gray-100 border-gray-700">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-150" />
                      <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-300" />
                    </span>
                    <span className="text-xs text-gray-400">Finding events…</span>
                  </div>
                </div>
              )}
            </div>
            <div className="relative space-y-2">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const text = chatInput.trim();
                  if (!text) return;
                  
                  // Check rate limit before adding user message
                  const status = getRateLimitStatus();
                  if (!status.canSend) {
                    setRateLimitStatus(status);
                    return;
                  }

                  setChatMessages((prev) => [...prev, { sender: 'user', text }]);
                  setChatInput('');
                  await handleAISearch(text);
                }}
              >
                <div className="flex items-center gap-2 bg-black/40 border border-gray-700 rounded-full px-3 py-2">
                  <textarea
                    placeholder={rateLimitStatus.remaining === 0 ? "Rate limit reached. Please wait..." : "Ask for events…"}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={rateLimitStatus.remaining === 0}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const text = chatInput.trim();
                        if (!text) return;
                        
                        // Check rate limit
                        const status = getRateLimitStatus();
                        if (!status.canSend) {
                          setRateLimitStatus(status);
                          return;
                        }

                        setChatMessages((prev) => [...prev, { sender: 'user', text }]);
                        setChatInput('');
                        await handleAISearch(text);
                      }
                    }}
                    className="w-full bg-transparent text-white placeholder-gray-500 px-1 py-1 focus:outline-none resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={rateLimitStatus.remaining === 0}
                    className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                  >
                    Send
                  </button>
                </div>
              </form>
              <div className="text-[11px] text-gray-500">
                AI will search events and show results below. Results accuracy may vary.
              </div>
            </div>
          </div>
        )}
      </div>

      {searchMode === 'keyword' && (
        /* Filters - compact */
        <div className="p-3 border-b border-gray-700 space-y-2 bg-dark-sidebar/60">
          <div className="flex items-center gap-2 text-gray-200 text-sm">
            <FiFilter size={16} className="text-gray-400" />
            <span>Filters</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Price filter */}
            <div className="flex items-center gap-2 bg-dark-card border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200">
              <span className="text-gray-400">Price</span>
              <div className="flex gap-1">
                {(['all', 'free', 'paid', 'accessible'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedFilter(option)}
                    className={`px-2 py-1 rounded-md capitalize transition-colors ${
                      selectedFilter === option
                        ? 'bg-emerald-500 text-white'
                        : 'bg-black/40 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {option === 'all' ? 'All' : option}
                  </button>
                ))}
              </div>
            </div>

            {/* Date dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDatePanel((open) => !open)}
                className="flex items-center gap-2 bg-dark-card border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 transition-colors"
              >
                <FiCalendar size={14} className="text-gray-400" />
                <span className="truncate max-w-[120px]">{dateSummary}</span>
                <FiChevronDown size={12} className="text-gray-400" />
              </button>
              {showDatePanel && (
                <div className="absolute z-20 mt-2 w-72 bg-dark-card border border-gray-700 rounded-lg p-3 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-200">
                    <span className="flex items-center gap-2">
                      <FiCalendar size={14} />
                      <span>Date range</span>
                    </span>
                    {(selectedDateRange.start || selectedDateRange.end) && (
                      <button
                        onClick={clearDates}
                        className="text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        <FiX size={12} />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={applyToday}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedPreset === 'today'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-black/40 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={applyWeekend}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedPreset === 'weekend'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-black/40 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      Weekend
                    </button>
                    <button
                      onClick={applyNextMonth}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedPreset === 'next30'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-black/40 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      Next 30d
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex flex-col gap-1 text-gray-400">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">From</span>
                      <input
                        type="date"
                        value={selectedDateRange.start || ''}
                        onChange={(e) =>
                          setSelectedDateRange({
                            ...selectedDateRange,
                            start: e.target.value || null,
                          })
                        }
                        onFocus={() => setSelectedPreset(null)}
                        className="w-full bg-black/30 text-white px-2 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/60 placeholder-gray-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-gray-400">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">To</span>
                      <input
                        type="date"
                        value={selectedDateRange.end || ''}
                        onChange={(e) =>
                          setSelectedDateRange({
                            ...selectedDateRange,
                            end: e.target.value || null,
                          })
                        }
                        onFocus={() => setSelectedPreset(null)}
                        className="w-full bg-black/30 text-white px-2 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/60 placeholder-gray-500"
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                    <span className="truncate">Showing: {dateSummary}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Category dropdown */}
            {categoryOptions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowCategoryPanel((open) => !open)}
                  className="flex items-center gap-2 bg-dark-card border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 transition-colors"
                >
                  <span className="text-gray-400">Category</span>
                  <span className="truncate max-w-[110px]">{categorySummary()}</span>
                  <FiChevronDown size={12} className="text-gray-400" />
                </button>
                {showCategoryPanel && (
                  <div className="absolute z-20 mt-2 w-60 bg-dark-card border border-gray-700 rounded-lg p-3 shadow-xl space-y-2 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between text-xs text-gray-200">
                      <span>Categories</span>
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="text-gray-400 hover:text-white text-[11px]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryOptions.map((category) => (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`px-2 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                            selectedCategories.includes(category)
                              ? 'bg-blue-500 text-white'
                              : 'bg-black/40 text-gray-200 hover:bg-gray-700'
                          }`}
                        >
                          <span className="truncate">{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Themes dropdown */}
            {themeOptions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowThemePanel((open) => !open)}
                  className="flex items-center gap-2 bg-dark-card border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 transition-colors"
                >
                  <span className="text-gray-400">Theme</span>
                  <span className="truncate max-w-[110px]">
                    {themeSummary()}
                  </span>
                  <FiChevronDown size={12} className="text-gray-400" />
                </button>
                {showThemePanel && (
                  <div className="absolute z-20 mt-2 w-60 bg-dark-card border border-gray-700 rounded-lg p-3 shadow-xl space-y-2 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between text-xs text-gray-200">
                      <span>Themes</span>
                      <button
                        onClick={() => setSelectedThemes([])}
                        className="text-gray-400 hover:text-white text-[11px]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {themeOptions.map((theme) => (
                        <button
                          key={theme}
                          onClick={() => toggleTheme(theme)}
                          className={`px-2 py-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                            selectedThemes.includes(theme)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-black/40 text-gray-200 hover:bg-gray-700'
                          }`}
                        >
                          <span>{getThemeIcon(theme)}</span>
                          <span className="truncate">{theme}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sort */}
            <button
              onClick={() => {
                const options: Array<'nearest' | 'name'> = ['nearest', 'name'];
                const currentIndex = options.indexOf(selectedSort as 'nearest' | 'name');
                const nextIndex = (currentIndex + 1) % options.length;
                setSelectedSort(options[nextIndex]);
              }}
              className="flex items-center gap-2 bg-dark-card border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 transition-colors"
            >
              <span className="text-gray-400">Sort</span>
              <span className="capitalize">{selectedSort}</span>
              <FiChevronDown size={12} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        {searchMode === 'ai' ? (
          aiResults.length > 0 ? (
            <AIResultsList events={aiResults} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Results will show here
            </div>
          )
        ) : (
          <EventList />
        )}
      </div>
    </div>
  );
}
