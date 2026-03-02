'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { FiX } from 'react-icons/fi';
import EventMiniWidget from '@/components/mobile/EventMiniWidget';
import { Event } from '@/types';

const SUGGESTION_CHIPS = [
  { emoji: '🍽️', label: 'food events' },
  { emoji: '🎨', label: 'art exhibitions' },
  { emoji: '🎵', label: 'music' },
  { emoji: '🖼️', label: 'art exhibits' },
];

// Dummy responses for testing (no API). Some words wrapped in ** for bold.
const DUMMY_RESPONSES = [
  'Here are some great **food events** and **art exhibitions** in Toronto this week. I can narrow by area or date if you’d like!',
  'There are several **music** and **art exhibits** happening nearby. Want suggestions for this weekend?',
  'I found **free** and **family-friendly** options. Would you prefer something indoors or outdoors?',
  'Based on what you’re looking for, **Downtown** and **Harbourfront** have the most going on. I can list a few specific events next.',
];

type Message = { role: 'user' | 'assistant'; text: string; events?: Event[] };

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function MobileChatTab() {
  const { previousMobileTab, setMobileTab, setSelectedEvent, setChatEventGroup, filteredEvents } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isThinking, setIsThinking] = useState(false);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    };
  }, []);

  const handleBack = () => setMobileTab(previousMobileTab);

  const pickRandomEvents = (count: number): Event[] => {
    const pool = filteredEvents();
    if (pool.length <= count) return [...pool];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setIsThinking(true);
    const dummyIndex = messages.length % DUMMY_RESPONSES.length;
    const dummyText = DUMMY_RESPONSES[dummyIndex];
    const randomEvents = pickRandomEvents(5);
    thinkingTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: dummyText, events: randomEvents },
      ]);
      setIsThinking(false);
      thinkingTimerRef.current = null;
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (label: string) => {
    sendMessage(label);
  };

  const showSuggestions = messages.length === 0;

  const handleChatEventTap = (event: Event, group: Event[]) => {
    if (!group || group.length === 0) return;
    setChatEventGroup(group);
    setSelectedEvent(event);
    setMobileTab('map');
  };

  return (
    <div
      className="fixed inset-0 z-[1020] flex flex-col bg-[#fafafa]"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tl from-emerald-100/40 from-[length:60%] to-transparent"
        aria-hidden
      />

      <header className="relative flex flex-col items-center px-5 pt-1 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="absolute right-5 top-0 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Back"
        >
          <FiX size={24} strokeWidth={2.5} />
        </button>
        <p className="mt-2 text-center text-sm text-gray-400">
          lets find you an activity in Toronto!
        </p>
      </header>

      <main
        className="relative flex-1 overflow-y-auto px-4"
        style={{ paddingBottom: '6.5rem' }}
      >
        {showSuggestions ? (
          <div className="flex flex-col gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSuggestionClick(chip.label)}
                className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left text-sm text-gray-800 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="text-base">{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <style>{`
              @keyframes thinking-bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-5px); }
              }
              .thinking-dot {
                animation: thinking-bounce 1.2s ease-in-out infinite;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #6b7280;
              }
              .thinking-dot:nth-child(1) { animation-delay: 0ms; }
              .thinking-dot:nth-child(2) { animation-delay: 160ms; }
              .thinking-dot:nth-child(3) { animation-delay: 320ms; }
            `}</style>
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 shadow-sm"
                    style={{ backgroundColor: 'rgb(204 231 232)' }}
                  >
                    <p className="text-sm text-gray-900">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-end gap-2">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-300 to-white shadow-sm"
                      aria-hidden
                    />
                    <div className="relative max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-md rounded-tr-xl rounded-br-xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm text-gray-900">
                          {renderBold(msg.text)}
                        </p>
                      </div>
                      <div
                        className="absolute -left-1 bottom-0 w-3 h-3 bg-white shadow-sm"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                      />
                    </div>
                  </div>
                  {msg.events && msg.events.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pl-11 scrollbar-hide -mx-1 px-1 pb-1">
                      {msg.events.map((event) => (
                        <EventMiniWidget
                          key={event.id}
                          event={event}
                          onTap={() => handleChatEventTap(event, msg.events!)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            {isThinking && (
              <div className="flex items-end gap-2">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-300 to-white shadow-sm"
                  aria-hidden
                />
                <div className="relative max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-md rounded-tr-xl rounded-br-xl bg-white px-4 py-3 shadow-sm flex items-center gap-1.5 min-w-[4rem]">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                  <div
                    className="absolute -left-1 bottom-0 w-3 h-3 bg-white shadow-sm"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 px-4 pb-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <input
          type="text"
          placeholder="search"
          aria-label="Search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-12 w-full rounded-[1.5rem] bg-white/65 px-5 text-base text-gray-900 placeholder:text-gray-500 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 border border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60"
        />
      </form>
    </div>
  );
}
