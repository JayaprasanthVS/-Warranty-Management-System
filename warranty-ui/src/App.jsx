import { useState, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import WarrantyCheck from './pages/WarrantyCheck';
import ProductCatalog from './pages/ProductCatalog';
import MyWarranties from './pages/MyWarranties';
import ClaimsDesk from './pages/ClaimsDesk';
import AdminOverview from './pages/AdminOverview';
import { ShieldCheck, LogOut, Sparkles } from 'lucide-react';

export default function App() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('warranties');
  const [authView, setAuthView] = useState('login');

  if (!user) {
    return (
      <div className="premium-app overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
        <div className="ambient-orb ambient-orb--top" />
        <div className="ambient-orb ambient-orb--bottom" />
        <div className="shell min-h-[calc(100vh-3rem)] grid items-center gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <section className="hero-panel soft-grid rounded-[2rem] p-8 sm:p-10 lg:p-14 animate-fade-in">
            <span className="pill mb-6">
              <Sparkles className="h-4 w-4 text-amber-700" />
               Warranty Experience
            </span>
            <p className="section-label mb-4"> Support portal</p>
            <h1 className="premium-title font-extrabold text-slate-900">
              Make warranty care feel as polished as the products it protects.
            </h1>
            <p className="premium-text mt-6 max-w-2xl text-base sm:text-lg">
              A cleaner layout, slower light motion, and softer luxury surfaces make the interface feel premium without crowding the screen.
            </p>
            <div className="mt-8 max-w-2xl space-y-4">
              <div className="premium-highlight-line" />
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="pill">Smooth gradients</span>
                <span className="pill">Glass surfaces</span>
                <span className="pill">Balanced spacing</span>
              </div>
            </div>
          </section>

          <div className="animate-fade-in">
            {authView === 'login' ? (
              <Login switchToRegister={() => setAuthView('register')} />
            ) : (
              <Register switchToLogin={() => setAuthView('login')} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-app overflow-hidden pb-10">
      <div className="ambient-orb ambient-orb--top" />
      <div className="ambient-orb ambient-orb--bottom" />

      <header className="shell sticky top-4 z-50 pt-4">
        <div className="glass-header rounded-[1.75rem] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-200/60">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="section-label">SecureClaim Suite</p>
                  <div className="brand-wordmark text-2xl font-extrabold text-slate-900">Warranty Concierge</div>
                </div>
              </div>

              <button onClick={logout} className="premium-button premium-button-secondary xl:hidden" title="Log Out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <nav className="premium-card premium-muted flex w-full flex-wrap gap-2 rounded-full p-2 lg:w-auto">
                <button
                  onClick={() => setActiveTab('warranties')}
                  className={`premium-tab cursor-pointer ${activeTab === 'warranties' ? 'premium-tab-active' : ''}`}
                >
                  Warranty Check
                </button>
                <button
                  onClick={() => setActiveTab('hub')}
                  className={`premium-tab cursor-pointer ${activeTab === 'hub' ? 'premium-tab-active' : ''}`}
                >
                  My Warranties
                </button>
                {(user.role === 'ADMIN' || user.role === 'SUPPORT') && (
                  <>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`premium-tab cursor-pointer ${activeTab === 'overview' ? 'premium-tab-active' : ''}`}
                    >
                      Overview
                    </button>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`premium-tab cursor-pointer ${activeTab === 'products' ? 'premium-tab-active' : ''}`}
                    >
                      Product Catalog
                    </button>
                    <button
                      onClick={() => setActiveTab('claims')}
                      className={`premium-tab cursor-pointer ${activeTab === 'claims' ? 'premium-tab-active' : ''}`}
                    >
                      Claims Desk
                    </button>
                  </>
                )}
                {user.role === 'SUPPORT' && (
                  <button
                    onClick={() => setActiveTab('claims')}
                    className={`premium-tab cursor-pointer ${activeTab === 'claims' ? 'premium-tab-active' : ''}`}
                  >
                    Claims Desk
                  </button>
                )}
              </nav>

              <div className="premium-card flex items-center justify-between gap-4 rounded-[1.25rem] px-4 py-3 sm:min-w-72">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.userName || user.email}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{user.role}</p>
                  </div>
                </div>

                <button onClick={logout} className="premium-button premium-button-secondary hidden px-4 py-3 xl:inline-flex" title="Log Out">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="shell relative z-10 px-1 pt-8">
        {activeTab === 'warranties' ? <WarrantyCheck /> : null}
        {activeTab === 'hub' ? <MyWarranties user={user} /> : null}
        {activeTab === 'overview' ? <AdminOverview user={user} /> : null}
        {activeTab === 'products' ? <ProductCatalog /> : null}
        {activeTab === 'claims' ? <ClaimsDesk user={user} /> : null}
      </main>
    </div>
  );
}
