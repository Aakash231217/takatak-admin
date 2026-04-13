'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, ROLES } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ role: '', isActive: true, vipLevel: 0 });
  const [rechargeUser, setRechargeUser] = useState<any>(null);
  const [rechargeForm, setRechargeForm] = useState({ amount: 0, coinType: 'GIFT' as 'GIFT' | 'GAME', description: '' });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      const data = await api.getUsers(params.toString());
      setUsers(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      await api.updateUserAdmin(editUser.id, editForm);
      toast.success('User updated');
      setEditUser(null);
      loadUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure? This will soft-delete the user.')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeUser || rechargeForm.amount <= 0) return;
    try {
      await api.rechargeWallet({ targetUserId: rechargeUser.id, amount: rechargeForm.amount, coinType: rechargeForm.coinType, description: rechargeForm.description || undefined });
      toast.success('Wallet recharged');
      setRechargeUser(null);
      setRechargeForm({ amount: 0, coinType: 'GIFT', description: '' });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleViewUser = async (user: any) => {
    try {
      const [detail, followers, following] = await Promise.allSettled([
        api.getUser(user.id),
        api.getUserFollowers(user.id),
        api.getUserFollowing(user.id),
      ]);
      setSelectedUser({
        ...user,
        ...(detail.status === 'fulfilled' ? detail.value : {}),
        followers: followers.status === 'fulfilled' ? followers.value : [],
        following: following.status === 'fulfilled' ? following.value : [],
      });
    } catch {
      setSelectedUser(user);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (search) {
      const s = search.toLowerCase();
      return (u.username?.toLowerCase().includes(s) || u.phone?.includes(s) || u.id.includes(s));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-sm text-gray-500">Manage all users, roles, and accounts</p>
        </div>
        <span className="badge-blue">{filteredUsers.length} users</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          placeholder="Search by name, phone, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="select max-w-[160px]">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={loadUsers} className="btn-secondary">Refresh</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>VIP</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div>
                      <span className="font-medium">{u.username || 'No username'}</span>
                      <br />
                      <span className="text-xs text-gray-400">{shortId(u.id)}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{u.phone}</td>
                  <td>
                    <span className={`badge ${u.role === 'HOST' ? 'badge-purple' : u.role === 'ADMIN' ? 'badge-red' : u.role === 'AGENCY' ? 'badge-blue' : 'badge-gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.vipLevel > 0 ? <span className="badge-yellow">VIP {u.vipLevel}</span> : '-'}</td>
                  <td>
                    <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {u.deletedAt && <span className="badge-red ml-1">Deleted</span>}
                  </td>
                  <td className="text-xs text-gray-500">{u.createdAt ? formatDate(u.createdAt) : '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => handleViewUser(u)} className="btn-secondary text-xs px-2 py-1">View</button>
                      <button onClick={() => { setEditUser(u); setEditForm({ role: u.role, isActive: u.isActive, vipLevel: u.vipLevel || 0 }); }} className="btn-primary text-xs px-2 py-1">Edit</button>
                      <button onClick={() => { setRechargeUser(u); setRechargeForm({ amount: 0, coinType: 'GIFT', description: '' }); }} className="btn-success text-xs px-2 py-1">💰</button>
                      <button onClick={() => handleDeleteUser(u.id)} className="btn-danger text-xs px-2 py-1">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit User: ${editUser?.username || editUser?.phone}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="select">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIP Level</label>
            <input type="number" min={0} max={10} value={editForm.vipLevel} onChange={(e) => setEditForm({ ...editForm, vipLevel: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} id="isActive" />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          <button onClick={handleUpdateUser} className="btn-primary w-full">Save Changes</button>
        </div>
      </Modal>

      {/* Recharge Modal */}
      <Modal open={!!rechargeUser} onClose={() => setRechargeUser(null)} title={`Recharge: ${rechargeUser?.username || rechargeUser?.phone}`}>
        <div className="space-y-4">
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
          <button onClick={handleRecharge} className="btn-success w-full">Recharge Wallet</button>
        </div>
      </Modal>

      {/* View User Modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" wide>
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="ID" value={selectedUser.id} />
              <InfoRow label="Phone" value={selectedUser.phone} />
              <InfoRow label="Username" value={selectedUser.username || 'N/A'} />
              <InfoRow label="Role" value={selectedUser.role} />
              <InfoRow label="VIP Level" value={selectedUser.vipLevel || 0} />
              <InfoRow label="Active" value={selectedUser.isActive ? 'Yes' : 'No'} />
              <InfoRow label="Verified" value={selectedUser.isVerified ? 'Yes' : 'No'} />
              <InfoRow label="Country" value={selectedUser.country || 'N/A'} />
              <InfoRow label="Device FP" value={selectedUser.deviceFingerprint || 'N/A'} />
              <InfoRow label="Last Login IP" value={selectedUser.lastLoginIp || 'N/A'} />
              <InfoRow label="Joined" value={selectedUser.createdAt ? formatDate(selectedUser.createdAt) : 'N/A'} />
              <InfoRow label="Updated" value={selectedUser.updatedAt ? formatDate(selectedUser.updatedAt) : 'N/A'} />
            </div>

            {selectedUser.wallet && (
              <div>
                <h4 className="font-semibold mb-2">Wallet</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Gift Coins</p>
                    <p className="text-lg font-bold text-yellow-600">{selectedUser.wallet.giftCoins}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Game Coins</p>
                    <p className="text-lg font-bold text-blue-600">{selectedUser.wallet.gameCoins}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Diamonds</p>
                    <p className="text-lg font-bold text-purple-600">{selectedUser.wallet.diamonds}</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Promo Diamonds</p>
                    <p className="text-lg font-bold text-pink-600">{selectedUser.wallet.promoDiamonds}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.followers && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Followers ({Array.isArray(selectedUser.followers) ? selectedUser.followers.length : 0})</h4>
                  <div className="max-h-32 overflow-y-auto text-sm text-gray-600">
                    {(Array.isArray(selectedUser.followers) ? selectedUser.followers : []).map((f: any) => (
                      <div key={f.id} className="py-1">{f.follower?.username || f.follower?.phone || f.followerId}</div>
                    ))}
                    {(!selectedUser.followers || selectedUser.followers.length === 0) && <p className="text-gray-400">None</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Following ({Array.isArray(selectedUser.following) ? selectedUser.following.length : 0})</h4>
                  <div className="max-h-32 overflow-y-auto text-sm text-gray-600">
                    {(Array.isArray(selectedUser.following) ? selectedUser.following : []).map((f: any) => (
                      <div key={f.id} className="py-1">{f.followee?.username || f.followee?.phone || f.followeeId}</div>
                    ))}
                    {(!selectedUser.following || selectedUser.following.length === 0) && <p className="text-gray-400">None</p>}
                  </div>
                </div>
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
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium break-all">{String(value)}</p>
    </div>
  );
}
