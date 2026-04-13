'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/chats', label: 'Chats & Messages', icon: '💬' },
  { href: '/wallets', label: 'Wallets & Transactions', icon: '💰' },
  { href: '/withdrawals', label: 'Withdrawals', icon: '🏧' },
  { href: '/gifts', label: 'Gifts', icon: '🎁' },
  { href: '/agencies', label: 'Agencies', icon: '🏢' },
  { href: '/hosts', label: 'Hosts', icon: '🎤' },
  { href: '/fraud', label: 'Fraud Detection', icon: '🚨' },
  { href: '/referrals', label: 'Referrals', icon: '🔗' },
  { href: '/settings', label: 'System Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-bg text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary-400">TakaTak</span> Admin
        </h1>
        <p className="text-xs text-gray-400 mt-1">Management Dashboard</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors',
                isActive ? 'bg-sidebar-active text-white font-medium' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        TakaTak Admin v1.0
      </div>
    </aside>
  );
}
