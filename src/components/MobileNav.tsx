'use client';

import type { MobileTab } from '@/hooks/useMobileNav';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  activeTab: MobileTab;
  onSwitchTab: (tab: MobileTab) => void;
}

const tabs: { id: MobileTab; label: string; icon: string }[] = [
  {
    id: 'feed',
    label: 'Feed',
    icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z',
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  },
  {
    id: 'predict',
    label: 'Predict',
    icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    id: 'history',
    label: 'History',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
];

export default function MobileNav({ activeTab, onSwitchTab }: MobileNavProps) {
  return (
    <div
      className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 items-center justify-around py-2 px-4"
      style={{ display: 'none', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSwitchTab(tab.id)}
          className={cn(
            'mobile-tab flex flex-col items-center gap-0.5 flex-1 py-1',
            activeTab === tab.id ? 'active' : 'text-txt-tertiary'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
          </svg>
          <span className="text-[10px] font-semibold">{tab.label}</span>
          <div className="tab-dot w-1 h-1 rounded-full mt-0.5" />
        </button>
      ))}
    </div>
  );
}
