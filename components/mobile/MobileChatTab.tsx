'use client';

import { useStore } from '@/store/useStore';
import { FiX } from 'react-icons/fi';

const SUGGESTION_CHIPS = [
  { emoji: '🍽️', label: 'food events' },
  { emoji: '🎨', label: 'art exhibitions' },
  { emoji: '🎵', label: 'music' },
  { emoji: '🖼️', label: 'art exhibits' },
];

export default function MobileChatTab() {
  const { previousMobileTab, setMobileTab } = useStore();

  const handleBack = () => {
    setMobileTab(previousMobileTab);
  };

  return (
    <div
      className="fixed inset-0 z-[1020] flex flex-col bg-[#fafafa]"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Subtle green gradient from bottom right */}
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

      <main className="relative flex-1 overflow-y-auto px-5" style={{ paddingBottom: '6.5rem' }}>
        <div className="flex flex-col gap-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left text-sm text-gray-800 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="text-base">{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Bottom: pill-shaped search bar (liquid glass style) */}
      <div
        className="relative z-10 px-4 pb-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <input
          type="search"
          placeholder="search"
          aria-label="Search"
          className="h-12 w-full rounded-[1.5rem] bg-white/65 px-5 text-base text-gray-900 placeholder:text-gray-500 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 border border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60"
        />
      </div>
    </div>
  );
}
