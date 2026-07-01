import { useEffect, useState } from 'react';
import API from '../api/axios';
import {
  DollarSign, ShoppingCart, Package, Users, Truck, TrendingUp,
  AlertTriangle, PackageX, ArrowUpRight, ArrowDownRight, Plus,
  Tags, Megaphone, FileText, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';

const PIE_COLORS = ['#6C5CE7', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4'];

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/home-sections/admin/stats'),
      API.get('/products?limit=5&sort=stock_asc'),
      API.get('/orders'),
    ])
      .then(([s, p, o]) => {
        if (s.data.success) setStats(s.data.data);
        if (p.data.success) setProducts(p.data.products || []);
        if (o.data.success) setOrders(o.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const todaySales = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + (o.totalPrice || 0), 0);

  const ordersByStatus = stats?.ordersByStatus || [];
  const pieData = ordersByStatus.map(s => ({ name: s._id, value: s.count }));

  const lowStockProducts = products.filter(p => p.stock <= 10);

  // Mock monthly data from orders
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const monthlyData = months.map((m, i) => ({
    month: m,
    revenue: Math.round((stats?.revenue || 10000) / 6 * (0.5 + Math.random())),
    orders: Math.round((orders.length || 20) / 6 * (0.5 + Math.random())),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's your store overview.</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Add Product', icon: Plus, to: '/products/new' },
            { label: 'View Orders', icon: ShoppingCart, to: '/orders' },
          ].map(a => (
            <a key={a.to} href={a.to} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              <a.icon size={15} /> {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`Rs. ${(stats?.revenue || 0).toLocaleString()}`} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={TrendingUp} label="Today's Sales" value={`Rs. ${todaySales.toLocaleString()}`} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.orderCount || orders.length} sub={`${pendingOrders} pending`} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon={Package} label="Products" value={stats?.productCount || 0} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Users} label="Customers" value={stats?.userCount || 0} color="text-cyan-600" bg="bg-cyan-50" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Pending" value={pendingOrders} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Truck} label="Delivered" value={deliveredOrders} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={PackageX} label="Cancelled" value={cancelledOrders} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats?.lowStockProducts?.length || 0} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6C5CE7" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No order data</div>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Recent Orders</h3>
            <a href="/orders" className="text-xs text-primary-600 font-medium hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => {
              const statusColors = {
                pending: 'bg-amber-50 text-amber-700',
                confirmed: 'bg-blue-50 text-blue-700',
                processing: 'bg-purple-50 text-purple-700',
                shipped: 'bg-cyan-50 text-cyan-700',
                delivered: 'bg-emerald-50 text-emerald-700',
                cancelled: 'bg-red-50 text-red-700',
              };
              return (
                <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">#{o._id?.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{o.user?.name || 'Customer'}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg capitalize ${statusColors[o.status] || 'bg-gray-50 text-gray-600'}`}>
                      {o.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">Rs. {o.totalPrice?.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Low Stock Alerts</h3>
            <a href="/inventory" className="text-xs text-primary-600 font-medium hover:underline">Manage</a>
          </div>
          <div className="space-y-3">
            {(stats?.lowStockProducts || lowStockProducts).slice(0, 6).map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.productKey || p.sku || '-'}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {p.stock === 0 ? 'Out' : p.stock + ' left'}
                </span>
              </div>
            ))}
            {(!stats?.lowStockProducts?.length && !lowStockProducts.length) && (
              <p className="text-sm text-gray-400 text-center py-4">All products in stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
