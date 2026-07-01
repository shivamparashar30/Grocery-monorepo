import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Bell, Send, Megaphone, Users, Filter, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const TYPE_BADGE = {
  general: 'bg-gray-100 text-gray-600',
  order: 'bg-blue-50 text-blue-700',
  delivery: 'bg-cyan-50 text-cyan-700',
  payment: 'bg-emerald-50 text-emerald-700',
  offer: 'bg-amber-50 text-amber-700',
  product: 'bg-purple-50 text-purple-700',
  system: 'bg-red-50 text-red-700',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'general', priority: 'medium' });
  const [sending, setSending] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    const params = { page, limit: 30 };
    if (filter) params.type = filter;
    API.get('/notifications/admin/all', { params })
      .then(r => {
        if (r.data.success) {
          setNotifications(r.data.data || []);
          setTotal(r.data.total || 0);
          setPages(r.data.pages || 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    API.get('/notifications/stats')
      .then(r => { if (r.data.success) setStats(r.data.data); })
      .catch(console.error);
  };

  useEffect(() => { fetchNotifications(); }, [page, filter]);
  useEffect(fetchStats, []);

  const handleBroadcast = async () => {
    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      return toast.error('Title and message are required');
    }
    setSending(true);
    try {
      const { data } = await API.post('/notifications/broadcast', broadcast);
      if (data.success) {
        toast.success(data.message || 'Broadcast sent!');
        setShowBroadcast(false);
        setBroadcast({ title: '', message: '', type: 'general', priority: 'medium' });
        fetchNotifications();
        fetchStats();
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await API.delete(`/notifications/${id}`);
      toast.success('Deleted');
      fetchNotifications();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading && notifications.length === 0) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">{total} total notifications</p>
        </div>
        <button onClick={() => setShowBroadcast(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
          <Megaphone size={16} /> Send Broadcast
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
              <Bell size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Sent</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUnread}</p>
              <p className="text-xs text-gray-500">Unread</p>
            </div>
          </div>
          {stats.byType?.slice(0, 2).map(t => (
            <div key={t._id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Send size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{t.count}</p>
                <p className="text-xs text-gray-500 capitalize">{t._id}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'general', 'order', 'delivery', 'payment', 'offer', 'product', 'system'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f ? <span className="capitalize">{f}</span> : 'All'}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => (
              <div key={n._id} className="flex items-start gap-4 p-4 hover:bg-gray-50/50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-gray-100' : 'bg-primary-50'}`}>
                  <Bell size={16} className={n.isRead ? 'text-gray-400' : 'text-primary-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${TYPE_BADGE[n.type] || TYPE_BADGE.general}`}>
                      {n.type}
                    </span>
                    {n.priority === 'high' && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600">High</span>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                    {n.user && <span className="text-xs text-gray-400">To: {n.user.name || n.user.email}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(n._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBroadcast(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Megaphone size={18} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Broadcast</h3>
                <p className="text-sm text-gray-500">Push notification to all users</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))}
                  placeholder="e.g. Weekend Sale - 50% Off!"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))}
                  rows={3} placeholder="Write your notification message..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={broadcast.type} onChange={e => setBroadcast(b => ({ ...b, type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                    <option value="general">General</option>
                    <option value="offer">Offer</option>
                    <option value="product">Product</option>
                    <option value="order">Order</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={broadcast.priority} onChange={e => setBroadcast(b => ({ ...b, priority: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBroadcast(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
              <button onClick={handleBroadcast} disabled={sending}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? 'Sending...' : <><Send size={14} /> Send to All Users</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
