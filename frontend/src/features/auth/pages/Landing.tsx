import {
    ArrowRightIcon,
    ArrowTrendingUpIcon,
    BellAlertIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    CubeIcon,
    DocumentTextIcon,
    QrCodeIcon,
    ShieldCheckIcon,
    SparklesIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import BrandLogo from '../../../components/common/BrandLogo';

// ─── Scroll-reveal hook (fixed: threshold=0, rootMargin offset) ──────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Check if already in viewport immediately on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ─── Single element reveal hook ───────────────────────────────────────────────
function useRevealEl() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Staggered reveal wrapper ─────────────────────────────────────────────────
function StaggerReveal({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const { ref, visible } = useRevealEl();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${index * 0.12}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${index * 0.12}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: <CubeIcon className="w-6 h-6" />, title: 'Smart Asset Tracking', description: 'Log, categorize, and monitor every asset — from IT hardware to office furniture — with real-time status updates and full lifecycle visibility.', color: '#818CF8', bg: 'rgba(79,70,229,0.12)' },
  { icon: <ShieldCheckIcon className="w-6 h-6" />, title: 'Role-Based Access Control', description: 'Granular permissions for Admins, Inventory Managers, IT Managers, Auditors, and Vendors. Every action is tracked and auditable.', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { icon: <ChartBarIcon className="w-6 h-6" />, title: 'Visual Analytics & Reports', description: 'Beautiful dashboards with depreciation records, lifecycle analysis, and custom analytics. Export audit-ready PDFs in one click.', color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
  { icon: <QrCodeIcon className="w-6 h-6" />, title: 'QR Code Workflows', description: 'Scan asset labels from any mobile browser — no app install needed. Point, scan, and instantly update asset location or status.', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  { icon: <DocumentTextIcon className="w-6 h-6" />, title: 'Full Audit Trail', description: 'Every action, change, and approval is logged with timestamp, user identity, and IP address. Full compliance-ready history at your fingertips.', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  { icon: <BellAlertIcon className="w-6 h-6" />, title: 'Proactive Smart Alerts', description: 'Automatic notifications for warranty expiry, maintenance due dates, dead stock thresholds, and pending approval requests.', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
];

const steps = [
  { step: '01', icon: <CubeIcon className="w-8 h-8" />, title: 'Register Your Assets', description: 'Add assets with photos, QR codes, category tags, location data, vendor info, and custom attributes in under 60 seconds.', detail: 'Supports bulk CSV import and individual asset creation with full metadata.' },
  { step: '02', icon: <ArrowTrendingUpIcon className="w-8 h-8" />, title: 'Track Every Lifecycle Stage', description: 'Monitor every transition — Active, Maintenance, Damaged, Scrapped, or Dead Stock — with a full timestamped change history.', detail: 'Role-based workflows ensure only authorized users can change critical status fields.' },
  { step: '03', icon: <DocumentTextIcon className="w-8 h-8" />, title: 'Generate Instant Reports', description: 'Export audit-ready PDF and Excel reports with depreciation schedules, disposal records, compliance summaries, and lifecycle analytics.', detail: 'One-click exports satisfy government audits, internal reviews, and board-level reporting.' },
];

const testimonials = [
  { quote: 'We replaced 14 sprawling spreadsheets with this system. Our audit preparation time dropped from 2 days to just 3 hours. The audit trail feature is incredible.', name: 'Ravi Mehta', role: 'IT Head', org: 'TechCorp India', initials: 'RM', color: '#818CF8', stats: '14 Spreadsheets → 1 Platform' },
  { quote: 'The QR scanning workflow alone saved our team 8 hours per week. Dead stock tracking is now effortless and our monthly reports write themselves.', name: 'Priya Sharma', role: 'Inventory Manager', org: 'LogiHub Solutions', initials: 'PS', color: '#34D399', stats: '8 Hours Saved Per Week' },
  { quote: 'Role-based access is exactly what a compliance officer needs. Auditors can view every record and report without being able to modify anything.', name: 'Karan Joshi', role: 'Compliance Officer', org: 'FinServ Ltd', initials: 'KJ', color: '#F472B6', stats: '100% Compliance Ready' },
];

const stats = [
  { label: 'Assets Managed', value: 50000, suffix: '+', color: '#818CF8' },
  { label: 'Organizations', value: 200, suffix: '+', color: '#34D399' },
  { label: 'Reports Generated', value: 12000, suffix: '+', color: '#F472B6' },
  { label: 'Audit Success Rate', value: 100, suffix: '%', color: '#FBBF24' },
];

const roleFeatures = [
  { role: 'Admin', color: '#818CF8', bg: 'rgba(79,70,229,0.1)', perms: ['Full system control', 'User management', 'System settings', 'Backup & restore', 'All reports'] },
  { role: 'Inventory Manager', color: '#34D399', bg: 'rgba(52,211,153,0.1)', perms: ['Asset CRUD', 'QR scanning', 'Transfer requests', 'Dead stock tracking', 'Vendor management'] },
  { role: 'IT Manager', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', perms: ['IT asset management', 'Maintenance logs', 'Warranty tracking', 'Scrap management', 'IT reports'] },
  { role: 'Auditor', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', perms: ['Read-only access', 'Full audit logs', 'Compliance reports', 'Asset history', 'Export reports'] },
  { role: 'Vendor', color: '#F472B6', bg: 'rgba(244,114,182,0.1)', perms: ['Product catalog', 'Order management', 'Invoice tracking', 'Portal dashboard', 'Support tickets'] },
];

// ─── Main Component ────────────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(0);

  const featuresRef = useReveal();
  const stepsRef = useReveal();
  const statsRef = useReveal();
  const testimonialsRef = useReveal();
  const rolesRef = useReveal();
  const ctaRef = useReveal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050B1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
            <span className="text-white font-bold text-xl font-display">D</span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#4F46E5 transparent transparent transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: '#050B1A', color: '#fff' }}>

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          backgroundColor: scrolled ? 'rgba(5,11,26,0.92)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          <RouterLink to="/" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
            <BrandLogo variant="white" width={150} className="transition-transform duration-300 group-hover:scale-105" />
          </RouterLink>

          <nav className="hidden md:flex items-center gap-1">
            {[{ label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'Roles', href: '#roles' }, { label: 'Testimonials', href: '#testimonials' }].map(item => (
              <a key={item.label} href={item.href} className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#fff'; el.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'rgba(255,255,255,0.6)'; el.style.backgroundColor = 'transparent'; }}
              >{item.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <RouterLink to="/login" className="hidden sm:block px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; }}
            >Sign In</RouterLink>
            <RouterLink to="/register" className="px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(79,70,229,0.35)', textDecoration: 'none' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.boxShadow = '0 6px 22px rgba(79,70,229,0.55)'; el.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.boxShadow = '0 4px 14px rgba(79,70,229,0.35)'; el.style.transform = 'translateY(0)'; }}
            >Get Started Free</RouterLink>
            <button className="md:hidden p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.06)' }} onClick={() => setMobileMenuOpen(p => !p)} aria-label="Toggle menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-5 pb-4 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(5,11,26,0.97)' }}>
            {[{ label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'Roles', href: '#roles' }, { label: 'Testimonials', href: '#testimonials' }].map(item => (
              <a key={item.label} href={item.href} className="block px-4 py-2.5 text-sm font-medium rounded-lg" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
            ))}
            <RouterLink to="/login" className="block px-4 py-2.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Sign In</RouterLink>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ═══ HERO ═════════════════════════════════════════════════════════════ */}
        <section className="relative flex items-center pt-16 pb-16 overflow-hidden" style={{ minHeight: '100svh', background: 'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(79,70,229,0.28) 0%, transparent 65%)' }}>
          {/* Background orbs */}
          <div className="absolute orb-float pointer-events-none" style={{ width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', top: '-15%', left: '-12%', filter: 'blur(80px)' }} />
          <div className="absolute orb-float-rev pointer-events-none" style={{ width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', bottom: '5%', right: '-8%', filter: 'blur(80px)' }} />
          <div className="absolute inset-0 grid-bg pointer-events-none" style={{ maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />

          <div className="relative max-w-7xl mx-auto px-5 md:px-10 py-12 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: Copy */}
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-7" style={{ backgroundColor: 'rgba(79,70,229,0.12)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.25)' }}>
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Enterprise Dead Stock & Asset Management
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-none tracking-tight mb-6" style={{ color: '#fff', animationDelay: '0.1s' }}>
                  Track Assets.{' '}
                  <span className="block text-shimmer">Kill Dead Stock.</span>
                </h1>

                <p className="text-base md:text-lg leading-relaxed mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Replace sprawling spreadsheets with an intelligent register. Live QR scanning,
                  multi-role workflows, automated audit reports — all in one platform.
                </p>

                {/* CTA row */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <RouterLink to="/register" className="btn-glow inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold rounded-2xl text-base transition-all duration-300" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: '#fff', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                  >
                    Start Free — No Card Required <ArrowRightIcon className="w-4 h-4" />
                  </RouterLink>
                  <RouterLink to="/login" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold rounded-2xl text-base transition-all duration-300" style={{ color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'; }}
                  >Sign In to Your Account</RouterLink>
                </div>

                {/* Social proof */}
                <div className="flex flex-wrap items-center gap-6">
                  {[{ value: '50K+', label: 'Assets Tracked' }, { value: '200+', label: 'Organizations' }, { value: '5 Roles', label: 'Access Control' }, { value: '100%', label: 'Audit Ready' }].map(s => (
                    <div key={s.value} className="text-center">
                      <p className="text-xl font-bold font-display" style={{ color: '#818CF8' }}>{s.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Dashboard Mockup */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.22) 0%, transparent 70%)', filter: 'blur(50px)', transform: 'scale(1.3)' }} />
                <div className="relative card-bob rounded-3xl overflow-hidden" style={{ background: 'rgba(10,17,35,0.9)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(79,70,229,0.2) inset', backdropFilter: 'blur(16px)' }}>
                  {/* Beam */}
                  <div className="absolute top-0 left-0 w-1/3 h-full beam pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />

                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.7)' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.7)' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.7)' }} />
                    <span className="ml-3 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Dead Stock Register — Admin Dashboard</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Live</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Stat row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Assets', value: '1,284', change: '+12.4%', color: '#22C55E' },
                        { label: 'Dead Stock', value: '184', change: '-3.2%', color: '#F59E0B' },
                        { label: 'Pending', value: '23', change: '+5 new', color: '#F59E0B' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                          <p className="text-xl font-bold font-display text-white">{s.value}</p>
                          <p className="text-xs flex items-center gap-0.5 mt-1 font-semibold" style={{ color: s.color }}>
                            <ArrowTrendingUpIcon className="w-3 h-3" />{s.change}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Bar chart */}
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-white">Asset Lifecycle Overview</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(79,70,229,0.2)', color: '#818CF8' }}>Jul 2025</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-14">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 72, 88].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i >= 10 ? 'linear-gradient(180deg, #4F46E5 0%, #7C3AED 100%)' : 'rgba(79,70,229,0.22)', minWidth: 4 }} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Aug</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Jul</span>
                      </div>
                    </div>

                    {/* Asset table */}
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-xs font-semibold text-white">Recent Assets</p>
                        <span className="text-xs" style={{ color: '#818CF8' }}>View all →</span>
                      </div>
                      {[
                        { id: 'AST-9382', name: 'Dell XPS 15 Laptop', dept: 'IT', status: 'Active', color: '#22C55E' },
                        { id: 'AST-1082', name: 'Ergonomic Mesh Chair', dept: 'HR', status: 'Damaged', color: '#F59E0B' },
                        { id: 'AST-8849', name: 'Epson L3150 Printer', dept: 'ADMIN', status: 'Scrapped', color: '#EF4444' },
                        { id: 'AST-3371', name: 'HP ProBook 450', dept: 'IT', status: 'Dead Stock', color: '#94A3B8' },
                      ].map((a, i, arr) => (
                        <div key={a.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                          <div>
                            <p className="text-xs font-semibold text-white">{a.name}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.id} · {a.dept}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{a.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Scroll to explore</span>
            <div className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5 animate-bounce" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="w-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </section>

        {/* ═══ STATS ════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 md:px-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(124,58,237,0.05) 100%)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(79,70,229,0.07) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div ref={statsRef} className="reveal max-w-5xl mx-auto">
            <p className="text-center text-xs font-semibold mb-10 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Powering operations at scale</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-5xl md:text-6xl font-bold font-display mb-2" style={{ color: s.color }}>
                    <AnimatedCounter target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═════════════════════════════════════════════════════════ */}
        <section id="features" className="py-28 px-5 md:px-10">
          <div className="max-w-7xl mx-auto">
            <div ref={featuresRef} className="reveal text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.22)' }}>
                <SparklesIcon className="w-3.5 h-3.5" />Platform Capabilities
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-5 text-white">Built for Enterprise Operations</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>Every feature is designed around real-world asset management workflows — not just checking boxes on a requirements list.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <StaggerReveal key={f.title} index={i}>
                  <div
                    className="gradient-border p-7 rounded-2xl h-full transition-all duration-300 cursor-default"
                    style={{ backgroundColor: 'rgba(10,17,35,0.7)', backdropFilter: 'blur(12px)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = `0 24px 48px -12px ${f.color}33`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: f.bg }}>
                      <span style={{ color: f.color }}>{f.icon}</span>
                    </div>
                    <h3 className="text-white font-bold font-display text-lg mb-3">{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.description}</p>
                  </div>
                </StaggerReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-28 px-5 md:px-10" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(79,70,229,0.06) 0%, transparent 70%)' }}>
          <div className="max-w-7xl mx-auto">
            <div ref={stepsRef} className="reveal text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.22)' }}>
                <ChevronRightIcon className="w-3.5 h-3.5" />Simple 3-Step Process
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-5 text-white">Get Running in Minutes</h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>No complex setup. No months of implementation. Your team is operational on day one.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <StaggerReveal key={s.step} index={i}>
                  <div className="gradient-border p-7 rounded-2xl h-full" style={{ backgroundColor: 'rgba(10,17,35,0.7)', backdropFilter: 'blur(12px)' }}>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(124,58,237,0.15) 100%)', border: '1px solid rgba(79,70,229,0.3)' }}>
                        <span style={{ color: '#818CF8' }}>{s.icon}</span>
                      </div>
                      <span className="text-5xl font-bold font-display" style={{ color: 'rgba(79,70,229,0.35)' }}>{s.step}</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-white mb-3">{s.title}</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.description}</p>
                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)' }}>
                      <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#818CF8' }} />
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.detail}</p>
                    </div>
                  </div>
                </StaggerReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ROLES ════════════════════════════════════════════════════════════ */}
        <section id="roles" className="py-28 px-5 md:px-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto">
            <div ref={rolesRef} className="reveal text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.22)' }}>
                <UsersIcon className="w-3.5 h-3.5" />5 Built-In Roles
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-5 text-white">The Right Access for Every Person</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>Granular role-based permissions ensure every user sees exactly what they need — nothing more, nothing less.</p>
            </div>

            {/* Role selector tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {roleFeatures.map((r, i) => (
                <button key={r.role} onClick={() => setActiveRole(i)} className="p-4 rounded-2xl text-left transition-all duration-300"
                  style={{ backgroundColor: activeRole === i ? r.bg : 'rgba(255,255,255,0.03)', border: activeRole === i ? `1px solid ${r.color}40` : '1px solid rgba(255,255,255,0.07)', transform: activeRole === i ? 'translateY(-2px)' : 'translateY(0)', boxShadow: activeRole === i ? `0 8px 24px ${r.color}22` : 'none' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: activeRole === i ? r.color + '22' : 'rgba(255,255,255,0.06)' }}>
                    <UsersIcon className="w-5 h-5" style={{ color: activeRole === i ? r.color : 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <p className="text-sm font-bold font-display leading-tight" style={{ color: activeRole === i ? r.color : 'rgba(255,255,255,0.6)' }}>{r.role}</p>
                </button>
              ))}
            </div>

            {/* Active role permissions */}
            <div className="gradient-border rounded-2xl p-8" style={{ backgroundColor: 'rgba(10,17,35,0.8)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: roleFeatures[activeRole].bg }}>
                  <UsersIcon className="w-6 h-6" style={{ color: roleFeatures[activeRole].color }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-white">{roleFeatures[activeRole].role}</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Capabilities & permissions</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
                {roleFeatures[activeRole].perms.map(perm => (
                  <div key={perm} className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: roleFeatures[activeRole].bg, border: `1px solid ${roleFeatures[activeRole].color}22` }}>
                    <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: roleFeatures[activeRole].color }} />
                    <span className="text-sm font-medium text-white">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═════════════════════════════════════════════════════ */}
        <section id="testimonials" className="py-28 px-5 md:px-10" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.07) 0%, transparent 70%)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto">
            <div ref={testimonialsRef} className="reveal text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.22)' }}>
                <CheckCircleIcon className="w-3.5 h-3.5" />Trusted by Operations Teams
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4 text-white">Real Results, Real Teams</h2>
              <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>See how organizations transformed their asset management.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <StaggerReveal key={t.name} index={i}>
                  <div className="gradient-border p-7 rounded-2xl h-full flex flex-col transition-transform duration-300" style={{ backgroundColor: 'rgba(10,17,35,0.7)', backdropFilter: 'blur(12px)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                  >
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, si) => (
                        <svg key={si} className="w-4 h-4" fill="#FBBF24" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 self-start" style={{ backgroundColor: t.color + '18', color: t.color, border: `1px solid ${t.color}30` }}>
                      <CheckCircleIcon className="w-3 h-3" />{t.stats}
                    </div>
                    <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: 'rgba(255,255,255,0.75)' }}>&quot;{t.quote}&quot;</p>
                    <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-display flex-shrink-0" style={{ backgroundColor: t.color + '20', color: t.color, border: `1px solid ${t.color}35` }}>{t.initials}</div>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.role} · {t.org}</p>
                      </div>
                    </div>
                  </div>
                </StaggerReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 md:px-10">
          <div className="max-w-4xl mx-auto">
            <div ref={ctaRef} className="reveal relative rounded-3xl p-12 md:p-16 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 45%, #7C3AED 100%)', boxShadow: '0 40px 80px -20px rgba(79,70,229,0.55)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 65%)' }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                  <UsersIcon className="w-3.5 h-3.5" />Join 200+ Organizations Using DSR
                </div>
                <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-5 text-white">Ready to Eliminate Dead Stock?</h2>
                <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.78)' }}>Set up your organization in minutes. Track every asset, enforce every workflow, and generate audit-ready reports — completely free to start.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <RouterLink to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300" style={{ backgroundColor: '#fff', color: '#4F46E5', textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 14px 32px rgba(0,0,0,0.35)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}
                  >Get Started Free <ArrowRightIcon className="w-4 h-4" /></RouterLink>
                  <RouterLink to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.28)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.23)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                  >Sign In to Your Account</RouterLink>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(3,7,18,0.7)' }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-14">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <BrandLogo variant="white" width={140} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>Enterprise-grade dead stock and asset management. Replacing spreadsheets with intelligent, audit-ready workflows.</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>All systems operational</span>
              </div>
            </div>

            {[
              { heading: 'Product', links: ['Asset Tracking', 'QR Workflows', 'Analytics', 'Audit Logs', 'Role Management'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press Kit', 'Contact'] },
              { heading: 'Support', links: ['Documentation', 'API Reference', 'System Status', 'Help Center', 'Security'] },
            ].map(col => (
              <div key={col.heading}>
                <p className="text-sm font-semibold text-white mb-4">{col.heading}</p>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-sm transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.85)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}
                    >{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Dead Stock Register System. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <a key={l} href="#" className="text-xs transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.3)'; }}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;