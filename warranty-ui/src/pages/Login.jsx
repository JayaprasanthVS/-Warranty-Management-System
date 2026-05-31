import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, LogIn, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api, getApiErrorMessage } from '../lib/api';
import { useToast } from '../components/toast-context';

export default function Login({ switchToRegister }) {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const toast = useToast();

  const validateForm = () => {
    const nextErrors = {};
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
    const nextErrors = validateForm();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      login(response.data);
      toast.success('Signed in successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email credentials or password combination.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card premium-card-strong w-full max-w-xl rounded-[2rem] p-6 shadow-2xl shadow-stone-200/60 sm:p-8">
      <div className="mb-8 flex flex-col gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-200/70">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <p className="section-label mb-3">Member access</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">SecureClaim Gateway</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Sign in to review warranties, manage catalog entries, and keep every product record in one polished workspace.</p>
        </div>
      </div>

      {error && (
        <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50/90 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div>
          <label className="mb-2 block font-medium text-slate-700">Email Address</label>
          <input
            type="email"
            className="premium-input"
            placeholder="name@example.com"
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
          <label className="mb-2 block font-medium text-slate-700">Account Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="premium-input pr-12"
              placeholder="........"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setFieldErrors((current) => ({ ...current, password: '' }));
              }}
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
        </div>

        <button type="submit" disabled={loading} className="premium-button premium-button-primary animate-soft-pulse mt-2 w-full">
          <LogIn className="h-4 w-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 border-t border-stone-200 pt-5 text-center">
        <button onClick={switchToRegister} className="text-sm font-semibold text-amber-700 hover:text-amber-800 focus:outline-none cursor-pointer">
          New to SecureClaim? Create an official profile
        </button>
      </div>
    </div>
  );
}
