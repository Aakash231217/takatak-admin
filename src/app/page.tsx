'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalHosts: number;
  totalAgencies: number;
  pendingWithdrawals: number;
  unresolvedFraud: number;
  activeGifts: number;
  health: { status: string; database: string; redis: string } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [recentFlags, setRecentFlags] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [usersData, withdrawalsData, fraudData, giftsData, healthData] = await Promise.allSettled([
        api.getUsers('limit=100'),
        api.getWithdrawals('status=PENDING'),
        api.getFraudFlags('resolved=false'),
        api.getGifts('limit=1'),
        api.getHealth(),
      ]);

      const usersList = usersData.status === 'fulfilled' ? (Array.isArray(usersData.value) ? usersData.value : usersData.value?.data || []) : [];
      const withdrawalsList = withdrawalsData.status === 'fulfilled' ? (Array.isArray(withdrawalsData.value) ? withdrawalsData.value : withdrawalsData.value?.data || []) : [];
      const fraudList = fraudData.status === 'fulfilled' ? (Array.isArray(fraudData.value) ? fraudData.value : fraudData.value?.data || []) : [];
      const giftsTotal = giftsData.status === 'fulfilled' ? (giftsData.value?.total || 0) : 0;
      const health = healthData.status === 'fulfilled' ? healthData.value : null;

      setUsers(usersList.slice(0, 10));
      setRecentFlags(fraudList.slice(0, 5));
      setStats({
        totalUsers: usersList.length,
        totalHosts: usersList.filter((u: any) => u.role === 'HOST').length,
        totalAgencies: usersList.filter((u: any) => u.role === 'AGENCY').length,
        pendingWithdrawals: withdrawalsList.length,
        unresolvedFraud: fraudList.length,
        activeGifts: giftsTotal,
        health,
      });
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to TakaTak Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon="👥" color="blue" />
        <StatCard label="Total Hosts" value={stats?.totalHosts || 0} icon="🎤" color="purple" />
        <StatCard label="Agencies" value={stats?.totalAgencies || 0} icon="🏢" color="green" />
        <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals || 0} icon="🏧" color="yellow" />
        <StatCard label="Fraud Alerts" value={stats?.unresolvedFraud || 0} icon="🚨" color="red" />
        <StatCard label="Active Gifts" value={stats?.activeGifts || 0} icon="🎁" color="pink" />
        <div className="stat-card">
          <span className="stat-label">System Health</span>
          <div className="flex gap-2 mt-2">
            <span className={`badge ${stats?.health?.database === 'ok' ? 'badge-green' : 'badge-red'}`}>
              DB: {stats?.health?.database || 'N/A'}
            </span>
            <span className={`badge ${stats?.health?.redis === 'ok' ? 'badge-green' : 'badge-red'}`}>
              Redis: {stats?.health?.redis || 'N/A'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">API Status</span>
          <span className={`stat-value text-lg ${stats?.health?.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {stats?.health?.status === 'ok' ? '✅ Online' : '❌ Offline'}
          </span>
        </div>
      </div>

      {/* Recent Users & Fraud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
          <div className="space-y-3">
            {users.length === 0 && <p className="text-sm text-gray-400">No users found</p>}
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <span className="text-sm font-medium">{u.username || u.phone}</span>
                  <span className={`ml-2 badge ${u.role === 'HOST' ? 'badge-purple' : u.role === 'ADMIN' ? 'badge-red' : u.role === 'AGENCY' ? 'badge-blue' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{u.phone}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Fraud Alerts</h3>
          <div className="space-y-3">
            {recentFlags.length === 0 && <p className="text-sm text-gray-400">No unresolved fraud flags</p>}
            {recentFlags.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <span className="badge-red">{f.type}</span>
                  <span className="text-sm ml-2">{f.description?.slice(0, 50)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{formatNumber(value)}</p>
      </div>
    </div>
  );
}
