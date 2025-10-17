import 'next-auth';
import { Partner } from '@/lib/database';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: Partner['role'];
      partnerId: string;
    }
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role: Partner['role'];
    partnerId: string;
  }
}
