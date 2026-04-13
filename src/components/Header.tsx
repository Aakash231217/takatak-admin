'use client';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      if (stored && stored !== 'undefined') setUser(JSON.parse(stored));
    } catch { /* ignore parse errors */ }
  }, []);

  const handleLogout = () => {
    api.clearToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          {user?.phone && <span className="font-medium">{user.phone}</span>}
          {user?.role && <span className="badge-purple ml-2">{user.role}</span>}
        </div>
        <button onClick={handleLogout} className="btn-secondary text-xs">
          Logout
        </button>
      </div>
    </header>
  );
}
