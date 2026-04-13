'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, WITHDRAWAL_STATUSES } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.getWithdrawals(params.toString());
      setWithdrawals(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this withdrawal request?')) return;
    try {
      await api.approveWithdrawal(id);
      toast.success('Withdrawal approved');
      loadWithdrawals();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await api.rejectWithdrawal(rejectModal, adminNote);
      toast.success('Withdrawal rejected');
      setRejectModal(null);
      setAdminNote('');
      loadWithdrawals();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'badge-green';
      case 'PENDING': return 'badge-yellow';
      case 'REJECTED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
          <p className="text-sm text-gray-500">Approve or reject diamond withdrawal requests</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge-yellow text-sm">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold">{withdrawals.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Diamonds Requested</p>
          <p className="text-2xl font-bold text-purple-600">
            💎 {withdrawals.reduce((sum, w) => sum + (w.diamondAmount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select max-w-[180px]">
          <option value="">All Statuses</option>
          {WITHDRAWAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={loadWithdrawals} className="btn-secondary">Refresh</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Diamonds</th>
                <th>Status</th>
                <th>Admin Note</th>
                <th>Requested</th>
                <th>Processed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="font-mono text-xs">{shortId(w.id)}</td>
                  <td className="text-sm font-medium">
                    {w.user?.username || w.user?.phone || shortId(w.userId)}
                  </td>
                  <td className="font-medium text-purple-600">💎 {w.diamondAmount}</td>
                  <td><span className={getStatusColor(w.status)}>{w.status}</span></td>
                  <td className="text-sm text-gray-500 max-w-[200px] truncate">{w.adminNote || '-'}</td>
                  <td className="text-xs text-gray-500">{w.createdAt ? formatDate(w.createdAt) : '-'}</td>
                  <td className="text-xs text-gray-500">{w.processedAt ? formatDate(w.processedAt) : '-'}</td>
                  <td>
                    {w.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove(w.id)} className="btn-success text-xs px-2 py-1">
                          ✓ Approve
                        </button>
                        <button onClick={() => { setRejectModal(w.id); setAdminNote(''); }} className="btn-danger text-xs px-2 py-1">
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No withdrawal requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Withdrawal">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This will reject the withdrawal and refund diamonds back to the user.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (optional)</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Reason for rejection..." className="input min-h-[80px]" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleReject} className="btn-danger flex-1">Reject Withdrawal</button>
            <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
