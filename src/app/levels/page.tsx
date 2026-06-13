'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

type LevelType = 'WEALTH' | 'CHARM';
type RewardType = 'FRAME' | 'ENTRY' | 'ENTRANCE' | 'CHAT_BUBBLE';
type SubTab = 'tiers' | 'rewards' | 'tasks';

const REWARD_TYPES: RewardType[] = ['FRAME', 'ENTRY', 'ENTRANCE', 'CHAT_BUBBLE'];
const REWARD_LABELS: Record<RewardType, string> = {
  FRAME: 'Level frame',
  ENTRY: 'Level Entry',
  ENTRANCE: 'Level Entrance',
  CHAT_BUBBLE: 'Chat bubble',
};

const emptyTier = { level: 1, minXp: 0, badgeColor: '#B8E986', label: '', iconUrl: '', isActive: true };
const emptyReward = { rewardType: 'FRAME' as RewardType, level: 10, name: '', imageUrl: '', animationUrl: '', durationDays: 0, displayOrder: 0, isActive: true };
const emptyTask = { key: '', title: '', subtitle: '', iconUrl: '', xpHint: '', actionRoute: '', displayOrder: 0, isActive: true };

export default function LevelsPage() {
  const [type, setType] = useState<LevelType>('WEALTH');
  const [subTab, setSubTab] = useState<SubTab>('tiers');
  const [loading, setLoading] = useState(true);

  const [tiers, setTiers] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Modal state
  const [editItem, setEditItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tierForm, setTierForm] = useState(emptyTier);
  const [rewardForm, setRewardForm] = useState(emptyReward);
  const [taskForm, setTaskForm] = useState(emptyTask);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'tiers') {
        const data = await api.getLevelTiers(type);
        setTiers(Array.isArray(data) ? data : []);
      } else if (subTab === 'rewards') {
        const data = await api.getLevelRewards(type);
        setRewards(Array.isArray(data) ? data : []);
      } else {
        const data = await api.getLevelTasks(type);
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [type, subTab]);

  useEffect(() => { load(); }, [load]);

  // ── Tiers ──────────────────────────────────────────────────────────────
  const openCreateTier = () => { setIsCreating(true); setTierForm(emptyTier); setEditItem({ kind: 'tier' }); };
  const openEditTier = (t: any) => {
    setIsCreating(false);
    setTierForm({ level: t.level, minXp: t.minXp, badgeColor: t.badgeColor || '#B8E986', label: t.label || '', iconUrl: t.iconUrl || '', isActive: t.isActive ?? true });
    setEditItem({ kind: 'tier', id: t.id });
  };
  const saveTier = async () => {
    try {
      const data: any = { ...tierForm };
      if (!data.label) delete data.label;
      if (!data.iconUrl) delete data.iconUrl;
      if (isCreating) { await api.createLevelTier({ ...data, type }); toast.success('Tier created'); }
      else { await api.updateLevelTier(editItem.id, data); toast.success('Tier updated'); }
      closeModal(); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const deleteTier = async (id: string) => {
    if (!confirm('Delete this tier?')) return;
    try { await api.deleteLevelTier(id); toast.success('Tier deleted'); load(); } catch (e: any) { toast.error(e.message); }
  };

  // ── Rewards ────────────────────────────────────────────────────────────
  const openCreateReward = () => { setIsCreating(true); setRewardForm(emptyReward); setEditItem({ kind: 'reward' }); };
  const openEditReward = (r: any) => {
    setIsCreating(false);
    setRewardForm({ rewardType: r.rewardType, level: r.level, name: r.name || '', imageUrl: r.imageUrl || '', animationUrl: r.animationUrl || '', durationDays: r.durationDays || 0, displayOrder: r.displayOrder || 0, isActive: r.isActive ?? true });
    setEditItem({ kind: 'reward', id: r.id });
  };
  const saveReward = async () => {
    try {
      const data: any = { ...rewardForm };
      if (!data.animationUrl) delete data.animationUrl;
      if (isCreating) { await api.createLevelReward({ ...data, type }); toast.success('Reward created'); }
      else { await api.updateLevelReward(editItem.id, data); toast.success('Reward updated'); }
      closeModal(); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const deleteReward = async (id: string) => {
    if (!confirm('Delete this reward?')) return;
    try { await api.deleteLevelReward(id); toast.success('Reward deleted'); load(); } catch (e: any) { toast.error(e.message); }
  };

  // ── Tasks ──────────────────────────────────────────────────────────────
  const openCreateTask = () => { setIsCreating(true); setTaskForm(emptyTask); setEditItem({ kind: 'task' }); };
  const openEditTask = (t: any) => {
    setIsCreating(false);
    setTaskForm({ key: t.key || '', title: t.title || '', subtitle: t.subtitle || '', iconUrl: t.iconUrl || '', xpHint: t.xpHint || '', actionRoute: t.actionRoute || '', displayOrder: t.displayOrder || 0, isActive: t.isActive ?? true });
    setEditItem({ kind: 'task', id: t.id });
  };
  const saveTask = async () => {
    try {
      const data: any = { ...taskForm };
      ['subtitle', 'iconUrl', 'xpHint', 'actionRoute'].forEach((k) => { if (!data[k]) delete data[k]; });
      if (isCreating) { await api.createLevelTask({ ...data, type }); toast.success('Task created'); }
      else { await api.updateLevelTask(editItem.id, data); toast.success('Task updated'); }
      closeModal(); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try { await api.deleteLevelTask(id); toast.success('Task deleted'); load(); } catch (e: any) { toast.error(e.message); }
  };

  const closeModal = () => { setEditItem(null); setIsCreating(false); };

  const handleCreate = () => {
    if (subTab === 'tiers') openCreateTier();
    else if (subTab === 'rewards') openCreateReward();
    else openCreateTask();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Levels Management</h1>
          <p className="text-sm text-gray-500">Configure Wealth (senders) &amp; Charm (broadcasters) levels, rewards and tasks. Fully app-driven — no hardcoded data.</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">+ Add {subTab === 'tiers' ? 'Tier' : subTab === 'rewards' ? 'Reward' : 'Task'}</button>
      </div>

      {/* Level type selector */}
      <div className="flex gap-2">
        {(['WEALTH', 'CHARM'] as LevelType[]).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'WEALTH' ? '💰 Wealth (Senders)' : '💎 Charm (Broadcasters)'}
          </button>
        ))}
      </div>

      {/* Sub tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-1">
        <button onClick={() => setSubTab('tiers')} className={`pb-2 text-sm ${subTab === 'tiers' ? 'tab-active' : 'tab-inactive'}`}>Level Tiers &amp; Badges</button>
        <button onClick={() => setSubTab('rewards')} className={`pb-2 text-sm ${subTab === 'rewards' ? 'tab-active' : 'tab-inactive'}`}>Rewards (Frames / Entry / Entrance / Bubble)</button>
        <button onClick={() => setSubTab('tasks')} className={`pb-2 text-sm ${subTab === 'tasks' ? 'tab-active' : 'tab-inactive'}`}>How to level up (Tasks)</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {subTab === 'tiers' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Level</th><th>Min XP</th><th>Badge Color</th><th>Label</th><th>Icon</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {tiers.map((t) => (
                    <tr key={t.id}>
                      <td className="font-bold">Lv.{t.level}</td>
                      <td>{t.minXp.toLocaleString()} XP</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: t.badgeColor }} />
                          <span className="text-xs text-gray-500">{t.badgeColor}</span>
                        </div>
                      </td>
                      <td>{t.label || '-'}</td>
                      <td>{t.iconUrl ? <img src={t.iconUrl} alt="" className="w-7 h-7 rounded" /> : '-'}</td>
                      <td><span className={t.isActive ? 'badge-green' : 'badge-red'}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEditTier(t)} className="btn-primary text-xs px-2 py-1">Edit</button>
                          <button onClick={() => deleteTier(t.id)} className="btn-danger text-xs px-2 py-1">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tiers.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No tiers configured. Add one to start.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {subTab === 'rewards' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Reward</th><th>Category</th><th>Unlock Level</th><th>Duration</th><th>Order</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {rewards.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {r.imageUrl && <img src={r.imageUrl} alt={r.name} className="w-9 h-9 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <span className="font-medium text-sm">{r.name}</span>
                        </div>
                      </td>
                      <td><span className="badge-blue">{REWARD_LABELS[r.rewardType as RewardType] || r.rewardType}</span></td>
                      <td className="font-bold">Lv.{r.level}</td>
                      <td>{r.durationDays > 0 ? `${r.durationDays} days` : 'Permanent'}</td>
                      <td>{r.displayOrder}</td>
                      <td><span className={r.isActive ? 'badge-green' : 'badge-red'}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEditReward(r)} className="btn-primary text-xs px-2 py-1">Edit</button>
                          <button onClick={() => deleteReward(r.id)} className="btn-danger text-xs px-2 py-1">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rewards.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No rewards configured.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {subTab === 'tasks' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Title</th><th>Key</th><th>Subtitle</th><th>XP Hint</th><th>Action Route</th><th>Order</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {t.iconUrl && <img src={t.iconUrl} alt="" className="w-7 h-7 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <span className="font-medium text-sm">{t.title}</span>
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">{t.key}</td>
                      <td className="text-xs text-gray-500 max-w-[220px] truncate">{t.subtitle || '-'}</td>
                      <td>{t.xpHint || '-'}</td>
                      <td className="text-xs text-gray-500">{t.actionRoute || '-'}</td>
                      <td>{t.displayOrder}</td>
                      <td><span className={t.isActive ? 'badge-green' : 'badge-red'}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEditTask(t)} className="btn-primary text-xs px-2 py-1">Edit</button>
                          <button onClick={() => deleteTask(t.id)} className="btn-danger text-xs px-2 py-1">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No tasks configured.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tier Modal */}
      <Modal open={!!editItem && editItem.kind === 'tier'} onClose={closeModal} title={isCreating ? 'Create Level Tier' : 'Edit Level Tier'} wide>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Level *</label>
            <input type="number" min={1} value={tierForm.level} onChange={(e) => setTierForm({ ...tierForm, level: parseInt(e.target.value) || 1 })} className="input" disabled={!isCreating} />
            {!isCreating && <p className="text-[10px] text-gray-400 mt-1">Level number can&apos;t be changed after creation.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min XP (cumulative) *</label>
            <input type="number" min={0} value={tierForm.minXp} onChange={(e) => setTierForm({ ...tierForm, minXp: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Badge Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={tierForm.badgeColor} onChange={(e) => setTierForm({ ...tierForm, badgeColor: e.target.value })} className="h-10 w-14 rounded border" />
              <input value={tierForm.badgeColor} onChange={(e) => setTierForm({ ...tierForm, badgeColor: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Label (optional)</label>
            <input value={tierForm.label} onChange={(e) => setTierForm({ ...tierForm, label: e.target.value })} className="input" placeholder="e.g. Bronze" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Badge Icon URL (optional)</label>
            <input value={tierForm.iconUrl} onChange={(e) => setTierForm({ ...tierForm, iconUrl: e.target.value })} className="input" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={tierForm.isActive} onChange={(e) => setTierForm({ ...tierForm, isActive: e.target.checked })} /><span className="text-sm">Active</span></label>
          </div>
          <div className="col-span-2">
            <button onClick={saveTier} className="btn-primary w-full">{isCreating ? 'Create Tier' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>

      {/* Reward Modal */}
      <Modal open={!!editItem && editItem.kind === 'reward'} onClose={closeModal} title={isCreating ? 'Create Reward' : 'Edit Reward'} wide>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reward Category *</label>
            <select value={rewardForm.rewardType} onChange={(e) => setRewardForm({ ...rewardForm, rewardType: e.target.value as RewardType })} className="select">
              {REWARD_TYPES.map((rt) => <option key={rt} value={rt}>{REWARD_LABELS[rt]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unlock at Level *</label>
            <input type="number" min={1} value={rewardForm.level} onChange={(e) => setRewardForm({ ...rewardForm, level: parseInt(e.target.value) || 1 })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Duration (days, 0 = permanent)</label>
            <input type="number" min={0} value={rewardForm.durationDays} onChange={(e) => setRewardForm({ ...rewardForm, durationDays: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Image URL *</label>
            <input value={rewardForm.imageUrl} onChange={(e) => setRewardForm({ ...rewardForm, imageUrl: e.target.value })} className="input" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Animation URL (svga / lottie / mp4 — optional)</label>
            <input value={rewardForm.animationUrl} onChange={(e) => setRewardForm({ ...rewardForm, animationUrl: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" min={0} value={rewardForm.displayOrder} onChange={(e) => setRewardForm({ ...rewardForm, displayOrder: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2"><input type="checkbox" checked={rewardForm.isActive} onChange={(e) => setRewardForm({ ...rewardForm, isActive: e.target.checked })} /><span className="text-sm">Active</span></label>
          </div>
          <div className="col-span-2">
            <button onClick={saveReward} className="btn-primary w-full">{isCreating ? 'Create Reward' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>

      {/* Task Modal */}
      <Modal open={!!editItem && editItem.kind === 'task'} onClose={closeModal} title={isCreating ? 'Create Task' : 'Edit Task'} wide>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Key *</label>
            <input value={taskForm.key} onChange={(e) => setTaskForm({ ...taskForm, key: e.target.value })} className="input" placeholder="e.g. send_gift" disabled={!isCreating} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="input" placeholder="e.g. Send Gift" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
            <input value={taskForm.subtitle} onChange={(e) => setTaskForm({ ...taskForm, subtitle: e.target.value })} className="input" placeholder="e.g. 1 Coin = 1 Exp" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">XP Hint</label>
            <input value={taskForm.xpHint} onChange={(e) => setTaskForm({ ...taskForm, xpHint: e.target.value })} className="input" placeholder="e.g. +1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action Route (in-app deep link)</label>
            <input value={taskForm.actionRoute} onChange={(e) => setTaskForm({ ...taskForm, actionRoute: e.target.value })} className="input" placeholder="e.g. /store or /vip" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Icon URL</label>
            <input value={taskForm.iconUrl} onChange={(e) => setTaskForm({ ...taskForm, iconUrl: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" min={0} value={taskForm.displayOrder} onChange={(e) => setTaskForm({ ...taskForm, displayOrder: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2"><input type="checkbox" checked={taskForm.isActive} onChange={(e) => setTaskForm({ ...taskForm, isActive: e.target.checked })} /><span className="text-sm">Active</span></label>
          </div>
          <div className="col-span-2">
            <button onClick={saveTask} className="btn-primary w-full">{isCreating ? 'Create Task' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
