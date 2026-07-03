import {
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    ChevronDownIcon,
    ChevronRightIcon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getNavigationForRole,
    getProfileNavigationForRole,
    NavigationItem,
} from '../../utils/navigation';
import BrandLogo from '../common/BrandLogo';

const SIDEBAR_WIDTH = 272;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ─── Avatar initials helper ───────────────────────────────────────────────────
const getInitials = (name?: string | null, email?: string): string => {
  if (name) return name[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return 'U';
};

// ─── Role display label ───────────────────────────────────────────────────────
const getRoleLabel = (role: string): string =>
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Nav Item ─────────────────────────────────────────────────────────────────
interface NavItemProps {
  item: NavigationItem;
  level?: number;
  onNavigate?: () => void;
}

const NavItemComponent: React.FC<NavItemProps> = ({ item, level = 0, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive =
    location.pathname === item.path ||
    (item.children?.some(
      (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/')
    ) ?? false);

  const isChildActive =
    item.children?.some(
      (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/')
    ) ?? false;

  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  const hasChildren = Boolean(item.children?.length);
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setOpen((p) => !p);
    } else {
      navigate(item.path);
      onNavigate?.();
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`nav-item w-full text-left ${
          isActive && !hasChildren ? 'active' : ''
        } ${level > 0 ? 'pl-9' : ''}`}
        style={level > 0 ? { paddingLeft: '2.25rem' } : undefined}
      >
        {level === 0 && (
          <Icon className={`nav-icon w-5 h-5 shrink-0 ${isActive && !hasChildren ? 'text-brand-400' : ''}`} />
        )}
        {level > 0 && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
            style={{
              backgroundColor: isActive
                ? 'var(--sidebar-active-text)'
                : 'var(--sidebar-text-muted)',
            }}
          />
        )}
        <span className="flex-1 truncate font-medium text-sm">{item.title}</span>
        {hasChildren && (
          open
            ? <ChevronDownIcon className="w-4 h-4 opacity-50 shrink-0" />
            : <ChevronRightIcon className="w-4 h-4 opacity-50 shrink-0" />
        )}
      </button>

      {/* Children */}
      {hasChildren && open && (
        <div className="mt-0.5 mb-1">
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
interface ProfileDropdownProps {
  user: { name?: string | null; full_name?: string | null; email: string; role: string };
  onLogout: () => void;
  onProfile: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onLogout, onProfile }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const displayName = user.name || user.full_name || 'User';
  const initials = getInitials(displayName, user.email);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-100 shadow-card-lg py-1 z-50 animate-fade-in">
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>

          <button
            onClick={() => { onProfile(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserCircleIcon className="w-4 h-4 text-slate-400" />
            Profile Settings
          </button>

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isProfilePage = location.pathname.endsWith('/profile');

  const navigation = useMemo(() => {
    if (!user) return [];
    return isProfilePage
      ? getProfileNavigationForRole(user.role)
      : getNavigationForRole(user.role);
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [user?.role, isProfilePage]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    // eslint-disable-next-line no-empty
    } catch {}
  };

  const handleProfile = () => {
    if (!user) return;
    const paths: Record<string, string> = {
      VENDOR:            '/vendor/profile',
      AUDITOR:           '/auditor/profile',
      ADMIN:             '/admin/profile',
      INVENTORY_MANAGER: '/inventory-manager/profile',
      IT_MANAGER:        '/profile',
    };
    navigate(paths[user.role] ?? '/dashboard');
  };

  const displayName = user?.name || user?.full_name || 'User';

  // ── Sidebar content ──────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div
        className="flex items-center justify-center px-5 h-16 shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <BrandLogo variant="white" width={140} />
      </div>

      {/* User card */}
      {user && (
        <div
          className="mx-3 my-3 rounded-xl p-3 shrink-0"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--sidebar-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0"
              style={{ border: '2px solid rgba(129,140,248,0.2)' }}
            >
              {getInitials(displayName, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">{displayName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(129,140,248,0.12)',
                color: '#818CF8',
                border: '1px solid rgba(129,140,248,0.2)',
              }}
            >
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>
      )}

      <div style={{ borderBottom: '1px solid var(--sidebar-border)' }} />

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-2 py-3 scrollbar-dark space-y-0.5"
        aria-label="Sidebar navigation"
      >
        {navigation.map((item) => (
          <NavItemComponent
            key={item.id}
            item={item}
            onNavigate={() => setSidebarOpen(false)}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{ width: SIDEBAR_WIDTH, borderRight: '1px solid var(--sidebar-border)' }}
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col md:hidden transition-transform duration-300 ease-spring ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 260 }}
        aria-label="Mobile navigation"
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          aria-label="Close menu"
        >
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top AppBar */}
        <header
          className="shrink-0 flex items-center justify-between px-4 sm:px-6 h-16 bg-white/90 backdrop-blur-sm relative z-40"
          style={{
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-5 h-5 text-slate-600" />
            </button>

            <h1 className="text-base font-semibold font-display text-slate-700 capitalize">
              {user?.role.replace(/_/g, ' ').toLowerCase()} Workspace
            </h1>
          </div>

          {/* Right side — profile */}
          {user && (
            <ProfileDropdown
              user={user}
              onLogout={handleLogout}
              onProfile={handleProfile}
            />
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;