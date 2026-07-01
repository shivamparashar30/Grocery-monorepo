import { useEffect, useState } from 'react';
import API from '../api/axios';
import { Users, Search, Shield, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    API.get('/auth/users').then(r => { if (r.data.success) setUsers(r.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleBlock = async (user) => {
    try {
      await API.put(`/auth/users/${user._id}/toggle-status`);
      setUsers(p => p.map(u => u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u));
      toast.success(`User ${user.isBlocked ? 'unblocked' : 'blocked'}`);
    } catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    if (filter === 'active' && u.isBlocked) return false;
    if (filter === 'blocked' && !u.isBlocked) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        {['all','active','blocked'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{f}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
          </tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4 font-medium text-gray-800">{u.name}</td>
                <td className="p-4 text-gray-500">{u.email}</td>
                <td className="p-4 text-gray-500">{u.phone || '-'}</td>
                <td className="p-4"><span className={`text-xs font-medium px-2 py-1 rounded-lg ${u.isBlocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{u.isBlocked ? 'Blocked' : 'Active'}</span></td>
                <td className="p-4"><button onClick={() => toggleBlock(u)} className={`p-1.5 rounded-lg ${u.isBlocked ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-red-50 text-red-500'}`}>{u.isBlocked ? <Shield size={14} /> : <ShieldOff size={14} />}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No customers found</div>}
      </div>
    </div>
  );
}
