'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, FRAUD_TYPES } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function FraudPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [userFraud, setUserFraud] = useState<any>(null);
  const [userFraudId, setUserFraudId] = useState('');

  useEffect(() => {
    loadFlags();
  }, [typeFilter, resolvedFilter]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (resolvedFilter) params.set('resolved', resolvedFilter);
      const data = await api.getFraudFlags(params.toString());
      setFlags(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (flagId: string) => {
    if (!confirm('Mark this flag as resolved?')) return;
    try {
      await api.resolveFraudFlag(flagId);
      toast.success('Flag resolved');
      loadFlags();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCheckUser = async () => {
    if (!userFraudId) return;
    try {
      const data = await api.getUserFraud(userFraudId);
      setUserFraud(data);
      toast.success('User fraud data loaded');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTI_ACCOUNT': return '👤👤';
      case 'SELF_CHAT': return '🔄';
      case 'RATE_ABUSE': return '⚡';
      case 'DEVICE_ANOMALY': return '📱';
      case 'SUSPICIOUS_PATTERN': return '🔍';
      default: return '⚠️';
    }
  };

  const unresolvedCount = flags.filter(f => !f.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fraud Detection</h1>
          <p className="text-sm text-gray-500">Monitor and resolve fraud flags</p>
        </div>
        {unresolvedCount > 0 && <span className="badge-red text-sm">{unresolvedCount} unresolved</span>}
      </div>

      {/* User Fraud Checker */}
      <div className="card">
        <h3 className="font-semibold mb-3">User Fraud Check</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">User ID</label>
            <input value={userFraudId} onChange={(e) => setUserFraudId(e.target.value)} placeholder="Enter user UUID" className="input" />
          </div>
          <button onClick={handleCheckUser} className="btn-primary">Check</button>
        </div>
        {userFraud && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Flags</p>
              <p className="text-xl font-bold text-red-600">{userFraud.totalFlags || userFraud.flags?.length || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Unresolved</p>
              <p className="text-xl font-bold text-yellow-600">{userFraud.unresolvedFlags || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Risk Level</p>
              <p className="text-xl font-bold text-blue-600">{userFraud.riskLevel || 'LOW'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select max-w-[200px]">
          <option value="">All Types</option>
          {FRAUD_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)} className="select max-w-[180px]">
          <option value="">All Status</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </select>
        <button onClick={loadFlags} className="btn-secondary">Refresh</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>User</th>
                <th>Description</th>
                <th>IP</th>
                <th>Device</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className={!f.resolved ? 'bg-red-50/50' : ''}>
                  <td>
                    <span className="badge-red">
                      {getTypeIcon(f.type)} {f.type?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-sm">{f.user?.username || f.user?.phone || shortId(f.userId)}</td>
                  <td className="text-sm max-w-[250px] truncate">{f.description}</td>
                  <td className="font-mono text-xs">{f.ipAddress || '-'}</td>
                  <td className="text-xs max-w-[100px] truncate">{f.deviceFingerprint || '-'}</td>
                  <td>
                    <span className={f.resolved ? 'badge-green' : 'badge-red'}>
                      {f.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{f.createdAt ? formatDate(f.createdAt) : '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedFlag(f)} className="btn-secondary text-xs px-2 py-1">Details</button>
                      {!f.resolved && (
                        <button onClick={() => handleResolve(f.id)} className="btn-success text-xs px-2 py-1">Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No fraud flags</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Flag Detail Modal */}
      <Modal open={!!selectedFlag} onClose={() => setSelectedFlag(null)} title="Fraud Flag Details">
        {selectedFlag && (
          <div className="space-y-3">
            <InfoRow label="Flag ID" value={selectedFlag.id} />
            <InfoRow label="Type" value={selectedFlag.type} />
            <InfoRow label="User" value={selectedFlag.user?.username || selectedFlag.userId} />
            <InfoRow label="Description" value={selectedFlag.description} />
            <InfoRow label="IP Address" value={selectedFlag.ipAddress || 'N/A'} />
            <InfoRow label="Device Fingerprint" value={selectedFlag.deviceFingerprint || 'N/A'} />
            <InfoRow label="Resolved" value={selectedFlag.resolved ? 'Yes' : 'No'} />
            <InfoRow label="Created" value={selectedFlag.createdAt ? formatDate(selectedFlag.createdAt) : 'N/A'} />
            {selectedFlag.metadata && (
              <div>
                <span className="text-xs text-gray-500">Metadata</span>
                <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto">{JSON.stringify(selectedFlag.metadata, null, 2)}</pre>
              </div>
            )}
            {!selectedFlag.resolved && (
              <button onClick={() => { handleResolve(selectedFlag.id); setSelectedFlag(null); }} className="btn-success w-full mt-4">
                Mark as Resolved
              </button>
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
