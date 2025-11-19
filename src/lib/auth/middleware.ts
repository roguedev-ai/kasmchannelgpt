import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

export async function requireRole(role: 'admin' | 'partner') {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  if (!session.user?.role || session.user.role !== role) {
    redirect('/unauthorized');
  }

  return session;
}
