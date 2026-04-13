'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

const SETTING_DESCRIPTIONS: Record<string, string> = {
  DIAMOND_TO_COIN_RATIO: 'Exchange rate when converting diamonds to coins',
  MESSAGE_MAX_LENGTH: 'Maximum character length for chat messages',
  VERIFIED_BOOST_MULTIPLIER: 'Earnings multiplier for verified hosts',
  MIN_WITHDRAWAL_DIAMONDS: 'Minimum diamonds required for withdrawal request',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      await api.updateSetting(key, editValue);
      toast.success(`Setting "${key}" updated`);
      setEditing(null);
      loadSettings();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-gray-500">Configure system-wide settings</p>
        </div>
        <button onClick={loadSettings} className="btn-secondary">Refresh</button>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {settings.length === 0 && (
          <div className="card text-center py-8 text-gray-400">
            No settings configured yet. Default settings are used from environment variables.
          </div>
        )}
        {settings.map((s) => (
          <div key={s.key || s.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{s.key}</h3>
                <p className="text-xs text-gray-400 mt-1">{SETTING_DESCRIPTIONS[s.key] || 'System setting'}</p>
                {editing === s.key ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input max-w-xs"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(s.key)}
                    />
                    <button onClick={() => handleSave(s.key)} className="btn-primary">Save</button>
                    <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
                  </div>
                ) : (
                  <p className="text-lg font-bold mt-2">{s.value}</p>
                )}
              </div>
              {editing !== s.key && (
                <button
                  onClick={() => { setEditing(s.key); setEditValue(s.value); }}
                  className="btn-secondary text-xs"
                >
                  Edit
                </button>
              )}
            </div>
            {s.updatedAt && (
              <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">
                Last updated: {new Date(s.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Available Keys Info */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Available Setting Keys</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SETTING_DESCRIPTIONS).map(([key, desc]) => (
            <div key={key} className="text-sm">
              <span className="font-mono text-blue-700">{key}</span>
              <p className="text-xs text-blue-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
