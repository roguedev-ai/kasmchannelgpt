/**
 * Create Redirect Page
 * 
 * This page redirects from the old /create route to the new location.
 * Maintains backward compatibility for any bookmarks or links.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new create agent page
    router.replace('/dashboard/projects/create');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to create agent...</p>
      </div>
    </div>
  );
}