import { useEffect, useState } from 'react';
import { ClipboardList, LoaderCircle, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';
import { useToast } from '../components/toast-context';

const STATUS_OPTIONS = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'];

export default function ClaimsDesk({ user }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingClaimId, setSavingClaimId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState({ status: '', userEmail: '', serialNumber: '' });
  const toast = useToast();

  useEffect(() => {
    let ignore = false;

    const loadClaims = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/claims', {
          params: {
            status: filters.status || undefined,
            userEmail: filters.userEmail || undefined,
            serialNumber: filters.serialNumber || undefined,
          },
        });
        if (!ignore) {
          setClaims(response.data);
          setDrafts(
            Object.fromEntries(
              response.data.map((claim) => [
                claim.id,
                { status: claim.status, adminNote: claim.adminNote || '' },
              ])
            )
          );
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, 'Unable to load claims right now.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadClaims();

    return () => {
      ignore = true;
    };
  }, [filters, user.role]);

  const handleSave = async (claimId) => {
    const draft = drafts[claimId];
    setSavingClaimId(claimId);
    try {
      const response = await api.patch(`/claims/${claimId}/status`, {
        status: draft.status,
        adminNote: draft.adminNote,
      });
      setClaims((current) => current.map((claim) => (claim.id === claimId ? response.data : claim)));
      toast.success('Claim updated successfully.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update claim.'));
    } finally {
      setSavingClaimId(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 py-6 sm:py-8">
      <section className="hero-panel soft-grid rounded-[2rem] p-6 sm:p-8">
        <span className="pill mb-5">
          <ShieldCheck className="h-4 w-4 text-amber-700" />
          Admin review console
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Review incoming warranty claims with cleaner status control.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
          Move requests through review, approval, rejection, and closure while leaving a note for the customer context.
        </p>
      </section>

      <div className="premium-card premium-card-strong rounded-[1.75rem] p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <select
            className="premium-select"
            value={filters.status}
            onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
          >
            <option value="">All claim statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="premium-input"
            placeholder="Customer email"
            value={filters.userEmail}
            onChange={(e) => setFilters((current) => ({ ...current, userEmail: e.target.value }))}
          />
          <input
            type="text"
            className="premium-input"
            placeholder="Warranty serial"
            value={filters.serialNumber}
            onChange={(e) => setFilters((current) => ({ ...current, serialNumber: e.target.value }))}
          />
        </div>
      </div>

      {loading ? <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-slate-500">Loading claims...</div> : null}
      {error ? <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-red-600">{error}</div> : null}
      {!loading && !error && claims.length === 0 ? (
        <div className="premium-card premium-card-strong rounded-[1.75rem] p-6 text-sm text-slate-500">No claims have been submitted yet.</div>
      ) : null}

      {!loading && !error && claims.length > 0 ? (
        <div className="grid gap-4">
          {claims.map((claim) => {
            const draft = drafts[claim.id] || { status: claim.status, adminNote: claim.adminNote || '' };
            return (
              <div key={claim.id} className="premium-card premium-card-strong card-hover-lift rounded-[1.75rem] p-5 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="section-label mb-2">Claim ticket</p>
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{claim.issueTitle}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{claim.issueDescription}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <InfoTile label="Customer" value={claim.user?.name || 'N/A'} />
                  <InfoTile label="Serial" value={claim.warranty?.serialNumber || 'N/A'} />
                  <InfoTile label="Product" value={claim.warranty?.product?.modelNumber || 'N/A'} />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.65fr_1fr_auto] lg:items-end">
                  <div>
                    <label className="mb-2 block font-medium text-slate-700">Status</label>
                    <select
                      className="premium-select"
                      value={draft.status}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [claim.id]: { ...draft, status: e.target.value },
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-slate-700">Admin Note</label>
                    <textarea
                      className="premium-textarea"
                      value={draft.adminNote}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [claim.id]: { ...draft, adminNote: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <button
                    type="button"
                    disabled={savingClaimId === claim.id}
                    onClick={() => handleSave(claim.id)}
                    className="premium-button premium-button-primary h-fit"
                  >
                    {savingClaimId === claim.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                    {savingClaimId === claim.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }) {
  const palette = {
    REQUESTED: 'border-sky-200 bg-sky-50 text-sky-700',
    UNDER_REVIEW: 'border-violet-200 bg-violet-50 text-violet-700',
    APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
    CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] ${palette[status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="premium-muted rounded-[1.25rem] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
