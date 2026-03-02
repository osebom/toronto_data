'use client';

import { FiMap, FiMessageCircle, FiGrid } from 'react-icons/fi';
import { useStore } from '@/store/useStore';

const TABS: { id: 'navigation' | 'chat' | 'map'; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'navigation', label: 'Browse', icon: FiGrid },
  { id: 'chat', label: 'Chat', icon: FiMessageCircle },
  { id: 'map', label: 'Map', icon: FiMap },
];

export default function MobileTabBar() {
  const { mobileTab, setMobileTab, setPreviousMobileTab } = useStore();

  const handleTabClick = (tabId: 'navigation' | 'chat' | 'map') => {
    if (tabId === 'chat' && mobileTab !== 'chat') {
      setPreviousMobileTab(mobileTab);
    }
    setMobileTab(tabId);
  };

  return (
    <nav
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1050] flex justify-center px-5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div
        className="pointer-events-auto flex min-w-[240px] max-w-[300px] flex-1 items-center justify-around rounded-[1.5rem] bg-white/65 px-3 py-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 border-2 border-white/70 ring-1 ring-white/30"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-0"
            >
              <span
                className={`flex items-center justify-center rounded-full p-0.5 transition-colors ${
                  isActive ? 'bg-[#4285F4]' : ''
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-white' : 'text-gray-700'}
                />
              </span>
              <span
                className={`text-[8px] font-medium transition-colors ${
                  isActive ? 'text-[#4285F4]' : 'text-gray-700'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

