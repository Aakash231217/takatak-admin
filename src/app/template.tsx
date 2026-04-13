'use client';
import AuthGuard from '@/components/AuthGuard';
import { Toaster } from 'react-hot-toast';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Toaster position="top-right" />
      {children}
    </AuthGuard>
  );
}
