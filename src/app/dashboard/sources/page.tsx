'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SourcesPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to projects page with sources tab
    router.replace('/projects?tab=sources');
  }, [router]);

  return null;
}