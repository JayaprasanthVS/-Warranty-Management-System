import { useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';
import { useToast } from '../components/toast-context';

export default function Register({ switchToLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const toast = useToast();

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const nextErrors = validateForm();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      setSuccess(true);
      toast.success('Profile created successfully.');
      setTimeout(() => {
        switchToLogin();
      }, 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration rejected. Email signature might be in use.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card premium-card-strong w-full max-w-xl rounded-[2rem] p-6 shadow-2xl shadow-stone-200/60 sm:p-8">
      <div className="mb-8 flex flex-col gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-200/70">
          <UserPlus className="h-7 w-7" />
        </div>
        <div>
          <p className="section-label mb-3">Account setup</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Profile</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Register a verified identity and choose the right access tier for your warranty support workflow.</p>
        </div>
      </div>

      {error && (
        <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50/90 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/90 p-4 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Profile compiled successfully! Routing to sign-in...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div>
          <label className="mb-2 block font-medium text-slate-700">Full Identity Name</label>
          <input
            type="text"
            className="premium-input"
            placeholder="e.g., Jayaprasanth"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setFieldErrors((current) => ({ ...current, name: '' }));
            }}
            required
          />
          {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label className="mb-2 block font-medium text-slate-700">Email Address</label>
          <input
            type="email"
            className="premium-input"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              setFieldErrors((current) => ({ ...current, email: '' }));
            }}
            required
          />
          {fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
        </div>

        <div>
          <label className="mb-2 block font-medium text-slate-700">Account Security Password</label>
          <input
            type="password"
            className="premium-input"
            placeholder="........"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setFieldErrors((current) => ({ ...current, password: '' }));
            }}
            required
          />
          {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
        </div>

        <div>
          <label className="mb-2 block font-medium text-slate-700">Account Clearance Level</label>
          <select className="premium-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option value="CUSTOMER">Customer Account (View-Only Lookup)</option>
            <option value="SUPPORT">Support Specialist (Claims and Warranty Review)</option>
            <option value="ADMIN">System Administrator (Full Inventory Control)</option>
          </select>
        </div>

        <button type="submit" disabled={loading || success} className="premium-button premium-button-primary animate-soft-pulse mt-2 w-full">
          <UserPlus className="h-4 w-4" />
          <span>{loading ? 'Processing...' : 'Register Secure Profile'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 border-t border-stone-200 pt-5 text-center">
        <button onClick={switchToLogin} className="text-sm font-semibold text-amber-700 hover:text-amber-800 focus:outline-none cursor-pointer">
          Already holding an identity signature? Log in here
        </button>
      </div>
    </div>
  );
}
