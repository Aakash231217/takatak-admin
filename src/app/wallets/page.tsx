'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, TRANSACTION_TYPES } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function WalletsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [rechargeModal, setRechargeModal] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({ targetUserId: '', amount: 0, coinType: 'GIFT' as 'GIFT' | 'GAME', description: '' });
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '100');
      const data = await api.getTransactions(params.toString());
      setTransactions(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeForm.targetUserId) { toast.error('User ID is required'); return; }
    if (rechargeForm.amount <= 0) { toast.error('Amount must be positive'); return; }
    try {
      await api.rechargeWallet(rechargeForm);
      toast.success('Wallet recharged successfully');
      setRechargeModal(false);
      setRechargeForm({ targetUserId: '', amount: 0, coinType: 'GIFT', description: '' });
      loadTransactions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getTypeColor = (type: string) => {
    if (type.includes('RECHARGE') || type.includes('BONUS') || type.includes('REWARD')) return 'badge-green';
    if (type.includes('PAYMENT') || type.includes('WITHDRAWAL')) return 'badge-red';
    if (type.includes('COMMISSION')) return 'badge-blue';
    if (type.includes('CONVERT') || type.includes('COIN') || type.includes('DIAMOND')) return 'badge-yellow';
    return 'badge-gray';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'badge-green';
      case 'PENDING': return 'badge-yellow';
      case 'FAILED': return 'badge-red';
      case 'REVERSED': return 'badge-purple';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallets & Transactions</h1>
          <p className="text-sm text-gray-500">View all transactions and recharge wallets</p>
        </div>
        <button onClick={() => setRechargeModal(true)} className="btn-success">+ Recharge Wallet</button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select max-w-[220px]">
          <option value="">All Types</option>
          {TRANSACTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={loadTransactions} className="btn-secondary">Refresh</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Coins</th>
                <th>Diamonds</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs">{shortId(tx.id)}</td>
                  <td><span className={getTypeColor(tx.type)}>{tx.type?.replace(/_/g, ' ')}</span></td>
                  <td className="text-sm">
                    {tx.sender?.username || tx.sender?.phone || (tx.senderId ? shortId(tx.senderId) : '-')}
                  </td>
                  <td className="text-sm">
                    {tx.receiver?.username || tx.receiver?.phone || (tx.receiverId ? shortId(tx.receiverId) : '-')}
                  </td>
                  <td className={`font-medium ${tx.coinAmount > 0 ? 'text-yellow-600' : ''}`}>
                    {tx.coinAmount > 0 ? `💰 ${tx.coinAmount}` : '-'}
                  </td>
                  <td className={`font-medium ${tx.diamondAmount > 0 ? 'text-purple-600' : ''}`}>
                    {tx.diamondAmount > 0 ? `💎 ${tx.diamondAmount}` : '-'}
                  </td>
                  <td><span className={getStatusColor(tx.status)}>{tx.status}</span></td>
                  <td className="text-xs text-gray-500">{tx.createdAt ? formatDate(tx.createdAt) : '-'}</td>
                  <td>
                    <button onClick={() => setSelectedTx(tx)} className="btn-secondary text-xs px-2 py-1">Details</button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Recharge Modal */}
      <Modal open={rechargeModal} onClose={() => setRechargeModal(false)} title="Recharge User Wallet">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input value={rechargeForm.targetUserId} onChange={(e) => setRechargeForm({ ...rechargeForm, targetUserId: e.target.value })} placeholder="Enter user UUID" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coin Type</label>
            <select value={rechargeForm.coinType} onChange={(e) => setRechargeForm({ ...rechargeForm, coinType: e.target.value as 'GIFT' | 'GAME' })} className="select">
              <option value="GIFT">Gift Coins</option>
              <option value="GAME">Game Coins</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" min={1} value={rechargeForm.amount} onChange={(e) => setRechargeForm({ ...rechargeForm, amount: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input value={rechargeForm.description} onChange={(e) => setRechargeForm({ ...rechargeForm, description: e.target.value })} placeholder="Admin recharge" className="input" />
          </div>
          <button onClick={handleRecharge} className="btn-success w-full">Recharge</button>
        </div>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal open={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (
          <div className="space-y-3">
            <InfoRow label="Transaction ID" value={selectedTx.id} />
            <InfoRow label="Idempotency Key" value={selectedTx.idempotencyKey || 'N/A'} />
            <InfoRow label="Type" value={selectedTx.type} />
            <InfoRow label="Status" value={selectedTx.status} />
            <InfoRow label="Coin Amount" value={selectedTx.coinAmount} />
            <InfoRow label="Diamond Amount" value={selectedTx.diamondAmount} />
            <InfoRow label="Sender" value={selectedTx.sender?.username || selectedTx.senderId || 'N/A'} />
            <InfoRow label="Receiver" value={selectedTx.receiver?.username || selectedTx.receiverId || 'N/A'} />
            <InfoRow label="Description" value={selectedTx.description || 'N/A'} />
            <InfoRow label="Created" value={selectedTx.createdAt ? formatDate(selectedTx.createdAt) : 'N/A'} />
            {selectedTx.metadata && (
              <div>
                <span className="text-xs text-gray-500">Metadata</span>
                <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto">{JSON.stringify(selectedTx.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right break-all max-w-[60%]">{String(value)}</span>
    </div>
  );
}
