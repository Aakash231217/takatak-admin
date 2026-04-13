'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, formatNumber } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

const HOST_LEVELS = ['NONE', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];
const SUPERSTAR_TAGS = ['TALENT', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];

export default function HostsPage() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [superstarModal, setSuperstarModal] = useState(false);
  const [superstarForm, setSuperstarForm] = useState({
    hostUserId: '', tag: 'TALENT', timeTargetHours: 60, diamondTarget: 10000,
  });

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers('role=HOST');
      const hostUsers = Array.isArray(data) ? data : data?.data || [];
      setHosts(hostUsers);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSalaries = async () => {
    if (!confirm('Process superstar salaries? This will calculate and distribute salaries for the current period.')) return;
    try {
      await api.processSuperstarSalaries();
      toast.success('Superstar salaries processed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRegisterSuperstar = async () => {
    try {
      await api.registerSuperstar(superstarForm);
      toast.success('Superstar registered');
      setSuperstarModal(false);
      setSuperstarForm({ hostUserId: '', tag: 'TALENT', timeTargetHours: 60, diamondTarget: 10000 });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const viewHostDetail = async (host: any) => {
    try {
      const detail = await api.getUser(host.id);
      setSelectedHost(detail);
    } catch {
      setSelectedHost(host);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Host Management</h1>
          <p className="text-sm text-gray-500">Manage hosts, rewards, and superstar programs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSuperstarModal(true)} className="btn-primary">⭐ Register Superstar</button>
          <button onClick={handleProcessSalaries} className="btn-success">💰 Process Salaries</button>
          <button onClick={loadHosts} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Hosts</p>
          <p className="text-2xl font-bold">{hosts.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Active Hosts</p>
          <p className="text-2xl font-bold text-green-600">{hosts.filter(h => h.isActive).length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-blue-600">{hosts.filter(h => h.isVerified).length}</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Host</th>
                <th>Phone</th>
                <th>VIP</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div>
                      <span className="font-medium">{h.username || 'No username'}</span>
                      <br /><span className="text-xs text-gray-400">{shortId(h.id)}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{h.phone}</td>
                  <td>{h.vipLevel > 0 ? <span className="badge-yellow">VIP {h.vipLevel}</span> : '-'}</td>
                  <td><span className={h.isActive ? 'badge-green' : 'badge-red'}>{h.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><span className={h.isVerified ? 'badge-green' : 'badge-gray'}>{h.isVerified ? 'Yes' : 'No'}</span></td>
                  <td className="text-xs text-gray-500">{h.createdAt ? formatDate(h.createdAt) : '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => viewHostDetail(h)} className="btn-secondary text-xs px-2 py-1">View</button>
                      <button onClick={() => {
                        setSuperstarForm({ ...superstarForm, hostUserId: h.id });
                        setSuperstarModal(true);
                      }} className="btn-primary text-xs px-2 py-1">⭐</button>
                    </div>
                  </td>
                </tr>
              ))}
              {hosts.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hosts found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Host Detail Modal */}
      <Modal open={!!selectedHost} onClose={() => setSelectedHost(null)} title="Host Details" wide>
        {selectedHost && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="User ID" value={selectedHost.id} />
              <InfoRow label="Username" value={selectedHost.username || 'N/A'} />
              <InfoRow label="Phone" value={selectedHost.phone} />
              <InfoRow label="Role" value={selectedHost.role} />
              <InfoRow label="VIP Level" value={selectedHost.vipLevel || 0} />
              <InfoRow label="Active" value={selectedHost.isActive ? 'Yes' : 'No'} />
              <InfoRow label="Verified" value={selectedHost.isVerified ? 'Yes' : 'No'} />
              <InfoRow label="Joined" value={selectedHost.createdAt ? formatDate(selectedHost.createdAt) : 'N/A'} />
            </div>

            {selectedHost.wallet && (
              <div>
                <h4 className="font-semibold mb-2">Wallet Balance</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Gift Coins</p>
                    <p className="text-lg font-bold text-yellow-600">{selectedHost.wallet.giftCoins}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Game Coins</p>
                    <p className="text-lg font-bold text-blue-600">{selectedHost.wallet.gameCoins}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Diamonds</p>
                    <p className="text-lg font-bold text-purple-600">{selectedHost.wallet.diamonds}</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Promo Diamonds</p>
                    <p className="text-lg font-bold text-pink-600">{selectedHost.wallet.promoDiamonds}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedHost.hostProfile && (
              <div>
                <h4 className="font-semibold mb-2">Host Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Host Level" value={selectedHost.hostProfile.hostLevel} />
                  <InfoRow label="Gender" value={selectedHost.hostProfile.gender || 'N/A'} />
                  <InfoRow label="Superstar" value={selectedHost.hostProfile.isSuperstar ? 'Yes' : 'No'} />
                  <InfoRow label="Superstar Tag" value={selectedHost.hostProfile.superstarTag || 'N/A'} />
                  <InfoRow label="Banned" value={selectedHost.hostProfile.isBanned ? 'Yes' : 'No'} />
                  <InfoRow label="Agency" value={selectedHost.hostProfile.agencyId ? shortId(selectedHost.hostProfile.agencyId) : 'None'} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Superstar Registration Modal */}
      <Modal open={superstarModal} onClose={() => setSuperstarModal(false)} title="Register Superstar">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host User ID</label>
            <input value={superstarForm.hostUserId} onChange={(e) => setSuperstarForm({ ...superstarForm, hostUserId: e.target.value })} placeholder="UUID" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Superstar Tag</label>
            <select value={superstarForm.tag} onChange={(e) => setSuperstarForm({ ...superstarForm, tag: e.target.value })} className="select">
              {SUPERSTAR_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Target (hours/month)</label>
            <input type="number" min={0} value={superstarForm.timeTargetHours} onChange={(e) => setSuperstarForm({ ...superstarForm, timeTargetHours: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Target</label>
            <input type="number" min={0} value={superstarForm.diamondTarget} onChange={(e) => setSuperstarForm({ ...superstarForm, diamondTarget: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <button onClick={handleRegisterSuperstar} className="btn-primary w-full">Register as Superstar</button>
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
