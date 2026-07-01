import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Warehouse, AlertTriangle, PackageX, Package, Clock, Plus, Minus, RotateCcw, Search } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

export default function Inventory() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stockModal, setStockModal] = useState(null); // product
  const [stockAction, setStockAction] = useState('increase');
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/products/inventory/stats'),
      API.get('/products?limit=200&sort=stock_asc'),
    ]).then(([s, p]) => {
      if (s.data.success) setStats(s.data.data);
      if (p.data.success) setProducts(p.data.products || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    if (filter === 'outofstock' && p.stock > 0 && !p.isOutOfStock) return false;
    if (filter === 'lowstock' && (p.stock > 10 || p.stock === 0)) return false;
    if (filter === 'instock' && (p.stock <= 0 || p.isOutOfStock)) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleStockUpdate = async () => {
    if (!stockQty || !stockModal) return;
    setUpdating(true);
    try {
      const { data } = await API.post(`/products/${stockModal._id}/stock`, {
        action: stockAction, quantity: parseInt(stockQty), reason: stockReason,
      });
      if (data.success) {
        toast.success(`Stock updated: ${data.data.previousStock} -> ${data.data.stock}`);
        setProducts(prev => prev.map(p => p._id === stockModal._id ? { ...p, stock: data.data.stock } : p));
        setStockModal(null);
        setStockQty(''); setStockReason('');
      }
    } catch { toast.error('Failed to update stock'); }
    finally { setUpdating(false); }
  };

  const viewHistory = async (productId) => {
    try {
      const { data } = await API.get(`/products/${productId}/stock-history`);
      if (data.success) { setHistory(data.data); setShowHistory(productId); }
    } catch { toast.error('Failed to load history'); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">Manage stock levels and track movements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Package} label="Total Products" value={stats?.total || 0} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon={PackageX} label="Out of Stock" value={stats?.outOfStock || 0} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats?.lowStock || 0} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Clock} label="Expiring Soon" value={stats?.expiringSoon || 0} color="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={AlertTriangle} label="Expired" value={stats?.expired || 0} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        {['all','outofstock','lowstock','instock'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'outofstock' ? 'Out of Stock' : f === 'lowstock' ? 'Low Stock' : f === 'instock' ? 'In Stock' : 'All'}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Expiry</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const isOut = p.stock === 0 || p.isOutOfStock;
              const isLow = !isOut && p.stock <= 10;
              return (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-800">{p.name}</td>
                  <td className="p-4 text-gray-500">{p.sku || p.productKey || '-'}</td>
                  <td className="p-4">
                    <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'}`}>{p.stock}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {isOut ? 'Out of Stock' : isLow ? 'Low' : 'In Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setStockModal(p); setStockAction('increase'); }} className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600" title="Add Stock">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => { setStockModal(p); setStockAction('decrease'); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Reduce Stock">
                        <Minus size={14} />
                      </button>
                      <button onClick={() => viewHistory(p._id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600" title="History">
                        <Clock size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No products found</div>}
      </div>

      {/* Stock update modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setStockModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{stockAction === 'increase' ? 'Add Stock' : stockAction === 'decrease' ? 'Reduce Stock' : 'Set Stock'}</h3>
            <p className="text-sm text-gray-500 mb-4">{stockModal.name} (Current: {stockModal.stock})</p>
            <div className="flex gap-2 mb-4">
              {['increase','decrease','set'].map(a => (
                <button key={a} onClick={() => setStockAction(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${stockAction === a ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{a}</button>
              ))}
            </div>
            <input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="Quantity"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            <input value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="Reason (optional)"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            <div className="flex gap-3">
              <button onClick={() => setStockModal(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
              <button onClick={handleStockUpdate} disabled={updating || !stockQty} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowHistory(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Stock History</h3>
            {history.length === 0 ? <p className="text-gray-400 text-sm">No history yet</p> : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.action === 'increase' ? 'bg-emerald-50' : h.action === 'decrease' ? 'bg-red-50' : 'bg-blue-50'}`}>
                      {h.action === 'increase' ? <Plus size={14} className="text-emerald-600" /> : h.action === 'decrease' ? <Minus size={14} className="text-red-600" /> : <RotateCcw size={14} className="text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{h.action} <span className="text-gray-500">by {h.quantity}</span></p>
                      <p className="text-xs text-gray-400">{h.previousStock} {"→"} {h.newStock} {h.reason && `| ${h.reason}`}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowHistory(null)} className="w-full mt-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}

      {/* Recent logs */}
      {stats?.recentLogs?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Stock Movements</h3>
          <div className="space-y-2">
            {stats.recentLogs.slice(0, 10).map(l => (
              <div key={l._id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{l.product?.name || 'Product'}</span>
                <span className={`font-medium ${l.action === 'increase' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {l.action === 'increase' ? '+' : '-'}{l.quantity}
                </span>
                <span className="text-gray-400 text-xs">{new Date(l.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
