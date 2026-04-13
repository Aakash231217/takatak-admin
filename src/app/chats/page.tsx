'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate, shortId } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function ChatsPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [intimacyData, setIntimacyData] = useState<any>(null);
  const [intimacyUserId, setIntimacyUserId] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const data = await api.getChats();
      setChats(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const viewMessages = async (chat: any) => {
    setSelectedChat(chat);
    setMessagesLoading(true);
    try {
      const data = await api.getChatMessages(chat.id, 'limit=100');
      setMessages(Array.isArray(data) ? data : data?.data || data?.messages || []);
    } catch (e: any) {
      toast.error(e.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const checkIntimacy = async () => {
    if (!intimacyUserId) return;
    try {
      const data = await api.getIntimacy(intimacyUserId);
      setIntimacyData(data);
      toast.success('Intimacy data loaded');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return '🖼️';
      case 'EMOJI': return '😀';
      case 'GIFT': return '🎁';
      default: return '💬';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chats & Messages</h1>
          <p className="text-sm text-gray-500">View all conversations, messages, and intimacy levels</p>
        </div>
        <button onClick={loadChats} className="btn-secondary">Refresh</button>
      </div>

      {/* Intimacy Checker */}
      <div className="card">
        <h3 className="font-semibold mb-3">Intimacy Level Checker</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">User ID</label>
            <input value={intimacyUserId} onChange={(e) => setIntimacyUserId(e.target.value)} placeholder="Enter user UUID" className="input" />
          </div>
          <button onClick={checkIntimacy} className="btn-primary">Check</button>
        </div>
        {intimacyData && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="bg-pink-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Level</p>
              <p className="text-2xl font-bold text-pink-600">{intimacyData.level || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Points</p>
              <p className="text-2xl font-bold text-purple-600">{intimacyData.points || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">User</p>
              <p className="text-xs font-medium text-blue-600 break-all">{intimacyData.userId ? shortId(intimacyData.userId) : 'N/A'}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Last Message</p>
              <p className="text-xs font-medium text-green-600">{intimacyData.lastMessageAt ? formatDate(intimacyData.lastMessageAt) : 'Never'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chats List */}
      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Chat ID</th>
                <th>User 1</th>
                <th>User 2</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{shortId(c.id)}</td>
                  <td>
                    <div>
                      <span className="text-sm font-medium">{c.user1?.username || c.user1?.phone || shortId(c.user1Id)}</span>
                      {c.user1?.role && <span className={`badge ml-1 ${c.user1.role === 'HOST' ? 'badge-purple' : 'badge-gray'}`}>{c.user1.role}</span>}
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="text-sm font-medium">{c.user2?.username || c.user2?.phone || shortId(c.user2Id)}</span>
                      {c.user2?.role && <span className={`badge ml-1 ${c.user2.role === 'HOST' ? 'badge-purple' : 'badge-gray'}`}>{c.user2.role}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={c.isActive ? 'badge-green' : 'badge-red'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{c.createdAt ? formatDate(c.createdAt) : '-'}</td>
                  <td>
                    <button onClick={() => viewMessages(c)} className="btn-primary text-xs px-2 py-1">
                      View Messages
                    </button>
                  </td>
                </tr>
              ))}
              {chats.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No chats found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Messages Modal */}
      <Modal open={!!selectedChat} onClose={() => { setSelectedChat(null); setMessages([]); }} title={`Chat Messages`} wide>
        {selectedChat && (
          <div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <span className="font-medium">{selectedChat.user1?.username || selectedChat.user1?.phone || 'User1'}</span>
              <span className="mx-2 text-gray-400">↔</span>
              <span className="font-medium">{selectedChat.user2?.username || selectedChat.user2?.phone || 'User2'}</span>
              <span className="text-gray-400 ml-4">Chat ID: {shortId(selectedChat.id)}</span>
            </div>

            {messagesLoading ? <LoadingSpinner /> : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {messages.length === 0 && <p className="text-center text-gray-400 py-8">No messages</p>}
                {messages.map((msg) => {
                  const isUser1 = msg.senderId === selectedChat.user1Id;
                  return (
                    <div key={msg.id} className={`flex ${isUser1 ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-md ${isUser1 ? 'bubble-received' : 'bubble-sent'}`}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs opacity-70">
                            {getMessageIcon(msg.messageType)} {msg.sender?.username || shortId(msg.senderId)}
                          </span>
                        </div>
                        {msg.messageType === 'IMAGE' && msg.mediaUrl && (
                          <img src={msg.mediaUrl} alt="chat image" className="max-w-[200px] rounded-lg mb-1" />
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-between mt-1 text-xs opacity-60">
                          <span>{msg.createdAt ? formatDate(msg.createdAt) : ''}</span>
                          <span>
                            {msg.coinCost > 0 && `💰${msg.coinCost}`}
                            {msg.diamondGenerated > 0 && ` 💎${msg.diamondGenerated}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
