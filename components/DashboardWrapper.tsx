'use client';

import { DataCacheProvider } from '@/lib/DataCacheContext';
import { ReactNode } from 'react';

export default function DashboardWrapper({ children }: { children: ReactNode }) {
  return <DataCacheProvider>{children}</DataCacheProvider>;
}

