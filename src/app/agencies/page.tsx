'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, formatNumber } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function AgenciesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [agencyDetail, setAgencyDetail] = useState<any>(null);
  const [reverseModal, setReverseModal] = useState(false);
  const [reverseTxId, setReverseTxId] = useState('');

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers('role=AGENCY');
      const agencyUsers = Array.isArray(data) ? data : data?.data || [];
      setUsers(agencyUsers);

      // Try to load agency details for each
      const details = await Promise.allSettled(
        agencyUsers.map((u: any) => api.getAgency(u.id).catch(() => null))
      );
      setAgencies(details.map((d, i) => ({
        user: agencyUsers[i],
        agency: d.status === 'fulfilled' ? d.value : null,
      })));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (agencyId: string) => {
    if (!confirm('Ban this agency?')) return;
    try {
      await api.banAgency(agencyId);
      toast.success('Agency banned');
      loadAgencies();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUnban = async (agencyId: string) => {
    try {
      await api.unbanAgency(agencyId);
      toast.success('Agency unbanned');
      loadAgencies();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReverseCommission = async () => {
    if (!reverseTxId) return;
    try {
      await api.reverseCommission(reverseTxId);
      toast.success('Commission reversed');
      setReverseModal(false);
      setReverseTxId('');
    } catch (e: any) { toast.error(e.message); }
  };

  const viewAgencyDetail = async (item: any) => {
    setSelectedAgency(item);
    if (item.agency?.id) {
      try {
        const detail = await api.getAgency(item.agency.id);
        setAgencyDetail(detail);
      } catch {
        setAgencyDetail(item.agency);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agency Management</h1>
          <p className="text-sm text-gray-500">Manage agencies, view commissions, ban/unban</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setReverseModal(true)} className="btn-danger">Reverse Commission</button>
          <button onClick={loadAgencies} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Owner</th>
                <th>Agency Name</th>
                <th>Level</th>
                <th>Rolling 30d Diamonds</th>
                <th>Hosts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((item, i) => (
                <tr key={i}>
                  <td>
                    <div>
                      <span className="font-medium text-sm">{item.user?.username || item.user?.phone}</span>
                      <br /><span className="text-xs text-gray-400">{shortId(item.user?.id || '')}</span>
                    </div>
                  </td>
                  <td className="font-medium">{item.agency?.name || 'N/A'}</td>
                  <td>
                    {item.agency?.level && (
                      <span className={`badge ${item.agency.level === 'S' ? 'badge-yellow' : item.agency.level === 'A' ? 'badge-purple' : 'badge-blue'}`}>
                        Level {item.agency.level}
                      </span>
                    )}
                  </td>
                  <td className="font-medium text-purple-600">
                    💎 {formatNumber(item.agency?.rollingDiamonds30d || 0)}
                  </td>
                  <td>{item.agency?.hosts?.length || item.agency?._count?.hosts || 0}</td>
                  <td>
                    {item.agency?.isBanned ? (
                      <span className="badge-red">Banned</span>
                    ) : (
                      <span className="badge-green">Active</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => viewAgencyDetail(item)} className="btn-secondary text-xs px-2 py-1">View</button>
                      {item.agency?.id && (
                        item.agency?.isBanned ? (
                          <button onClick={() => handleUnban(item.agency.id)} className="btn-success text-xs px-2 py-1">Unban</button>
                        ) : (
                          <button onClick={() => handleBan(item.agency.id)} className="btn-danger text-xs px-2 py-1">Ban</button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {agencies.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No agencies found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Agency Detail Modal */}
      <Modal open={!!selectedAgency} onClose={() => { setSelectedAgency(null); setAgencyDetail(null); }} title="Agency Details" wide>
        {selectedAgency && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Agency ID" value={selectedAgency.agency?.id || 'N/A'} />
              <InfoRow label="Name" value={selectedAgency.agency?.name || 'N/A'} />
              <InfoRow label="Owner" value={selectedAgency.user?.username || selectedAgency.user?.phone || 'N/A'} />
              <InfoRow label="Level" value={selectedAgency.agency?.level || 'N/A'} />
              <InfoRow label="Rolling 30d Diamonds" value={selectedAgency.agency?.rollingDiamonds30d || 0} />
              <InfoRow label="Banned" value={selectedAgency.agency?.isBanned ? 'Yes' : 'No'} />
              <InfoRow label="Created" value={selectedAgency.agency?.createdAt ? formatDate(selectedAgency.agency.createdAt) : 'N/A'} />
            </div>

            {agencyDetail?.hosts && agencyDetail.hosts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Hosts ({agencyDetail.hosts.length})</h4>
                <div className="space-y-2">
                  {agencyDetail.hosts.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{h.user?.username || h.user?.phone || shortId(h.userId)}</span>
                      <div className="flex gap-2">
                        <span className="badge-purple">Level {h.hostLevel}</span>
                        {h.isBanned && <span className="badge-red">Banned</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agencyDetail?.commissionLogs && agencyDetail.commissionLogs.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Commissions</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Gift Diamonds</th><th>Earned</th><th>Rate</th><th>Reversed</th></tr>
                    </thead>
                    <tbody>
                      {agencyDetail.commissionLogs.slice(0, 10).map((log: any) => (
                        <tr key={log.id}>
                          <td className="text-xs">{formatDate(log.createdAt)}</td>
                          <td>💎 {log.giftDiamonds}</td>
                          <td className="font-medium text-green-600">💎 {log.diamondsEarned}</td>
                          <td>{(log.effectiveRate * 100).toFixed(1)}%</td>
                          <td>{log.isReversal ? <span className="badge-red">Yes</span> : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reverse Commission Modal */}
      <Modal open={reverseModal} onClose={() => setReverseModal(false)} title="Reverse Commission">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter the transaction ID to reverse the commission.</p>
          <input value={reverseTxId} onChange={(e) => setReverseTxId(e.target.value)} placeholder="Transaction UUID" className="input" />
          <button onClick={handleReverseCommission} className="btn-danger w-full" disabled={!reverseTxId}>Reverse Commission</button>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium break-all">{String(value)}</p>
    </div>
  );
}
