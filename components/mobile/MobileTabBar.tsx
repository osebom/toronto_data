'use client';

import { FiMap, FiMessageCircle, FiGrid } from 'react-icons/fi';
import { useStore } from '@/store/useStore';

const TABS: { id: 'navigation' | 'chat' | 'map'; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'navigation', label: 'Browse', icon: FiGrid },
  { id: 'chat', label: 'Chat', icon: FiMessageCircle },
  { id: 'map', label: 'Map', icon: FiMap },
];

export default function MobileTabBar() {
  const { mobileTab, setMobileTab } = useStore();

  return (
    <nav
      className="pointer-events-none fixed left-0 right-0 bottom-0 z-[1050] flex justify-center px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <div
        className="pointer-events-auto flex min-w-[240px] max-w-[340px] flex-1 items-center justify-around rounded-full bg-dark-sidebar/70 px-5 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-2xl backdrop-saturate-150 border border-white/10"
        style={{ marginBottom: 4 }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className="flex flex-col items-center justify-center"
            >
              <span
                className={`flex items-center justify-center rounded-full p-2 transition-colors ${
                  isActive ? 'bg-[#4285F4]' : ''
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-white' : 'text-white/80'}
                />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

