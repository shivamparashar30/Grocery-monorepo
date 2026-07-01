import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'featured', displayOrder: 0 });

  const fetchSections = () => {
    API.get('/home-sections/admin').then(r => { if (r.data.success) setSections(r.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(fetchSections, []);

  const openNew = () => { setEditing(null); setForm({ title: '', type: 'featured', displayOrder: sections.length }); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ title: s.title, type: s.type, displayOrder: s.displayOrder ?? 0 }); setModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    try {
      if (editing) await API.put(`/home-sections/${editing._id}`, form);
      else await API.post('/home-sections', form);
      toast.success(editing ? 'Updated' : 'Created');
      setModal(false); fetchSections();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return;
    try { await API.delete(`/home-sections/${id}`); toast.success('Deleted'); fetchSections(); }
    catch { toast.error('Failed'); }
  };

  const toggleActive = async (s) => {
    try {
      await API.put(`/home-sections/${s._id}/toggle`);
      setSections(prev => prev.map(x => x._id === s._id ? { ...x, isActive: !x.isActive } : x));
      toast.success(s.isActive ? 'Deactivated' : 'Activated');
    } catch { toast.error('Failed'); }
  };

  const moveSection = async (index, direction) => {
    const newSections = [...sections];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    setSections(newSections);
    try {
      await API.put('/home-sections/reorder', { order: newSections.map(s => s._id) });
    } catch { toast.error('Reorder failed'); fetchSections(); }
  };

  const TYPE_LABELS = {
    featured: 'Featured', trending: 'Trending', newArrivals: 'New Arrivals',
    bestSellers: 'Best Sellers', category: 'Category', custom: 'Custom', banner: 'Banner',
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Sections</h1>
          <p className="text-sm text-gray-500">Manage homepage layout and sections</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
          <Plus size={16} /> Add Section
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase w-12">Order</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Products</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s, i) => (
              <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSection(i, -1)} disabled={i === 0}
                      className="p-0.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronUp size={14} /></button>
                    <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1}
                      className="p-0.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronDown size={14} /></button>
                  </div>
                </td>
                <td className="p-4 font-medium text-gray-800">{s.title}</td>
                <td className="p-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-lg bg-primary-50 text-primary-700">
                    {TYPE_LABELS[s.type] || s.type}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{s.products?.length || 0}</td>
                <td className="p-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(s)} className={`p-1.5 rounded-lg ${s.isActive ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-emerald-50 text-emerald-600'}`}
                      title={s.isActive ? 'Deactivate' : 'Activate'}>
                      {s.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sections.length === 0 && <div className="text-center py-12 text-gray-400">No sections created yet</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit Section' : 'New Section'}</h3>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Section title"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} placeholder="Display order"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            <div className="flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
