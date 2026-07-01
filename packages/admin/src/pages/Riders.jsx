import { useEffect, useState } from 'react';
import API from '../api/axios';
import { Truck, Search, Shield, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Riders() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/auth/drivers').then(r => { if (r.data.success) setDrivers(r.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleBlock = async (d) => {
    try {
      await API.put(`/auth/drivers/${d._id}/toggle-block`);
      setDrivers(p => p.map(x => x._id === d._id ? { ...x, isBlocked: !x.isBlocked } : x));
      toast.success(`Rider ${d.isBlocked ? 'unblocked' : 'blocked'}`);
    } catch { toast.error('Failed'); }
  };

  const filtered = drivers.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search riders..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
          </tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4 font-medium text-gray-800">{d.name}</td>
                <td className="p-4 text-gray-500">{d.email}</td>
                <td className="p-4 text-gray-500">{d.phone || '-'}</td>
                <td className="p-4 text-gray-500 capitalize">{d.vehicleType || '-'} {d.vehicleNumber ? `(${d.vehicleNumber})` : ''}</td>
                <td className="p-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${d.isBlocked ? 'bg-red-50 text-red-600' : d.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.isBlocked ? 'Blocked' : d.isAvailable ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="p-4"><button onClick={() => toggleBlock(d)} className={`p-1.5 rounded-lg ${d.isBlocked ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-red-50 text-red-500'}`}>{d.isBlocked ? <Shield size={14} /> : <ShieldOff size={14} />}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No riders found</div>}
      </div>
    </div>
  );
}
