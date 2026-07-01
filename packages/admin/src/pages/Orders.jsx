import { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, ChevronLeft, ChevronRight, ChevronDown, Package } from 'lucide-react';

const STATUSES = ['all','pending','confirmed','processing','shipped','delivered','cancelled'];
const STATUS_CLR = {
  pending:'bg-amber-50 text-amber-700', confirmed:'bg-blue-50 text-blue-700',
  processing:'bg-purple-50 text-purple-700', shipped:'bg-cyan-50 text-cyan-700',
  delivered:'bg-emerald-50 text-emerald-700', cancelled:'bg-red-50 text-red-700',
};
const NEXT = { pending:'confirmed', confirmed:'processing', processing:'shipped', shipped:'delivered' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get('/orders').then(r => { if (r.data.success) setOrders(r.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await API.put(`/orders/${id}/status`, { status });
      if (data.success) {
        setOrders(p => p.map(o => o._id === id ? { ...o, status } : o));
        toast.success(`Order marked ${status}`);
      }
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o._id?.toLowerCase().includes(q) || o.user?.name?.toLowerCase().includes(q) || o.user?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {};
  STATUSES.forEach(s => { counts[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length; });

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">{orders.length} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <span className="capitalize">{s}</span>
            <span className={`ml-1.5 text-xs ${filter === s ? 'text-white/70' : 'text-gray-400'}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or customer..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : filtered.map(o => {
          const next = NEXT[o.status];
          const isOpen = expanded === o._id;
          return (
            <div key={o._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded(isOpen ? null : o._id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-gray-800">#{o._id?.slice(-8).toUpperCase()}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${STATUS_CLR[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{o.user?.name || 'Customer'} &middot; {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">Rs. {o.totalPrice?.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">{o.orderItems?.length || 0} items</p>
                  </div>
                  {next && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(o._id, next); }}
                      className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 capitalize whitespace-nowrap">
                      Mark {next}
                    </button>
                  )}
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div><p className="text-gray-400 text-xs">Customer</p><p className="font-medium">{o.user?.name}</p></div>
                    <div><p className="text-gray-400 text-xs">Email</p><p className="font-medium">{o.user?.email}</p></div>
                    <div><p className="text-gray-400 text-xs">Phone</p><p className="font-medium">{o.user?.phone || '-'}</p></div>
                    <div><p className="text-gray-400 text-xs">Address</p><p className="font-medium truncate">{o.shippingAddress?.city || o.shippingAddress?.street || '-'}</p></div>
                  </div>
                  {o.orderItems?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Items</p>
                      {o.orderItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-sm border-b border-gray-100 last:border-0">
                          <span className="text-gray-700">{item.product?.name || item.name || 'Item'} x{item.quantity}</span>
                          <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
