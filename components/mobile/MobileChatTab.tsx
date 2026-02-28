'use client';

import { useStore } from '@/store/useStore';
import { FiMessageCircle } from 'react-icons/fi';

export default function MobileChatTab() {
  const { searchQuery } = useStore();

  return (
    <div
      className="fixed inset-0 z-[1020] flex flex-col bg-white"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
      }}
    >
      <header className="px-5 pb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <FiMessageCircle size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-400">AI guide</p>
          <h1 className="text-lg font-semibold text-gray-900">Chat about events</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pb-4 overflow-y-auto">
        {searchQuery ? (
          <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Latest question
            </p>
            <p className="text-sm font-medium text-gray-900">{searchQuery}</p>
            <p className="mt-3 text-sm text-gray-500">
              We&apos;ll use this space to show conversational answers and follow-ups
              for your searches.
            </p>
          </div>
        ) : (
          <div className="mt-10 text-center text-gray-400 text-sm px-6">
            Ask something from the map search to start a conversation, and
            we&apos;ll bring you here automatically.
          </div>
        )}
      </main>
    </div>
  );
}

