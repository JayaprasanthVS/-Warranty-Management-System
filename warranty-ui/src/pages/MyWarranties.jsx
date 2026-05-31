import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardCheck, Download, FilePlus2, LoaderCircle, Paperclip, Sparkles } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';
import { useToast } from '../components/toast-context';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'EXPIRED', 'CLAIMED'];

export default function MyWarranties({ user }) {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingWarranty, setSubmittingWarranty] = useState(false);
  const [submittingClaimId, setSubmittingClaimId] = useState(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState(null);
  const [uploadingClaimAttachmentId, setUploadingClaimAttachmentId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [claimErrors, setClaimErrors] = useState({});
  const [openClaimWarrantyId, setOpenClaimWarrantyId] = useState(null);
  const [claimDrafts, setClaimDrafts] = useState({});
  const [registerForm, setRegisterForm] = useState({
    serialNumber: '',
    productId: '',
    purchaseDate: '',
  });
  const [pageError, setPageError] = useState('');
  const toast = useToast();

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setPageError('');
      try {
        const [productsResponse, summaryResponse, warrantiesResponse, claimsResponse, notificationsResponse] = await Promise.all([
          api.get('/products'),
          api.get('/warranties/my/summary'),
          api.get('/warranties/my'),
          api.get('/claims/my'),
          api.get('/notifications/my'),
        ]);

        if (!ignore) {
          setProducts(productsResponse.data);
          setSummary(summaryResponse.data);
          setWarranties(warrantiesResponse.data);
          setClaims(claimsResponse.data);
          setNotifications(notificationsResponse.data);
        }
      } catch (err) {
        if (!ignore) {
          setPageError(getApiErrorMessage(err, 'Unable to load your warranty dashboard right now.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const latestClaimByWarrantyId = useMemo(() => {
    const map = new Map();
    claims.forEach((claim) => {
      const warrantyId = claim.warranty?.id;
      if (!warrantyId) {
        return;
      }
      const current = map.get(warrantyId);
      if (!current || new Date(claim.updatedAt) > new Date(current.updatedAt)) {
        map.set(warrantyId, claim);
      }
    });
    return map;
  }, [claims]);

  const filteredWarranties = useMemo(() => {
    return warranties.filter((warranty) => {
      const matchesFilter = filter === 'ALL' || warranty.status === filter;
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        warranty.serialNumber.toLowerCase().includes(needle) ||
        warranty.product?.name?.toLowerCase().includes(needle) ||
        warranty.product?.modelNumber?.toLowerCase().includes(needle);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, warranties]);

  const validateWarrantyForm = () => {
    const nextErrors = {};
    if (!registerForm.serialNumber.trim()) {
      nextErrors.serialNumber = 'Serial number is required.';
    } else if (!/^[A-Za-z0-9-]{6,40}$/.test(registerForm.serialNumber.trim())) {
      nextErrors.serialNumber = 'Use 6-40 letters, numbers, or hyphens.';
    }

    if (!registerForm.productId) {
      nextErrors.productId = 'Choose a product model.';
    }

    if (!registerForm.purchaseDate) {
      nextErrors.purchaseDate = 'Purchase date is required.';
    } else if (new Date(registerForm.purchaseDate) > new Date()) {
      nextErrors.purchaseDate = 'Purchase date cannot be in the future.';
    }

    return nextErrors;
  };

  const validateClaimForm = (draft) => {
    const nextErrors = {};
    if (!draft?.issueTitle?.trim()) {
      nextErrors.issueTitle = 'Issue title is required.';
    }
    if (!draft?.issueDescription?.trim()) {
      nextErrors.issueDescription = 'Issue description is required.';
    }
    return nextErrors;
  };

  const refreshDashboard = async () => {
    const [summaryResponse, warrantiesResponse, claimsResponse, notificationsResponse] = await Promise.all([
      api.get('/warranties/my/summary'),
      api.get('/warranties/my'),
      api.get('/claims/my'),
      api.get('/notifications/my'),
    ]);
    setSummary(summaryResponse.data);
    setWarranties(warrantiesResponse.data);
    setClaims(claimsResponse.data);
    setNotifications(notificationsResponse.data);
  };

  const handleRegisterWarranty = async (e) => {
    e.preventDefault();
    const nextErrors = validateWarrantyForm();
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmittingWarranty(true);
    try {
      await api.post('/warranties', {
        serialNumber: registerForm.serialNumber,
        productId: Number(registerForm.productId),
        purchaseDate: registerForm.purchaseDate,
      });
      setRegisterForm({ serialNumber: '', productId: '', purchaseDate: '' });
      toast.success('Warranty registered successfully.');
      await refreshDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to register warranty.'));
    } finally {
      setSubmittingWarranty(false);
    }
  };

  const handleClaimSubmit = async (warrantyId) => {
    const draft = claimDrafts[warrantyId] || { issueTitle: '', issueDescription: '' };
    const nextErrors = validateClaimForm(draft);
    setClaimErrors((current) => ({ ...current, [warrantyId]: nextErrors }));
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmittingClaimId(warrantyId);
    try {
      await api.post('/claims', {
        warrantyId,
        issueTitle: draft.issueTitle,
        issueDescription: draft.issueDescription,
      });
      toast.success('Claim submitted successfully.');
      setOpenClaimWarrantyId(null);
      setClaimDrafts((current) => ({ ...current, [warrantyId]: { issueTitle: '', issueDescription: '' } }));
      await refreshDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to submit claim.'));
    } finally {
      setSubmittingClaimId(null);
    }
  };

  const handleInvoiceUpload = async (warrantyId, file) => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadingInvoiceId(warrantyId);
    try {
      await api.post(`/warranties/${warrantyId}/invoice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Invoice uploaded successfully.');
      await refreshDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to upload invoice.'));
    } finally {
      setUploadingInvoiceId(null);
    }
  };

  const handleClaimAttachmentUpload = async (claimId, file) => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadingClaimAttachmentId(claimId);
    try {
      await api.post(`/claims/${claimId}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Claim attachment uploaded successfully.');
      await refreshDashboard();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to upload claim attachment.'));
    } finally {
      setUploadingClaimAttachmentId(null);
    }
  };

  const handleCertificateDownload = async (warranty) => {
    try {
      const response = await api.get(`/warranties/${warranty.id}/certificate`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `warranty-certificate-${warranty.serialNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Warranty certificate downloaded.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to download certificate.'));
    }
  };

  return (
    <div className="animate-fade-in space-y-6 py-6 sm:py-8">
      <section className="hero-panel soft-grid rounded-[2rem] p-6 sm:p-8">
        <span className="pill mb-5">
          <Sparkles className="h-4 w-4 text-amber-700" />
          Customer warranty hub
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Register, track, and claim from one premium workspace.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
          This dashboard brings warranty registration, lifecycle tracking, expiring-soon visibility, and service claims into one calmer workflow.
        </p>
      </section>

      {pageError ? (
        <div className="premium-card premium-card-strong rounded-[1.75rem] p-5 text-sm text-red-600">{pageError}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Total" value={summary?.total} loading={loading} />
        <SummaryCard label="Active" value={summary?.active} loading={loading} accent="emerald" />
        <SummaryCard label="Expired" value={summary?.expired} loading={loading} accent="amber" />
        <SummaryCard label="Claimed" value={summary?.claimed} loading={loading} accent="slate" />
        <SummaryCard label="Expiring Soon" value={summary?.expiringSoon} loading={loading} accent="rose" />
      </section>

      <section className="premium-card premium-card-strong rounded-[2rem] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
        <div className="mt-4 grid gap-3">
          {loading ? <div className="text-sm text-slate-500">Loading notifications...</div> : null}
          {!loading && notifications.length === 0 ? <div className="text-sm text-slate-500">No notifications yet. Expiry reminders and claim updates will show here.</div> : null}
          {!loading &&
            notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="rounded-[1.2rem] border border-stone-200 bg-white/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{notification.subject}</p>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                    {notification.deliveryStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{notification.message}</p>
              </div>
            ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="premium-card premium-card-strong rounded-[2rem] p-6 sm:p-7">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FilePlus2 className="h-5 w-5 text-amber-700" />
            Register Warranty
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">Attach a product model, serial number, and purchase date to activate protection for this customer account.</p>

          <form onSubmit={handleRegisterWarranty} className="mt-6 space-y-5 text-sm">
            <div>
              <label className="mb-2 block font-medium text-slate-700">Serial Number</label>
              <input
                type="text"
                className="premium-input"
                placeholder="e.g., SN-PS5-987654321"
                value={registerForm.serialNumber}
                onChange={(e) => {
                  setRegisterForm((current) => ({ ...current, serialNumber: e.target.value }));
                  setFormErrors((current) => ({ ...current, serialNumber: '' }));
                }}
              />
              {formErrors.serialNumber ? <p className="field-error">{formErrors.serialNumber}</p> : null}
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-700">Product Model</label>
              <select
                className="premium-select"
                value={registerForm.productId}
                onChange={(e) => {
                  setRegisterForm((current) => ({ ...current, productId: e.target.value }));
                  setFormErrors((current) => ({ ...current, productId: '' }));
                }}
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.modelNumber})
                  </option>
                ))}
              </select>
              {formErrors.productId ? <p className="field-error">{formErrors.productId}</p> : null}
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-700">Purchase Date</label>
              <input
                type="date"
                className="premium-input"
                value={registerForm.purchaseDate}
                onChange={(e) => {
                  setRegisterForm((current) => ({ ...current, purchaseDate: e.target.value }));
                  setFormErrors((current) => ({ ...current, purchaseDate: '' }));
                }}
              />
              {formErrors.purchaseDate ? <p className="field-error">{formErrors.purchaseDate}</p> : <p className="field-hint">Purchase dates older than 10 years are blocked by the backend rules.</p>}
            </div>

            <button type="submit" disabled={submittingWarranty} className="premium-button premium-button-primary w-full">
              {submittingWarranty ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {submittingWarranty ? 'Registering...' : 'Register Warranty'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="premium-card premium-card-strong rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Warranties</h2>
                <p className="mt-1 text-sm text-slate-500">Filter by status or search by serial number and product.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  className="premium-input min-w-60"
                  placeholder="Search warranty"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="premium-card premium-muted flex flex-wrap gap-2 rounded-full p-2">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilter(status)}
                      className={`premium-tab cursor-pointer ${filter === status ? 'premium-tab-active' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="premium-card premium-card-strong rounded-[2rem] p-6 text-sm text-slate-500">Loading warranties...</div>
          ) : null}

          {!loading && filteredWarranties.length === 0 ? (
            <div className="premium-card premium-card-strong rounded-[2rem] p-6 text-sm text-slate-500">No warranties match this filter yet. Register one on the left to get started.</div>
          ) : null}

          {!loading && filteredWarranties.length > 0 ? (
            <div className="grid gap-4">
              {filteredWarranties.map((warranty) => {
                const latestClaim = latestClaimByWarrantyId.get(warranty.id);
                const isClaimOpen = openClaimWarrantyId === warranty.id;
                const claimForm = claimDrafts[warranty.id] || { issueTitle: '', issueDescription: '' };
                const warrantyClaimErrors = claimErrors[warranty.id] || {};

                return (
                  <div key={warranty.id} className="premium-card premium-card-strong card-hover-lift rounded-[1.75rem] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="section-label mb-2">Serial number</p>
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{warranty.serialNumber}</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {warranty.product?.name} • {warranty.product?.modelNumber}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={warranty.status} />
                        {latestClaim ? <StatusBadge status={latestClaim.status} claim /> : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <InfoTile label="Purchase Date" value={warranty.purchaseDate} />
                      <InfoTile label="Expiry Date" value={warranty.expiryDate} />
                      <InfoTile label="Recent Claim" value={latestClaim ? latestClaim.issueTitle : 'No claims yet'} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={() => handleCertificateDownload(warranty)} className="premium-button premium-button-secondary">
                        <Download className="h-4 w-4" />
                        Download Certificate
                      </button>
                      <label className="premium-button premium-button-secondary cursor-pointer">
                        {uploadingInvoiceId === warranty.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        {warranty.invoiceFileName ? 'Replace Invoice' : 'Upload Invoice'}
                        <input type="file" className="hidden" onChange={(e) => handleInvoiceUpload(warranty.id, e.target.files?.[0])} />
                      </label>
                      {warranty.invoiceFileName ? <span className="self-center text-sm text-slate-500">Invoice: {warranty.invoiceFileName}</span> : null}
                    </div>

                    {latestClaim ? (
                      <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-white/60 p-4">
                        <p className="text-sm font-semibold text-slate-900">{latestClaim.issueTitle}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{latestClaim.issueDescription}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-slate-400">
                          <span>Submitted {formatDateTime(latestClaim.createdAt)}</span>
                          <span>Updated {formatDateTime(latestClaim.updatedAt)}</span>
                        </div>
                        {latestClaim.adminNote ? <p className="mt-3 text-sm text-amber-800">Admin note: {latestClaim.adminNote}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <label className="premium-button premium-button-secondary cursor-pointer">
                            {uploadingClaimAttachmentId === latestClaim.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                            {latestClaim.attachmentFileName ? 'Replace Claim Proof' : 'Upload Claim Proof'}
                            <input type="file" className="hidden" onChange={(e) => handleClaimAttachmentUpload(latestClaim.id, e.target.files?.[0])} />
                          </label>
                          {latestClaim.attachmentFileName ? <span className="self-center text-sm text-slate-500">Attachment: {latestClaim.attachmentFileName}</span> : null}
                        </div>
                      </div>
                    ) : null}

                    {warranty.status !== 'EXPIRED' && warranty.status !== 'CLAIMED' ? (
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => setOpenClaimWarrantyId(isClaimOpen ? null : warranty.id)}
                          className="premium-button premium-button-secondary"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          {isClaimOpen ? 'Hide Claim Form' : 'Request Claim'}
                        </button>

                        {isClaimOpen ? (
                          <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white/60 p-4 sm:p-5">
                            <div className="grid gap-4">
                              <div>
                                <label className="mb-2 block font-medium text-slate-700">Issue Title</label>
                                <input
                                  type="text"
                                  className="premium-input"
                                  value={claimForm.issueTitle}
                                  onChange={(e) => {
                                    setClaimDrafts((current) => ({
                                      ...current,
                                      [warranty.id]: { ...claimForm, issueTitle: e.target.value },
                                    }));
                                    setClaimErrors((current) => ({
                                      ...current,
                                      [warranty.id]: { ...(current[warranty.id] || {}), issueTitle: '' },
                                    }));
                                  }}
                                />
                                {warrantyClaimErrors.issueTitle ? <p className="field-error">{warrantyClaimErrors.issueTitle}</p> : null}
                              </div>
                              <div>
                                <label className="mb-2 block font-medium text-slate-700">Issue Description</label>
                                <textarea
                                  className="premium-textarea"
                                  value={claimForm.issueDescription}
                                  onChange={(e) => {
                                    setClaimDrafts((current) => ({
                                      ...current,
                                      [warranty.id]: { ...claimForm, issueDescription: e.target.value },
                                    }));
                                    setClaimErrors((current) => ({
                                      ...current,
                                      [warranty.id]: { ...(current[warranty.id] || {}), issueDescription: '' },
                                    }));
                                  }}
                                />
                                {warrantyClaimErrors.issueDescription ? <p className="field-error">{warrantyClaimErrors.issueDescription}</p> : null}
                              </div>
                              <button
                                type="button"
                                disabled={submittingClaimId === warranty.id}
                                onClick={() => handleClaimSubmit(warranty.id)}
                                className="premium-button premium-button-primary w-fit"
                              >
                                {submittingClaimId === warranty.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                                {submittingClaimId === warranty.id ? 'Submitting Claim...' : 'Submit Claim'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                        <AlertCircle className="h-4 w-4" />
                        Claims are unavailable for warranties in the {warranty.status.toLowerCase()} state.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, loading, accent = 'amber' }) {
  const accentClass = {
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    slate: 'text-slate-700',
  }[accent];

  return (
    <div className="premium-card metric-card rounded-[1.75rem] p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-3 text-4xl font-extrabold tracking-tight ${accentClass || 'text-slate-900'}`}>
        {loading ? '...' : value ?? 0}
      </p>
    </div>
  );
}

function StatusBadge({ status, claim = false }) {
  const palette = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    EXPIRED: 'border-amber-200 bg-amber-50 text-amber-700',
    CLAIMED: 'border-slate-200 bg-slate-100 text-slate-700',
    REQUESTED: 'border-sky-200 bg-sky-50 text-sky-700',
    UNDER_REVIEW: 'border-violet-200 bg-violet-50 text-violet-700',
    APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
    CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] ${palette[status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <span className="status-dot" />
      {claim ? `Claim ${status}` : status}
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

function formatDateTime(value) {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
}
