import { useEffect, useState } from 'react';
import API from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

const COLORS = ['#6C5CE7', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/home-sections/admin/stats'),
      API.get('/orders'),
      API.get('/products?limit=200'),
    ]).then(([s, o, p]) => {
      if (s.data.success) setStats(s.data.data);
      if (o.data.success) setOrders(o.data.data || []);
      if (p.data.success) setProducts(p.data.products || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  // Compute analytics data
  const ordersByStatus = (stats?.ordersByStatus || []).map(s => ({ name: s._id, value: s.count }));

  // Daily orders (last 14 days)
  const dailyMap = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[key] = { date: key, orders: 0, revenue: 0 };
  }
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyMap[key]) {
      dailyMap[key].orders++;
      dailyMap[key].revenue += o.totalPrice || 0;
    }
  });
  const dailyData = Object.values(dailyMap);

  // Top products by order frequency
  const productFreq = {};
  orders.forEach(o => {
    (o.orderItems || []).forEach(item => {
      const name = item.product?.name || item.name || 'Unknown';
      productFreq[name] = (productFreq[name] || 0) + (item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, qty]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, quantity: qty }));

  // Category distribution
  const catMap = {};
  products.forEach(p => {
    const cat = p.category?.name || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Revenue stats
  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Insights and performance metrics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: DollarSign, label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { icon: TrendingUp, label: "Today's Revenue", value: `Rs. ${todayRevenue.toLocaleString()}`, bg: 'bg-blue-50', color: 'text-blue-600' },
          { icon: ShoppingCart, label: 'Total Orders', value: orders.length, bg: 'bg-primary-50', color: 'text-primary-600' },
          { icon: ShoppingCart, label: 'Avg Order Value', value: `Rs. ${avgOrderValue.toFixed(0)}`, bg: 'bg-amber-50', color: 'text-amber-600' },
          { icon: Package, label: 'Products', value: products.length, bg: 'bg-cyan-50', color: 'text-cyan-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
              <c.icon size={18} className={c.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue & Orders Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Revenue Trend (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="revGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6C5CE7" strokeWidth={2} fill="url(#revGradA)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Daily Orders (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data</div>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Products by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data</div>}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Selling Products</h3>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={140} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#6C5CE7" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No order data yet</div>}
      </div>
    </div>
  );
}
