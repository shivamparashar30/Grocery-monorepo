import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { BASE } from '../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Trash2, Package, ChevronLeft, ChevronRight,
  MoreHorizontal, Copy, Eye, Edit, Power, PowerOff, Download, Upload,
  CheckSquare, Square, X,
} from 'lucide-react';

const STATUS_BADGE = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  outofstock: 'bg-red-50 text-red-600',
  lowstock: 'bg-amber-50 text-amber-600',
};

export default function Products() {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState([]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const limit = 15;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort };
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await API.get('/products', { params });
      if (data.success) {
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, catFilter, statusFilter, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    API.get('/categories').then(r => {
      if (r.data.success) setCategories(r.data.data);
    });
  }, []);

  const toggleSelect = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };
  const selectAll = () => {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map(p => p._id));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDuplicate = async (id) => {
    try {
      await API.post(`/products/${id}/duplicate`);
      toast.success('Product duplicated');
      fetchProducts();
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleBulk = async () => {
    if (!selected.length || !bulkAction) return;
    try {
      await API.post('/products/bulk-action', { ids: selected, action: bulkAction, value: bulkValue });
      toast.success(`${bulkAction} applied to ${selected.length} products`);
      setSelected([]);
      setShowBulk(false);
      setBulkAction('');
      setBulkValue('');
      fetchProducts();
    } catch { toast.error('Bulk action failed'); }
  };

  const getProductStatus = (p) => {
    if (!p.isActive) return 'inactive';
    if (p.stock === 0 || p.isOutOfStock) return 'outofstock';
    if (p.stock <= 10) return 'lowstock';
    return 'active';
  };

  const imgSrc = (p) => {
    const url = p.images?.[0]?.url || p.imageUrl;
    if (!url) return null;
    return url.startsWith('/') ? `${BASE}${url}` : url;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{total} products total</p>
        </div>
        <button onClick={() => nav('/products/new')} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, SKU, barcode..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="outofstock">Out of Stock</option>
            <option value="lowstock">Low Stock</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="price_asc">Price Low-High</option>
            <option value="price_desc">Price High-Low</option>
            <option value="stock_asc">Stock Low-High</option>
          </select>
        </div>

        {/* Bulk actions bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-primary-600">{selected.length} selected</span>
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="">Choose action...</option>
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
              <option value="delete">Delete</option>
              <option value="updateStock">Set Stock</option>
              <option value="updatePrice">Set Price</option>
              <option value="updateDiscount">Set Discount %</option>
            </select>
            {['updateStock', 'updatePrice', 'updateDiscount'].includes(bulkAction) && (
              <input type="number" value={bulkValue} onChange={e => setBulkValue(e.target.value)} placeholder="Value" className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            )}
            <button onClick={handleBulk} disabled={!bulkAction} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-40">Apply</button>
            <button onClick={() => setSelected([])} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="p-4 w-10">
                  <button onClick={selectAll} className="text-gray-400 hover:text-primary-600">
                    {selected.length === products.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Created</th>
                <th className="p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const status = getProductStatus(p);
                const img = imgSrc(p);
                return (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <button onClick={() => toggleSelect(p._id)} className="text-gray-400 hover:text-primary-600">
                        {selected.includes(p._id) ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-3 text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku || p.productKey || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{p.category || '-'}</td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">Rs. {p.price}</p>
                      {p.discountPrice && <p className="text-xs text-emerald-600">Sale: Rs. {p.discountPrice}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-gray-800'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${STATUS_BADGE[status]}`}>
                        {status === 'outofstock' ? 'Out of Stock' : status === 'lowstock' ? 'Low Stock' : status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => nav(`/products/${p._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDuplicate(p._id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Duplicate">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages} ({total} products)</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > pages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-lg text-sm font-medium ${pg === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
