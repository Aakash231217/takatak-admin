'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId, GIFT_CATEGORIES, GIFT_RARITIES, formatNumber } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

const emptyGift = {
  name: '', description: '', iconUrl: '', animationUrl: '', animationUrl_full: '',
  coinCost: 100, diamondValue: 50, category: 'BASIC' as string, rarity: 'COMMON' as string,
  displayOrder: 0, isActive: true, isLimited: false, minVipLevel: 0, comboMultiplier: 1.0,
  availableFrom: '', availableTill: '', eventTag: '',
};

export default function GiftsPage() {
  const [tab, setTab] = useState<'catalog' | 'analytics'>('catalog');
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGift, setEditGift] = useState<any>(null);
  const [giftForm, setGiftForm] = useState(emptyGift);
  const [isCreating, setIsCreating] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [topGifters, setTopGifters] = useState<any[]>([]);
  const [topHosts, setTopHosts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'catalog') loadGifts();
    else loadAnalytics();
  }, [tab]);

  const loadGifts = async () => {
    setLoading(true);
    try {
      const data = await api.getGifts('limit=100');
      setGifts(Array.isArray(data) ? data : data?.data || data?.gifts || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [metrics, gifters, hosts, trendData] = await Promise.allSettled([
        api.getGiftAnalytics(),
        api.getTopGifters(),
        api.getTopHosts(),
        api.getGiftTrends(),
      ]);
      setAnalytics(metrics.status === 'fulfilled' ? metrics.value : null);
      setTopGifters(gifters.status === 'fulfilled' ? (Array.isArray(gifters.value) ? gifters.value : gifters.value?.data || []) : []);
      setTopHosts(hosts.status === 'fulfilled' ? (Array.isArray(hosts.value) ? hosts.value : hosts.value?.data || []) : []);
      setTrends(trendData.status === 'fulfilled' ? (Array.isArray(trendData.value) ? trendData.value : trendData.value?.data || []) : []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleSaveGift = async () => {
    try {
      const data = { ...giftForm };
      if (!data.availableFrom) delete (data as any).availableFrom;
      if (!data.availableTill) delete (data as any).availableTill;
      if (!data.eventTag) delete (data as any).eventTag;

      if (isCreating) {
        await api.createGift(data);
        toast.success('Gift created');
      } else {
        await api.updateGift(editGift.id, data);
        toast.success('Gift updated');
      }
      setEditGift(null);
      setIsCreating(false);
      loadGifts();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm('Delete this gift?')) return;
    try {
      await api.deleteGift(id);
      toast.success('Gift deleted');
      loadGifts();
    } catch (e: any) { toast.error(e.message); }
  };

  const openCreate = () => {
    setIsCreating(true);
    setGiftForm(emptyGift);
    setEditGift({});
  };

  const openEdit = (gift: any) => {
    setIsCreating(false);
    setGiftForm({
      name: gift.name || '', description: gift.description || '',
      iconUrl: gift.iconUrl || '', animationUrl: gift.animationUrl || '',
      animationUrl_full: gift.animationUrl_full || '',
      coinCost: gift.coinCost || 0, diamondValue: gift.diamondValue || 0,
      category: gift.category || 'BASIC', rarity: gift.rarity || 'COMMON',
      displayOrder: gift.displayOrder || 0, isActive: gift.isActive ?? true,
      isLimited: gift.isLimited ?? false, minVipLevel: gift.minVipLevel || 0,
      comboMultiplier: gift.comboMultiplier || 1.0,
      availableFrom: gift.availableFrom || '', availableTill: gift.availableTill || '',
      eventTag: gift.eventTag || '',
    });
    setEditGift(gift);
  };

  const getRarityColor = (r: string) => {
    switch (r) { case 'LEGENDARY': return 'badge-yellow'; case 'EPIC': return 'badge-purple'; case 'RARE': return 'badge-blue'; default: return 'badge-gray'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gifts Management</h1>
          <p className="text-sm text-gray-500">Manage gift catalog and view analytics</p>
        </div>
        {tab === 'catalog' && <button onClick={openCreate} className="btn-primary">+ Create Gift</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-1">
        <button onClick={() => setTab('catalog')} className={`pb-2 text-sm ${tab === 'catalog' ? 'tab-active' : 'tab-inactive'}`}>Gift Catalog</button>
        <button onClick={() => setTab('analytics')} className={`pb-2 text-sm ${tab === 'analytics' ? 'tab-active' : 'tab-inactive'}`}>Analytics</button>
      </div>

      {loading ? <LoadingSpinner /> : tab === 'catalog' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Gift</th>
                <th>Category</th>
                <th>Rarity</th>
                <th>Cost (Coins)</th>
                <th>Value (Diamonds)</th>
                <th>VIP Req</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {g.iconUrl && <img src={g.iconUrl} alt={g.name} className="w-8 h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                      <div>
                        <span className="font-medium text-sm">{g.name}</span>
                        {g.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{g.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-blue">{g.category}</span></td>
                  <td><span className={getRarityColor(g.rarity)}>{g.rarity}</span></td>
                  <td className="font-medium text-yellow-600">💰 {g.coinCost}</td>
                  <td className="font-medium text-purple-600">💎 {g.diamondValue}</td>
                  <td>{g.minVipLevel > 0 ? <span className="badge-yellow">VIP {g.minVipLevel}+</span> : '-'}</td>
                  <td>
                    <span className={g.isActive ? 'badge-green' : 'badge-red'}>{g.isActive ? 'Active' : 'Inactive'}</span>
                    {g.isLimited && <span className="badge-yellow ml-1">Limited</span>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(g)} className="btn-primary text-xs px-2 py-1">Edit</button>
                      <button onClick={() => handleDeleteGift(g.id)} className="btn-danger text-xs px-2 py-1">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {gifts.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No gifts found</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center">
                <p className="text-sm text-gray-500">Total Gifts Sent</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalSent || 0)}</p>
              </div>
              <div className="card text-center">
                <p className="text-sm text-gray-500">Total Diamonds Earned</p>
                <p className="text-2xl font-bold text-purple-600">💎 {formatNumber(analytics.totalDiamondsEarned || 0)}</p>
              </div>
              <div className="card text-center">
                <p className="text-sm text-gray-500">Unique Senders</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(analytics.uniqueSenders || 0)}</p>
              </div>
              <div className="card text-center">
                <p className="text-sm text-gray-500">Unique Receivers</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.uniqueReceivers || 0)}</p>
              </div>
            </div>
          )}

          {/* Top Gifters & Hosts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-4">🏆 Top Gifters</h3>
              <div className="space-y-2">
                {topGifters.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                {topGifters.slice(0, 10).map((g: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                      <span className="text-sm font-medium">{g.username || g.phone || shortId(g.userId || g.id || '')}</span>
                    </div>
                    <span className="text-sm font-medium text-yellow-600">💰 {formatNumber(g.totalCoinsSpent || g.totalSent || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4">⭐ Top Earning Hosts</h3>
              <div className="space-y-2">
                {topHosts.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                {topHosts.slice(0, 10).map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                      <span className="text-sm font-medium">{h.username || h.phone || shortId(h.userId || h.id || '')}</span>
                    </div>
                    <span className="text-sm font-medium text-purple-600">💎 {formatNumber(h.totalDiamondsEarned || h.totalReceived || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trends */}
          {trends.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">📈 Gift Trends</h3>
              <div className="space-y-2">
                {trends.slice(0, 10).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm font-medium">{t.giftName || t.name || `Gift #${i + 1}`}</span>
                    <div className="flex gap-4">
                      <span className="text-xs text-gray-500">Sent: {t.totalSent || 0}</span>
                      <span className="text-xs text-gray-500">Score: {(t.popularityScore || 0).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gift Edit/Create Modal */}
      <Modal open={!!editGift} onClose={() => { setEditGift(null); setIsCreating(false); }} title={isCreating ? 'Create Gift' : 'Edit Gift'} wide>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input value={giftForm.name} onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input value={giftForm.description} onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Icon URL *</label>
            <input value={giftForm.iconUrl} onChange={(e) => setGiftForm({ ...giftForm, iconUrl: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Animation URL *</label>
            <input value={giftForm.animationUrl} onChange={(e) => setGiftForm({ ...giftForm, animationUrl: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Animation URL</label>
            <input value={giftForm.animationUrl_full} onChange={(e) => setGiftForm({ ...giftForm, animationUrl_full: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select value={giftForm.category} onChange={(e) => setGiftForm({ ...giftForm, category: e.target.value })} className="select">
              {GIFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rarity</label>
            <select value={giftForm.rarity} onChange={(e) => setGiftForm({ ...giftForm, rarity: e.target.value })} className="select">
              {GIFT_RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Coin Cost</label>
            <input type="number" min={0} value={giftForm.coinCost} onChange={(e) => setGiftForm({ ...giftForm, coinCost: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Diamond Value</label>
            <input type="number" min={0} value={giftForm.diamondValue} onChange={(e) => setGiftForm({ ...giftForm, diamondValue: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" min={0} value={giftForm.displayOrder} onChange={(e) => setGiftForm({ ...giftForm, displayOrder: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min VIP Level</label>
            <input type="number" min={0} max={10} value={giftForm.minVipLevel} onChange={(e) => setGiftForm({ ...giftForm, minVipLevel: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Combo Multiplier</label>
            <input type="number" min={0} step={0.1} value={giftForm.comboMultiplier} onChange={(e) => setGiftForm({ ...giftForm, comboMultiplier: parseFloat(e.target.value) || 1.0 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Event Tag</label>
            <input value={giftForm.eventTag} onChange={(e) => setGiftForm({ ...giftForm, eventTag: e.target.value })} className="input" />
          </div>
          <div className="flex items-center gap-4 col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={giftForm.isActive} onChange={(e) => setGiftForm({ ...giftForm, isActive: e.target.checked })} /><span className="text-sm">Active</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={giftForm.isLimited} onChange={(e) => setGiftForm({ ...giftForm, isLimited: e.target.checked })} /><span className="text-sm">Limited Edition</span></label>
          </div>
          <div className="col-span-2">
            <button onClick={handleSaveGift} className="btn-primary w-full">{isCreating ? 'Create Gift' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
