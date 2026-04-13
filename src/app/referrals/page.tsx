'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, historyData] = await Promise.allSettled([
        api.getReferralStats(),
        api.getReferralHistory(),
      ]);
      setStats(statsData.status === 'fulfilled' ? statsData.value : null);
      setHistory(historyData.status === 'fulfilled'
        ? (Array.isArray(historyData.value) ? historyData.value : historyData.value?.data || [])
        : []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-sm text-gray-500">View referral stats and history</p>
        </div>
        <button onClick={loadData} className="btn-secondary">Refresh</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Referrals</p>
            <p className="text-2xl font-bold">{stats.totalReferrals || 0}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Registration Rewards</p>
            <p className="text-2xl font-bold text-green-600">{stats.registrationRewardsGiven || 0}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">First Chat Rewards</p>
            <p className="text-2xl font-bold text-blue-600">{stats.firstChatRewardsGiven || 0}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Coins Earned</p>
            <p className="text-2xl font-bold text-yellow-600">💰 {stats.totalCoinsEarned || 0}</p>
          </div>
        </div>
      )}

      {/* History */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Referrer</th>
              <th>Referred User</th>
              <th>Registration Reward</th>
              <th>First Chat Reward</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{shortId(r.id)}</td>
                <td className="text-sm">
                  {r.referrer?.username || r.referrer?.phone || shortId(r.referrerId)}
                </td>
                <td className="text-sm">
                  {r.referred?.username || r.referred?.phone || shortId(r.referredId)}
                </td>
                <td>
                  <span className={r.registrationRewardGiven ? 'badge-green' : 'badge-gray'}>
                    {r.registrationRewardGiven ? '✓ Given' : 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={r.firstChatRewardGiven ? 'badge-green' : 'badge-gray'}>
                    {r.firstChatRewardGiven ? '✓ Given' : 'Pending'}
                  </span>
                </td>
                <td className="text-xs text-gray-500">{r.createdAt ? formatDate(r.createdAt) : '-'}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No referrals found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
