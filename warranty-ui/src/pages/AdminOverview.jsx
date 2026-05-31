import { useEffect, useState } from 'react';
import { BarChart3, LoaderCircle, Search, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';

export default function AdminOverview({ user }) {
  const [overview, setOverview] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    modelNumber: '',
    userEmail: '',
    claimStatus: '',
    serialNumber: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadOverview = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewResponse, warrantiesResponse, claimsResponse] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/warranties', {
            params: {
              status: filters.status || undefined,
              modelNumber: filters.modelNumber || undefined,
              userEmail: filters.userEmail || undefined,
            },
          }),
          api.get('/claims', {
            params: {
              status: filters.claimStatus || undefined,
              serialNumber: filters.serialNumber || undefined,
              userEmail: filters.userEmail || undefined,
            },
          }),
        ]);

        if (!ignore) {
          setOverview(overviewResponse.data);
          setWarranties(warrantiesResponse.data);
          setClaims(claimsResponse.data);
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, 'Unable to load operational analytics right now.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      ignore = true;
    };
  }, [filters, user.role]);

  return (
    <div className="animate-fade-in space-y-6 py-6 sm:py-8">
      <section className="hero-panel soft-grid rounded-[2rem] p-6 sm:p-8">
        <span className="pill mb-5">
          <BarChart3 className="h-4 w-4 text-amber-700" />
          Operations overview
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Track products, warranties, and claims from one executive dashboard.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
          This view is available to admin and support users for live operational visibility, searchable records, and faster triage.
        </p>
      </section>

      {error ? <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-red-600">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard label="Products" value={overview?.totalProducts} loading={loading} />
        <OverviewCard label="Total Warranties" value={overview?.totalWarranties} loading={loading} />
        <OverviewCard label="Active Warranties" value={overview?.activeWarranties} loading={loading} accent="emerald" />
        <OverviewCard label="Expiring Soon" value={overview?.expiringSoon} loading={loading} accent="rose" />
        <OverviewCard label="Total Claims" value={overview?.totalClaims} loading={loading} />
        <OverviewCard label="Requested" value={overview?.requestedClaims} loading={loading} accent="sky" />
        <OverviewCard label="Under Review" value={overview?.underReviewClaims} loading={loading} accent="violet" />
        <OverviewCard label="Closed Claims" value={overview?.closedClaims} loading={loading} accent="slate" />
      </section>

      <section className="premium-card premium-card-strong rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Search className="h-5 w-5 text-amber-700" />
          Search and Filters
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            className="premium-input"
            placeholder="User email"
            value={filters.userEmail}
            onChange={(e) => setFilters((current) => ({ ...current, userEmail: e.target.value }))}
          />
          <input
            type="text"
            className="premium-input"
            placeholder="Model number"
            value={filters.modelNumber}
            onChange={(e) => setFilters((current) => ({ ...current, modelNumber: e.target.value }))}
          />
          <select
            className="premium-select"
            value={filters.status}
            onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
          >
            <option value="">All warranty statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CLAIMED">CLAIMED</option>
          </select>
          <input
            type="text"
            className="premium-input"
            placeholder="Claim serial"
            value={filters.serialNumber}
            onChange={(e) => setFilters((current) => ({ ...current, serialNumber: e.target.value }))}
          />
          <select
            className="premium-select"
            value={filters.claimStatus}
            onChange={(e) => setFilters((current) => ({ ...current, claimStatus: e.target.value }))}
          >
            <option value="">All claim statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="premium-card premium-card-strong rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-amber-700" />
            Matching Warranties ({warranties.length})
          </div>
          <div className="mt-5 space-y-3">
            {loading ? <LoadingRow /> : null}
            {!loading && warranties.length === 0 ? <EmptyRow text="No warranties match the current filters." /> : null}
            {!loading &&
              warranties.slice(0, 8).map((warranty) => (
                <div key={warranty.id} className="rounded-[1.2rem] border border-stone-200 bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{warranty.serialNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {warranty.user?.email}  {warranty.product?.modelNumber}
                      </p>
                    </div>
                    <MiniBadge label={warranty.status} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="premium-card premium-card-strong rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <BarChart3 className="h-5 w-5 text-amber-700" />
            Matching Claims ({claims.length})
          </div>
          <div className="mt-5 space-y-3">
            {loading ? <LoadingRow /> : null}
            {!loading && claims.length === 0 ? <EmptyRow text="No claims match the current filters." /> : null}
            {!loading &&
              claims.slice(0, 8).map((claim) => (
                <div key={claim.id} className="rounded-[1.2rem] border border-stone-200 bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{claim.issueTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {claim.user?.email}  {claim.warranty?.serialNumber}
                      </p>
                    </div>
                    <MiniBadge label={claim.status} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OverviewCard({ label, value, loading, accent = 'amber' }) {
  const accentClass = {
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    slate: 'text-slate-700',
    sky: 'text-sky-700',
    violet: 'text-violet-700',
  }[accent];

  return (
    <div className="premium-card metric-card rounded-[1.75rem] p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-3 text-4xl font-extrabold tracking-tight ${accentClass || 'text-slate-900'}`}>{loading ? '...' : value ?? 0}</p>
    </div>
  );
}

function MiniBadge({ label }) {
  return <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700">{label}</span>;
}

function EmptyRow({ text }) {
  return <div className="rounded-[1.2rem] border border-stone-200 bg-white/60 p-4 text-sm text-slate-500">{text}</div>;
}

function LoadingRow() {
  return (
    <div className="rounded-[1.2rem] border border-stone-200 bg-white/60 p-4 text-sm text-slate-500">
      <span className="inline-flex items-center gap-2">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading records...
      </span>
    </div>
  );
}
