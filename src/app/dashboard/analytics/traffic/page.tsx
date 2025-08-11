'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrafficAnalyticsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to projects page with analytics tab
    router.replace('/projects?tab=analytics');
  }, [router]);

  return null;
}