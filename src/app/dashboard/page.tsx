'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to projects page which is the main agent management page
    router.replace('/projects');
  }, [router]);

  return null;
}