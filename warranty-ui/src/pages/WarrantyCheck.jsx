import { useState } from 'react';
import { LoaderCircle, Search, AlertCircle, ScanSearch } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';
import { useToast } from '../components/toast-context';

export default function WarrantyCheck() {
  const [searchSerial, setSearchSerial] = useState('');
  const [foundWarranty, setFoundWarranty] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validateSerial = (serial) => {
    const normalized = serial.trim();
    if (!normalized) {
      return 'Serial number is required.';
    }
    if (!/^[A-Za-z0-9-]{6,40}$/.test(normalized)) {
      return 'Use 6-40 letters, numbers, or hyphens.';
    }
    return '';
  };

  const handleSearchWarranty = async (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundWarranty(null);
    setHasSearched(true);
    const nextFieldError = validateSerial(searchSerial);
    setFieldError(nextFieldError);
    if (nextFieldError) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/warranties/serial/${searchSerial}`);
      setFoundWarranty(response.data);
      toast.success('Warranty found.');
    } catch (err) {
      setSearchError(getApiErrorMessage(err, 'No coverage signature found matching that tracking code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in py-6 sm:py-8">
      <div className="grid gap-6">
        <section className="hero-panel soft-grid rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <span className="pill mb-5">
              <ScanSearch className="h-4 w-4 text-amber-700" />
              Fast serial lookup
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Instant Warranty Verification</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              Enter a hardware serial key to reveal coverage status, purchase timing, and protection expiry in a cleaner premium summary card.
            </p>
          </div>

          <form onSubmit={handleSearchWarranty} className="mt-8 premium-card premium-card-strong rounded-[1.75rem] p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="input-leading-icon absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., SN-PS5-987654321"
                  value={searchSerial}
                  onChange={(e) => {
                    setSearchSerial(e.target.value);
                    setFieldError('');
                  }}
                  className="premium-input premium-input-with-icon"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="premium-button premium-button-primary min-w-40 md:self-stretch">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify Coverage'}
              </button>
            </div>
            {fieldError ? <p className="field-error px-1 pt-3">{fieldError}</p> : <p className="field-hint px-1 pt-3">Serial numbers support letters, numbers, and hyphens.</p>}
          </form>

          {searchError && (
            <div className="animate-fade-in mt-5 flex items-center gap-3 rounded-[1.5rem] border border-red-100 bg-red-50/90 p-4 text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{searchError}</p>
            </div>
          )}

          {hasSearched && !loading && !searchError && !foundWarranty ? (
            <div className="animate-fade-in mt-5 premium-card premium-card-strong rounded-[1.5rem] p-5 text-sm text-slate-500">
              No warranty details to show yet. Try another serial number.
            </div>
          ) : null}

          {foundWarranty && (
            <div className="animate-fade-in mt-6 premium-card premium-card-strong card-hover-lift rounded-[2rem] p-6 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="section-label mb-2">Serial code</p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{foundWarranty.serialNumber}</h3>
                  <p className="mt-2 text-sm text-slate-500">Coverage data pulled from the registered product record.</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] ${foundWarranty.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  <span className="status-dot" />
                  {foundWarranty.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="premium-muted rounded-[1.4rem] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Product line</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{foundWarranty.product?.name}</p>
                </div>
                <div className="premium-muted rounded-[1.4rem] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Model code</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{foundWarranty.product?.modelNumber}</p>
                </div>
                <div className="premium-muted rounded-[1.4rem] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Commenced date</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{foundWarranty.purchaseDate}</p>
                </div>
                <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Coverage expiry</p>
                  <p className="mt-2 text-lg font-extrabold text-amber-800">{foundWarranty.expiryDate}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
