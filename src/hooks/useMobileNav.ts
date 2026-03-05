'use client';

import { useState, useCallback } from 'react';

export type MobileTab = 'feed' | 'trades' | 'predict';

export function useMobileNav() {
  const [activeTab, setActiveTab] = useState<MobileTab>('trades');

  const switchTab = useCallback((tab: MobileTab) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    switchTab,
  };
}
