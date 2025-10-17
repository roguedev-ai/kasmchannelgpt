import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PartnerList } from '@/components/admin/PartnerList';

export default async function PartnersPage() {
  // Check admin session on server side
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Partner Management</h1>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <PartnerList />
      </Suspense>
    </div>
  );
}
