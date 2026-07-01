import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import API, { BASE } from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Upload, X, GripVertical, Save, Loader2, Image as ImageIcon, Trash2, Star,
} from 'lucide-react';

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-10 h-5.5 rounded-full transition-colors relative ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        style={{ width: 18, height: 18, top: 2 }}
      />
    </button>
  </label>
);

const Field = ({ label, required, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400';

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = id && id !== 'new';
  const [loading, setLoading] = useState(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: '', description: '', brand: '', category: '', subcategory: '',
    price: '', discountPrice: '', discountPercentage: '',
    unit: 'pcs', weight: '', packSize: '',
    minOrderQty: '1', maxOrderQty: '50',
    stock: '100', sku: '', barcode: '', hsnCode: '', productKey: '',
    expiryDate: '', manufacturingDate: '',
    isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: false,
    isActive: true, isReturnable: false, isCODAvailable: true, isOutOfStock: false,
  });

  const [existingImages, setExistingImages] = useState([]); // { url, filename, order }
  const [newFiles, setNewFiles] = useState([]); // File objects with preview
  const [deleteImages, setDeleteImages] = useState([]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    API.get('/categories').then(r => { if (r.data.success) setCategories(r.data.data); });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    API.get(`/products/id/${id}`)
      .then(r => {
        if (!r.data.success) { toast.error('Product not found'); nav('/products'); return; }
        const p = r.data.data;
        setForm({
          name: p.name || '', description: p.description || '', brand: p.brand || '',
          category: p.categoryId || p.category || '', subcategory: p.subcategory || '',
          price: p.price?.toString() || '', discountPrice: p.discountPrice?.toString() || '',
          discountPercentage: p.discountPercentage?.toString() || '',
          unit: p.unit || 'pcs', weight: p.weight || '', packSize: p.packSize || '',
          minOrderQty: p.minOrderQty?.toString() || '1', maxOrderQty: p.maxOrderQty?.toString() || '50',
          stock: p.stock?.toString() || '0', sku: p.sku || '', barcode: p.barcode || '',
          hsnCode: p.hsnCode || '', productKey: p.productKey || '',
          expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : '',
          manufacturingDate: p.manufacturingDate ? p.manufacturingDate.slice(0, 10) : '',
          isFeatured: !!p.isFeatured, isTrending: !!p.isTrending, isBestSeller: !!p.isBestSeller,
          isNewArrival: !!p.isNewArrival, isActive: p.isActive !== false,
          isReturnable: !!p.isReturnable, isCODAvailable: p.isCODAvailable !== false,
          isOutOfStock: !!p.isOutOfStock,
        });
        setExistingImages((p.images || []).sort((a, b) => a.order - b.order));
      })
      .catch(() => { toast.error('Failed to load product'); nav('/products'); })
      .finally(() => setLoading(false));
  }, [id]);

  const onDrop = useCallback((accepted) => {
    const withPreview = accepted.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }));
    setNewFiles(prev => [...prev, ...withPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: 10, maxSize: 5 * 1024 * 1024,
  });

  const removeNewFile = (idx) => {
    setNewFiles(p => { URL.revokeObjectURL(p[idx].preview); return p.filter((_, i) => i !== idx); });
  };

  const removeExistingImage = (img) => {
    setDeleteImages(p => [...p, img.filename || img.url]);
    setExistingImages(p => p.filter(i => i !== img));
  };

  // ── Drag-and-drop reordering ──
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    e.currentTarget.style.opacity = '0.4';
  };
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };
  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    const fromIdx = dragIdx;
    setDragIdx(null);
    setDragOverIdx(null);
    if (fromIdx === null || fromIdx === toIdx) return;

    const totalExisting = existingImages.length;

    if (fromIdx < totalExisting && toIdx < totalExisting) {
      const arr = [...existingImages];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      setExistingImages(arr);
    } else if (fromIdx >= totalExisting && toIdx >= totalExisting) {
      const arr = [...newFiles];
      const [moved] = arr.splice(fromIdx - totalExisting, 1);
      arr.splice(toIdx - totalExisting, 0, moved);
      setNewFiles(arr);
    }
  };

  const setPrimaryImage = (idx) => {
    if (idx <= 0 || idx >= existingImages.length) return;
    const arr = [...existingImages];
    const [moved] = arr.splice(idx, 1);
    arr.unshift(moved);
    setExistingImages(arr);
    toast.success('Primary image updated');
  };

  const moveImage = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    const all = [...existingImages];
    const allNew = [...newFiles];
    const totalExisting = all.length;
    const totalAll = totalExisting + allNew.length;
    if (toIdx < 0 || toIdx >= totalAll) return;
    if (fromIdx < totalExisting && toIdx < totalExisting) {
      [all[fromIdx], all[toIdx]] = [all[toIdx], all[fromIdx]];
      setExistingImages(all);
    } else if (fromIdx >= totalExisting && toIdx >= totalExisting) {
      const fi = fromIdx - totalExisting;
      const ti = toIdx - totalExisting;
      [allNew[fi], allNew[ti]] = [allNew[ti], allNew[fi]];
      setNewFiles(allNew);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.unit || !form.category) {
      toast.error('Fill required fields: name, price, unit, category');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      newFiles.forEach(f => fd.append('images', f));
      if (deleteImages.length) fd.append('deleteImages', JSON.stringify(deleteImages));

      // Send image order
      const orderedUrls = existingImages.map(i => i.url || i.filename);
      if (orderedUrls.length) fd.append('imageOrder', JSON.stringify(orderedUrls));

      if (isEdit) {
        await API.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        await API.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created');
      }
      nav('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  const allImages = [
    ...existingImages.map((img, i) => ({ type: 'existing', img, key: `e-${i}` })),
    ...newFiles.map((f, i) => ({ type: 'new', file: f, key: `n-${i}` })),
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => nav('/products')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Basic Information</h3>
            <Field label="Product Name" required>
              <input value={form.name} onChange={e => update('name', e.target.value)} className={inputCls} placeholder="e.g. Amul Butter 500g" />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} className={inputCls} placeholder="Product description..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand">
                <input value={form.brand} onChange={e => update('brand', e.target.value)} className={inputCls} placeholder="e.g. Amul" />
              </Field>
              <Field label="Subcategory">
                <input value={form.subcategory} onChange={e => update('subcategory', e.target.value)} className={inputCls} placeholder="e.g. Butter & Cheese" />
              </Field>
            </div>
            <Field label="Category" required>
              <select value={form.category} onChange={e => update('category', e.target.value)} className={inputCls}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Product Images</h3>
            <p className="text-xs text-gray-400 mb-4">Drag to reorder. First image is the Primary shown on product cards, search, and cart.</p>
            {allImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {allImages.map(({ type, img, file, key }, idx) => {
                  const src = type === 'existing' ? (img.url.startsWith('/') ? `${BASE}${img.url}` : img.url) : file.preview;
                  const isPrimary = idx === 0;
                  const isDragOver = dragOverIdx === idx;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={() => setDragOverIdx(null)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-50 cursor-grab active:cursor-grabbing transition-all duration-150 border-2 ${
                        isDragOver ? 'border-primary-400 ring-2 ring-primary-200 scale-[1.03]' : 'border-gray-200'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
                      {/* Primary badge */}
                      {isPrimary && (
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                          <Star size={8} fill="white" strokeWidth={0} /> Primary
                        </span>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                      {/* Action buttons */}
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isPrimary && type === 'existing' && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPrimaryImage(idx); }}
                            className="w-6 h-6 bg-yellow-400 text-white rounded-full flex items-center justify-center shadow hover:bg-yellow-500"
                            title="Set as Primary">
                            <Star size={11} fill="white" strokeWidth={0} />
                          </button>
                        )}
                        {idx > 0 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(idx, -1); }}
                            className="w-6 h-6 bg-white/90 text-gray-700 rounded-full flex items-center justify-center shadow text-xs font-bold hover:bg-white"
                            title="Move left">&#8592;</button>
                        )}
                        {idx < allImages.length - 1 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(idx, 1); }}
                            className="w-6 h-6 bg-white/90 text-gray-700 rounded-full flex items-center justify-center shadow text-xs font-bold hover:bg-white"
                            title="Move right">&#8594;</button>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); type === 'existing' ? removeExistingImage(img) : removeNewFile(newFiles.indexOf(file)); }}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600">
                          <X size={12} />
                        </button>
                      </div>
                      {/* Drag grip indicator */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
                        <GripVertical size={14} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input {...getInputProps()} />
              <Upload size={28} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Drop images here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB each. Max 10 images.</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Price (Rs.)" required>
                <input type="number" value={form.price} onChange={e => update('price', e.target.value)} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Discount Price">
                <input type="number" value={form.discountPrice} onChange={e => update('discountPrice', e.target.value)} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Discount %">
                <input type="number" value={form.discountPercentage} onChange={e => update('discountPercentage', e.target.value)} className={inputCls} placeholder="0" />
              </Field>
            </div>
          </div>

          {/* Units & Stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Units & Inventory</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Unit" required>
                <select value={form.unit} onChange={e => update('unit', e.target.value)} className={inputCls}>
                  {['kg','g','500g','250g','L','500ml','250ml','pcs','pack','dozen','box','bottle','can','pouch'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </Field>
              <Field label="Weight">
                <input value={form.weight} onChange={e => update('weight', e.target.value)} className={inputCls} placeholder="e.g. 500g" />
              </Field>
              <Field label="Pack Size">
                <input value={form.packSize} onChange={e => update('packSize', e.target.value)} className={inputCls} placeholder="e.g. 6 pcs" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Stock">
                <input type="number" value={form.stock} onChange={e => update('stock', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Min Order Qty">
                <input type="number" value={form.minOrderQty} onChange={e => update('minOrderQty', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Max Order Qty">
                <input type="number" value={form.maxOrderQty} onChange={e => update('maxOrderQty', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Identifiers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Identifiers</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="SKU"><input value={form.sku} onChange={e => update('sku', e.target.value)} className={inputCls} /></Field>
              <Field label="Barcode"><input value={form.barcode} onChange={e => update('barcode', e.target.value)} className={inputCls} /></Field>
              <Field label="HSN Code"><input value={form.hsnCode} onChange={e => update('hsnCode', e.target.value)} className={inputCls} /></Field>
              <Field label="Product Key"><input value={form.productKey} onChange={e => update('productKey', e.target.value)} className={inputCls} placeholder="e.g. v1" /></Field>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Manufacturing Date"><input type="date" value={form.manufacturingDate} onChange={e => update('manufacturingDate', e.target.value)} className={inputCls} /></Field>
              <Field label="Expiry Date"><input type="date" value={form.expiryDate} onChange={e => update('expiryDate', e.target.value)} className={inputCls} /></Field>
            </div>
          </div>
        </div>

        {/* Right column - Status & Toggles */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Status</h3>
            <div className="divide-y divide-gray-100">
              <Toggle label="Active" checked={form.isActive} onChange={v => update('isActive', v)} />
              <Toggle label="Out of Stock" checked={form.isOutOfStock} onChange={v => update('isOutOfStock', v)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Badges</h3>
            <div className="divide-y divide-gray-100">
              <Toggle label="Featured" checked={form.isFeatured} onChange={v => update('isFeatured', v)} />
              <Toggle label="Trending" checked={form.isTrending} onChange={v => update('isTrending', v)} />
              <Toggle label="Best Seller" checked={form.isBestSeller} onChange={v => update('isBestSeller', v)} />
              <Toggle label="New Arrival" checked={form.isNewArrival} onChange={v => update('isNewArrival', v)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Options</h3>
            <div className="divide-y divide-gray-100">
              <Toggle label="Returnable" checked={form.isReturnable} onChange={v => update('isReturnable', v)} />
              <Toggle label="COD Available" checked={form.isCODAvailable} onChange={v => update('isCODAvailable', v)} />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
