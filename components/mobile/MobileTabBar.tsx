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
      className="pointer-events-none fixed left-0 right-0 bottom-0 z-[1050] flex justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto mb-1 flex min-w-[260px] max-w-[360px] flex-1 items-center justify-center gap-10 rounded-3xl bg-white/95 px-8 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className="flex flex-col items-center justify-center gap-1"
            >
              <Icon
                size={22}
                className={isActive ? 'text-blue-500' : 'text-gray-400'}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

