import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetch = () => {
    API.get('/categories').then(r => { if (r.data.success) setCategories(r.data.data || []); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const openEdit = (c) => { setEditing(c); setName(c.name); setDescription(c.description || ''); setModal(true); };
  const openNew = () => { setEditing(null); setName(''); setDescription(''); setModal(true); };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name required');
    try {
      if (editing) await API.put(`/categories/${editing._id}`, { name, description });
      else await API.post('/categories', { name, description });
      toast.success(editing ? 'Updated' : 'Created');
      setModal(false); fetch();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await API.delete(`/categories/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"><Plus size={16} /> Add Category</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{c.name}</p>
              <p className="text-xs text-gray-400">{c.description || 'No description'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600"><Edit size={14} /></button>
              <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit Category' : 'New Category'}</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
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
