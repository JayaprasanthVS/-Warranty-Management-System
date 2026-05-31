import { useState, useEffect } from 'react';
import { LoaderCircle, PlusCircle, Package, Layers3, Sparkles } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';
import { useToast } from '../components/toast-context';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', modelNumber: '', description: '', warrantyMonths: 12 });
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const toast = useToast();

  const fetchProducts = async (query = '') => {
    setLoadingProducts(true);
    setCatalogError('');
    try {
      const res = await api.get('/products', {
        params: {
          query: query || undefined,
        },
      });
      setProducts(res.data);
    } catch (err) {
      setCatalogError(getApiErrorMessage(err, 'Unable to load products right now.'));
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const res = await api.get('/products', {
          params: {
            query: searchQuery || undefined,
          },
        });
        if (!ignore) {
          setProducts(res.data);
        }
      } catch (err) {
        if (!ignore) {
          setCatalogError(getApiErrorMessage(err, 'Unable to load products right now.'));
        }
      } finally {
        if (!ignore) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [searchQuery]);

  const validateForm = () => {
    const nextErrors = {};
    if (!newProduct.name.trim()) {
      nextErrors.name = 'Product name is required.';
    }
    if (!newProduct.modelNumber.trim()) {
      nextErrors.modelNumber = 'Model number is required.';
    } else if (!/^[A-Za-z0-9-]{3,40}$/.test(newProduct.modelNumber.trim())) {
      nextErrors.modelNumber = 'Use 3-40 letters, numbers, or hyphens.';
    }
    if (!newProduct.warrantyMonths || Number(newProduct.warrantyMonths) < 1) {
      nextErrors.warrantyMonths = 'Warranty months must be at least 1.';
    }
    if (newProduct.description && newProduct.description.length > 1000) {
      nextErrors.description = 'Description cannot exceed 1000 characters.';
    }
    return nextErrors;
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const nextErrors = validateForm();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSavingProduct(true);
    try {
      await api.post('/products', { ...newProduct, warrantyMonths: Number(newProduct.warrantyMonths) });
      setNewProduct({ name: '', modelNumber: '', description: '', warrantyMonths: 12 });
      toast.success('Product added successfully.');
      fetchProducts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to save product.'));
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="animate-fade-in py-6 sm:py-8">
      <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="hero-panel soft-grid rounded-[2rem] p-6 sm:p-8">
          <span className="pill mb-5">
            <Sparkles className="h-4 w-4 text-amber-700" />
            Premium catalog console
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Manage product records with a cleaner executive layout.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            Catalog management now feels more curated, with calmer surfaces, wider spacing, and richer model cards that help administrators scan inventory faster.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="premium-card metric-card rounded-[1.75rem] p-6">
            <Layers3 className="mb-4 h-6 w-6 text-amber-700" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Catalog volume</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">{products.length}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Active product templates available for registration and warranty coverage.</p>
          </div>
          <div className="premium-card rounded-[1.75rem] p-6">
            <Package className="mb-4 h-6 w-6 text-teal-700" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Interface balance</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Cleaner card spacing and softer highlights keep the catalog elegant without visual overload.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-card premium-card-strong h-fit rounded-[2rem] p-6 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <PlusCircle className="h-5 w-5 text-amber-700" /> Register Product Type
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Create a new model profile with warranty duration and supporting specifications.</p>

          <form onSubmit={handleCreateProduct} className="mt-6 space-y-5 text-sm">
            <div>
              <label className="mb-2 block font-medium text-slate-700">Product Generic Name</label>
              <input
                type="text"
                required
                className="premium-input"
                value={newProduct.name}
                onChange={(e) => {
                  setNewProduct({ ...newProduct, name: e.target.value });
                  setFieldErrors((current) => ({ ...current, name: '' }));
                }}
              />
              {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
            </div>
            <div>
              <label className="mb-2 block font-medium text-slate-700">Model Code Identifier</label>
              <input
                type="text"
                required
                className="premium-input"
                value={newProduct.modelNumber}
                onChange={(e) => {
                  setNewProduct({ ...newProduct, modelNumber: e.target.value });
                  setFieldErrors((current) => ({ ...current, modelNumber: '' }));
                }}
              />
              {fieldErrors.modelNumber ? <p className="field-error">{fieldErrors.modelNumber}</p> : null}
            </div>
            <div>
              <label className="mb-2 block font-medium text-slate-700">Warranty Lifespan (Months)</label>
              <input
                type="number"
                required
                className="premium-input"
                value={newProduct.warrantyMonths}
                onChange={(e) => {
                  setNewProduct({ ...newProduct, warrantyMonths: e.target.value });
                  setFieldErrors((current) => ({ ...current, warrantyMonths: '' }));
                }}
              />
              {fieldErrors.warrantyMonths ? <p className="field-error">{fieldErrors.warrantyMonths}</p> : null}
            </div>
            <div>
              <label className="mb-2 block font-medium text-slate-700">Technical Specifications</label>
              <textarea
                className="premium-textarea"
                value={newProduct.description}
                onChange={(e) => {
                  setNewProduct({ ...newProduct, description: e.target.value });
                  setFieldErrors((current) => ({ ...current, description: '' }));
                }}
              />
              {fieldErrors.description ? <p className="field-error">{fieldErrors.description}</p> : <p className="field-hint">Optional. Keep it concise and product-specific.</p>}
            </div>
            <button type="submit" disabled={savingProduct} className="premium-button premium-button-primary w-full">
              {savingProduct ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {savingProduct ? 'Saving Product...' : 'Save Asset Data'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Package className="h-5 w-5 text-amber-700" /> Active System Catalog ({products.length})
            </h2>
            <input
              type="text"
              className="premium-input sm:max-w-72"
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {loadingProducts ? (
            <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-slate-500">Loading catalog...</div>
          ) : null}
          {!loadingProducts && catalogError ? (
            <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-red-600">{catalogError}</div>
          ) : null}
          {!loadingProducts && !catalogError && products.length === 0 ? (
            <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-slate-500">No products yet. Add your first product model to start building the catalog.</div>
          ) : null}
          {!loadingProducts && !catalogError && products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((p) => (
                <div key={p.id} className="premium-card premium-card-strong card-hover-lift flex flex-col justify-between rounded-[1.65rem] p-5 min-h-64">
                  <div>
                    <div className="mb-3 flex justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                      <span className="h-fit rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                        {p.modelNumber}
                      </span>
                    </div>
                    <p className="mb-5 text-sm leading-6 text-slate-500">{p.description || 'No description provided.'}</p>
                  </div>
                  <div className="rounded-[1.15rem] bg-stone-50 px-4 py-3 text-sm text-slate-500">
                    Standard Protection: <span className="font-semibold text-slate-800">{p.warrantyMonths} Months</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
