import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, CircleHelp, Clapperboard, Eye, EyeOff, LockKeyhole, Mail, MapPin, Menu, MessageCircle, Play, Search, ShieldCheck, Sparkles, Target, TrendingUp, Users, Video, X, Youtube } from 'lucide-react';
import { SiFacebook, SiTiktok, SiWhatsapp, SiYoutube } from 'react-icons/si';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis } from 'recharts';
import {
  getGetAdminSessionQueryKey,
  getGetContactSummaryQueryKey,
  getGetContactsQueryKey,
  useAdminLogin,
  useAdminLogout,
  useCreateContact,
  useDeleteContact,
  useGetAdminSession,
  useGetContactSummary,
  useGetContacts,
  useUpdateContactStatus,
} from '@workspace/api-client-react';
import type { Contact, ContactInput } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const queryClient = new QueryClient();
const primaryPhone = '+92 311 0380241';
const secondaryPhone = '+92 343 9360383';
const businessEmail = 'skmediamonetization@gmail.com';
const businessAddress = 'Opposite Daewoo Terminal, IT Park First Floor, Dera Ismail Khan';
const whatsapp = 'https://wa.me/923110380241';
const promptCategories = ['All Categories', 'Animal & Pets', 'Art & Animation', 'ASMR & Satisfying', 'Comedy & Entertainment', 'DIY & Crafts', 'Emotional & Inspirational', 'Fantasy & Sci-Fi', 'Food & Cooking', 'Historical & Nostalgia', 'Kids & Family', 'Nature & Wildlife', 'Sports & Action'];
const promptCards = [
  { title: 'Hyper-real aerial wildlife predator-prey chase engine', category: 'Nature & Wildlife', access: 'Premium', image: 'photo-1516026672322-bc52d61a55d5', createdAt: 8 },
  { title: 'Private dream homestead / luxury rural estate content engine', category: 'Nature & Wildlife', access: 'Premium', image: 'photo-1449158743715-0a90ebb6d2d8', createdAt: 7 },
  { title: 'Hyper-real colossal wildlife aerial sighting engine', category: 'Historical & Nostalgia', access: 'Premium', image: 'photo-1511497584788-876760111969', createdAt: 6 },
  { title: 'Cinematic comfort-food recipe reel', category: 'Food & Cooking', access: 'Free', image: 'photo-1547592180-85f173990554', createdAt: 5 },
  { title: 'Tiny home transformation story', category: 'DIY & Crafts', access: 'Free', image: 'photo-1484154218962-a197022b5858', createdAt: 4 },
  { title: 'Dreamlike fantasy-world reveal', category: 'Fantasy & Sci-Fi', access: 'Premium', image: 'photo-1518709268805-4e9042af9f23', createdAt: 3 },
  { title: 'Satisfying macro restoration loop', category: 'ASMR & Satisfying', access: 'Free', image: 'photo-1470252649378-9c29740c9fa8', createdAt: 2 },
  { title: 'Animal rescue: an emotional short-film arc', category: 'Animal & Pets', access: 'Premium', image: 'photo-1450778869180-41d0601e046e', createdAt: 1 },
];
function promptSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const publicSiteUrl = import.meta.env.VITE_SITE_URL?.trim()
  ? new URL(import.meta.env.VITE_SITE_URL.trim()).origin
  : '';

function usePageMeta(title: string, description: string, noIndex = false) {
  useEffect(() => {
    document.title = title;
    const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = description;
    const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robotsMeta) robotsMeta.content = noIndex ? 'noindex, nofollow' : 'index, follow';
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description;
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = title;
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.content = description;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (publicSiteUrl && !noIndex) {
      const pageUrl = new URL(window.location.pathname, `${publicSiteUrl}/`).toString();
      const canonicalLink = canonical ?? document.head.appendChild(document.createElement('link'));
      canonicalLink.rel = 'canonical';
      canonicalLink.href = pageUrl;
      const ogUrlMeta = ogUrl ?? document.head.appendChild(document.createElement('meta'));
      ogUrlMeta.setAttribute('property', 'og:url');
      ogUrlMeta.content = pageUrl;
    } else {
      canonical?.remove();
      ogUrl?.remove();
    }
  }, [title, description, noIndex]);
}

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-3 ${light ? 'text-white' : 'text-[#171717]'} no-underline`} data-testid="link-brand">
    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-[13px] font-extrabold tracking-[-.1em] text-black">SK</span>
    <span className="leading-[1.05]"><b className="block font-display text-[15px] font-extrabold tracking-[-.04em]">SK MEDIA</b><span className="text-[9px] font-bold tracking-[.16em] opacity-60">MONETIZATION</span></span>
  </Link>;
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [hiddenOnScrollDown, setHiddenOnScrollDown] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'register' | null>(null);
  const [path] = useLocation();
  const links = [['Services', '/services']];
  const activePromptPath = path === '/sk-prompt-party';
  useEffect(() => {
    let previousScrollY = window.scrollY;
    let latestScrollY = previousScrollY;
    let animationFramePending = false;
    const handleScroll = () => {
      latestScrollY = window.scrollY;
      if (animationFramePending) return;
      animationFramePending = true;
      window.requestAnimationFrame(() => {
        const scrollDelta = latestScrollY - previousScrollY;
        if (latestScrollY <= 80) {
          setHiddenOnScrollDown(false);
          previousScrollY = latestScrollY;
        } else if (Math.abs(scrollDelta) > 6) {
          setHiddenOnScrollDown(latestScrollY > 80 && scrollDelta > 0);
          previousScrollY = latestScrollY;
        }
        animationFramePending = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const openAuthDialog = (mode: 'login' | 'register') => {
    setAuthDialogMode(mode);
    setAccountMenuOpen(false);
    setMobileAccountOpen(false);
    setOpen(false);
  };
  return <>
    <div className="bg-[#f5f4ef]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-2.5 md:px-8">
        <span className="order-2 ml-auto inline-flex items-center gap-2 rounded-full border border-[#b8860b]/35 bg-[#ffd700]/[.08] px-3 py-1.5 text-[9px] font-bold tracking-[.13em] text-[#806100] md:text-[10px]"><Target size={13} className="text-[#b8860b]" /> YOUR SUCCESS IS OUR MISSION</span>
        <div className="order-1 flex items-center gap-3 text-[#6b6861]" aria-label="Social media">
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className="transition-colors hover:text-[#b8860b]" data-testid="link-social-facebook"><SiFacebook size={14} /></a>
          <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok" className="transition-colors hover:text-[#b8860b]" data-testid="link-social-tiktok"><SiTiktok size={14} /></a>
          <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube" className="transition-colors hover:text-[#b8860b]" data-testid="link-social-youtube"><SiYoutube size={16} /></a>
        </div>
      </div>
    </div>
    <header style={{ backgroundColor: '#f5f4ef', transitionDuration: hiddenOnScrollDown && !open ? '300ms' : '0ms' }} className={`sticky top-0 z-40 bg-[#f5f4ef] pt-2 transition-transform ease-out ${hiddenOnScrollDown && !open ? '-translate-y-full' : 'translate-y-0'}`}>
    <div className="mx-auto flex w-[calc(100%-1.5rem)] max-w-[1280px] items-center justify-between rounded-2xl bg-[#090909] px-5 py-2.5 text-white shadow-[0_8px_28px_rgba(0,0,0,.2)] md:rounded-full md:px-8">
      <Logo light />
      <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href} className={`line-link text-[13px] font-semibold ${path === href ? 'text-white' : 'text-white/65 hover:text-white'}`} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}>{label}</Link>)}
        <Link href="/sk-prompt-party" aria-current={activePromptPath ? 'page' : undefined} className={`line-link text-[13px] font-semibold ${activePromptPath ? 'text-white' : 'text-white/65 hover:text-white'}`} data-testid="link-nav-sk-prompt-party">SK Prompt Party</Link>
        <Link href="/sk-prompt-party/join-community" aria-current={path === '/sk-prompt-party/join-community' ? 'page' : undefined} className={`line-link text-[13px] font-semibold ${path === '/sk-prompt-party/join-community' ? 'text-white' : 'text-white/65 hover:text-white'}`} data-testid="link-nav-join-community">Join Community</Link>
        <Link href="/sk-prompt-party/share-ideas" aria-current={path === '/sk-prompt-party/share-ideas' ? 'page' : undefined} className={`line-link text-[13px] font-semibold ${path === '/sk-prompt-party/share-ideas' ? 'text-white' : 'text-white/65 hover:text-white'}`} data-testid="link-nav-ideas">Ideas</Link>
      </nav>
      <div className="hidden items-center gap-4 md:flex">
        <div className="relative" onMouseEnter={() => setAccountMenuOpen(true)} onMouseLeave={() => setAccountMenuOpen(false)}>
          <button type="button" onClick={() => setAccountMenuOpen((current) => !current)} onFocus={() => setAccountMenuOpen(true)} aria-expanded={accountMenuOpen} aria-haspopup="true" className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${path === '/login' || path === '/register' ? 'text-white' : 'text-white/65 hover:text-white'}`} data-testid="button-login-dropdown">Login <ArrowDown size={14} className={`transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} /></button>
          {accountMenuOpen && <div className="absolute right-0 top-full z-50 w-44 pt-3"><div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-2 shadow-2xl"><button type="button" onClick={() => openAuthDialog('login')} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${path === '/login' ? 'bg-[#ffd700] text-black' : 'text-white/70 hover:bg-white/5 hover:text-white'}`} data-testid="link-login-dropdown-login">Login</button><button type="button" onClick={() => openAuthDialog('register')} className={`mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm ${path === '/register' ? 'bg-[#ffd700] text-black' : 'text-white/70 hover:bg-white/5 hover:text-white'}`} data-testid="link-login-dropdown-register">Register</button></div></div>}
        </div>
        <Link href="/contact" className="btn-gold !px-5 !py-3 text-[12px]" data-testid="link-header-cta">Let’s talk <ArrowUpRight size={15} /></Link>
      </div>
      <button className="grid h-10 w-10 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="fixed inset-0 z-50 flex flex-col bg-[#080808] px-7 pb-10 pt-6 text-white md:hidden" aria-label="Mobile navigation">
      <div className="flex items-center justify-between border-b border-white/10 pb-5"><Logo light /><button className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-[#ffd700]" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div>
      <div className="my-auto">
      {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={path === href ? 'page' : undefined} className={`block border-b border-white/10 py-4 text-sm font-semibold ${path === href ? 'text-white' : 'text-white/65'}`} data-testid={`link-mobile-${label.toLowerCase().replace(' ', '-')}`}>{label}<ArrowRight className="float-right" size={16} /></Link>)}
      <Link href="/sk-prompt-party" onClick={() => setOpen(false)} aria-current={activePromptPath ? 'page' : undefined} className={`block border-b border-white/10 py-4 text-sm font-semibold ${activePromptPath ? 'text-white' : 'text-white/65'}`} data-testid="link-mobile-sk-prompt-party">SK Prompt Party<ArrowRight className="float-right" size={16} /></Link>
      <Link href="/sk-prompt-party/join-community" onClick={() => setOpen(false)} aria-current={path === '/sk-prompt-party/join-community' ? 'page' : undefined} className={`block border-b border-white/10 py-4 text-sm font-semibold ${path === '/sk-prompt-party/join-community' ? 'text-white' : 'text-white/65'}`} data-testid="link-mobile-join-community">Join Community<ArrowRight className="float-right" size={16} /></Link>
      <Link href="/sk-prompt-party/share-ideas" onClick={() => setOpen(false)} aria-current={path === '/sk-prompt-party/share-ideas' ? 'page' : undefined} className={`block border-b border-white/10 py-4 text-sm font-semibold ${path === '/sk-prompt-party/share-ideas' ? 'text-white' : 'text-white/65'}`} data-testid="link-mobile-ideas">Ideas<ArrowRight className="float-right" size={16} /></Link>
      <div className="border-b border-white/10 py-4">
        <button type="button" className="flex w-full items-center justify-between text-sm font-semibold" onClick={() => setMobileAccountOpen((current) => !current)} aria-expanded={mobileAccountOpen}><span>Login</span><ArrowDown size={14} className={`transition-transform ${mobileAccountOpen ? 'rotate-180' : ''}`} /></button>
        {mobileAccountOpen && <div className="mt-3 grid gap-2 pl-3"><button type="button" onClick={() => openAuthDialog('login')} className="rounded-lg border border-white/10 px-3 py-2.5 text-left text-sm text-white/70" data-testid="link-mobile-login">Login</button><button type="button" onClick={() => openAuthDialog('register')} className="rounded-lg border border-white/10 px-3 py-2.5 text-left text-sm text-white/70" data-testid="link-mobile-register">Register</button></div>}
      </div>
      <Link href="/contact" onClick={() => setOpen(false)} className="btn-gold mt-4 w-full">Let’s talk <ArrowUpRight size={15} /></Link>
      </div>
      <div className="flex items-center gap-5 text-white/50"><a href="https://www.facebook.com/" aria-label="Facebook"><SiFacebook /></a><a href="https://www.tiktok.com/" aria-label="TikTok"><SiTiktok /></a><a href="https://www.youtube.com/" aria-label="YouTube"><SiYoutube /></a><span className="ml-auto text-[10px] tracking-[.16em]">SK MEDIA · CREATOR FIRST</span></div>
    </nav>}
    <Dialog open={authDialogMode !== null} onOpenChange={(isOpen) => { if (!isOpen) setAuthDialogMode(null); }}>
      <DialogContent className="max-w-[520px] border-white/10 bg-[#090909] p-0 text-white sm:rounded-2xl">
        <DialogTitle className="sr-only">{authDialogMode === 'register' ? 'Create your account' : 'Member login'}</DialogTitle>
        <DialogDescription className="sr-only">SK Prompt Party member access.</DialogDescription>
        <div className="max-h-[85vh] overflow-y-auto p-6 md:p-9">
          {authDialogMode && <MemberAuthForm register={authDialogMode === 'register'} onModeChange={setAuthDialogMode} />}
        </div>
      </DialogContent>
    </Dialog>
    </header>
  </>;
}

function Footer() {
  return <footer className="bg-[#090909] text-white">
    <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
      <div><Logo light /><p className="mt-5 max-w-sm text-sm leading-6 text-white/55">We help creators build the business behind the content. Based in Pakistan. Working everywhere.</p></div>
      <div><div className="eyebrow text-[#ffd700]">Explore</div><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/services">Services</Link><Link href="/about">Our story</Link><Link href="/sk-prompt-party">SK Prompt Party</Link><Link href="/contact">Contact</Link></div></div>
      <div><div className="eyebrow text-[#ffd700]">Say hello</div><div className="mt-4 grid gap-3 text-sm text-white/70"><div className="flex items-center gap-1 whitespace-nowrap"><a href={`tel:${primaryPhone.replaceAll(' ', '')}`}>{primaryPhone}</a><span>/</span><a href={`tel:${secondaryPhone.replaceAll(' ', '')}`}>{secondaryPhone}</a></div><a href={`mailto:${businessEmail}`}>{businessEmail}</a><span>{businessAddress}</span></div></div>
    </div>
    <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-3 border-t border-white/10 px-6 py-5 text-[11px] text-white/40 md:flex-row md:px-8"><span>© 2026 SK Media Monetization. Built for the next generation of creators.</span><span>Creator-first. Results-focused.</span></div>
  </footer>;
}

function ContactForm({ compact = false }: { compact?: boolean }) {
  const createContact = useCreateContact();
  const [sent, setSent] = useState<{ id: string; notification: string } | null>(null);
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setSent(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const input: ContactInput = {
      name: String(form.get('name') || ''), email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''), platform: String(form.get('platform') || 'YouTube') as ContactInput['platform'],
      message: String(form.get('message') || ''),
    };
    createContact.mutate({ data: input }, {
      onSuccess: (result) => { setSent({ id: result.id, notification: result.emailNotification }); formElement.reset(); },
      onError: () => setError('We couldn’t send that just now. Please try again, or message us on WhatsApp.'),
    });
  };
  if (sent) return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-400/30 bg-[#101713] p-6 text-white" data-testid="status-contact-success">
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-emerald-400 text-[#08120b]"><Check size={20} /></motion.div>
    <h3 className="font-display text-xl font-extrabold">You’re on our radar.</h3><p className="mt-2 text-sm leading-6 text-white/65">Thanks for reaching out. Our team will review your note and follow up. Reference <span className="font-mono">{sent.id.slice(0, 8)}</span>.</p>
    {sent.notification !== 'sent' && <p className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-[#6c5810]" data-testid="status-email-notification">{sent.notification === 'not_configured' ? 'Your request was received. Email notifications are currently unavailable, but we have your details.' : 'Your request was received. We could not send an email notification, but our team has your details.'}</p>}
  </motion.div>;
  return <form className="grid gap-4" onSubmit={submit} data-testid="form-contact">
    <div className={compact ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
      <label className="grid gap-2 text-xs font-semibold">Your name<input className="form-field text-sm" name="name" minLength={2} maxLength={100} required placeholder="Name ..." data-testid="input-contact-name" /></label>
      <label className="grid gap-2 text-xs font-semibold">Email address<input className="form-field text-sm" name="email" type="email" maxLength={254} required placeholder="you@example.com" data-testid="input-contact-email" /></label>
      <label className="grid gap-2 text-xs font-semibold">WhatsApp number<input className="form-field text-sm" name="phone" type="tel" minLength={7} maxLength={32} required placeholder="+92 3XX XXXXXXX" data-testid="input-contact-phone" /></label>
      <label className="grid gap-2 text-xs font-semibold">Main platform<select className="form-field text-sm" name="platform" defaultValue="YouTube" data-testid="select-contact-platform"><option>YouTube</option><option>Facebook</option><option>TikTok</option><option>Other</option></select></label>
    </div>
    <label className="grid gap-2 text-xs font-semibold">What are you building? <span className="font-normal text-black/45">Optional</span><textarea className="form-field min-h-[110px] resize-y text-sm" name="message" maxLength={2000} placeholder="A little about your content and where you want to take it…" data-testid="input-contact-message" /></label>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="status-contact-error">{error}</p>}
    <button className="btn-gold w-full sm:w-fit" type="submit" disabled={createContact.isPending} data-testid="button-contact-submit">{createContact.isPending ? 'Sending your note…' : 'Send message'} {createContact.isPending ? <span className="h-4 w-4 animate-pulse rounded-full bg-black/30" /> : <ArrowRight size={16} />}</button>
    <p className="text-[11px] text-white/40">No pressure. No spam. Just a useful first conversation.</p>
  </form>;
}

function PlatformMark({ platform }: { platform: string }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-[#ffd700]">{platform === 'YouTube' ? <Youtube size={20} /> : platform === 'Facebook' ? <span className="font-display text-xl font-extrabold">f</span> : <Video size={19} />}</span>;
}

function EarningsCard() {
  const earnings = [{ month: 'Jan', value: 9200, bonus: 1800 }, { month: 'Feb', value: 11800, bonus: 2400 }, { month: 'Mar', value: 10500, bonus: 2100 }, { month: 'Apr', value: 15400, bonus: 3200 }, { month: 'May', value: 14300, bonus: 2800 }, { month: 'Jun', value: 19200, bonus: 4100 }, { month: 'Jul', value: 17800, bonus: 3800 }, { month: 'Aug', value: 24560, bonus: 5200 }];
  return <div className="relative mx-auto w-full max-w-[470px] rotate-[1deg] rounded-[24px] border border-white/15 bg-[#161616] p-5 text-white shadow-[0_32px_90px_rgba(0,0,0,.45)] md:p-7">
    <div className="flex items-start justify-between"><div><div className="text-[11px] font-medium text-white/45">Creator earnings overview</div><div className="mt-2 font-display text-[32px] font-extrabold tracking-[-.06em] md:text-[40px]">$24,560.00</div><div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#ffd700]/15 px-2.5 py-1 text-[10px] font-bold text-[#ffd700]"><TrendingUp size={12} /> +18.6% <span className="font-normal text-white/55">this month</span></div></div><span className="rounded-lg bg-white/5 p-2 text-[#ffd700]"><BarChart3 size={18} /></span></div>
    <div className="mt-6 h-[155px] w-full" role="img" aria-label="Sample monthly creator earnings chart">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={earnings} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
        <defs><linearGradient id="earningsGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd700" /><stop offset="100%" stopColor="#b8860b" /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.08)" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,.38)', fontSize: 9 }} />
        <ChartTooltip cursor={{ fill: 'rgba(255,215,0,.08)' }} contentStyle={{ background: '#101010', border: '1px solid rgba(255,215,0,.3)', borderRadius: 10, color: '#fff', fontSize: 11 }} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Earnings']} />
        <Bar dataKey="value" name="Ad revenue" fill="url(#earningsGold)" radius={[4, 4, 0, 0]} maxBarSize={20} />
        <Bar dataKey="bonus" name="Creator bonuses" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart></ResponsiveContainer>
    </div>
    <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4">
      {[['YouTube', '$16,840'], ['Facebook', '$5,220'], ['TikTok', '$2,500']].map(([p, value]) => <div className="px-2 first:pl-0" key={p}><div className="text-[9px] text-white/40">{p}</div><div className="mt-1 text-xs font-bold md:text-sm">{value}</div></div>)}
    </div>
  </div>;
}

function LaptopMockup() {
  return <div className="laptop-visual relative mx-auto w-full max-w-[560px] px-3 pb-4 md:px-7">
    <div className="laptop-frame">
      <EarningsCard />
    </div>
    <div className="laptop-base" aria-hidden="true"><span /></div>
    <motion.div className="social-float social-float-facebook" aria-hidden="true" animate={{ y: [0, -9, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}><SiFacebook size={20} /></motion.div>
    <motion.div className="social-float social-float-tiktok" aria-hidden="true" animate={{ y: [0, 8, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}><SiTiktok size={19} /></motion.div>
    <motion.div className="social-float social-float-youtube" aria-hidden="true" animate={{ y: [0, -7, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}><SiYoutube size={22} /></motion.div>
  </div>;
}

const trustPoints = [
  { title: 'Professional Expert Team', note: 'Practical guidance from people who know the creator business.', icon: Users },
  { title: 'Reliable', note: 'Thoughtful support with clear expectations at every step.', icon: ShieldCheck },
  { title: 'Strategic', note: 'Smart, organic growth built around your audience and content.', icon: Target },
  { title: 'Results Driven', note: 'Focused on measurable progress and outcomes that matter.', icon: TrendingUp },
];

function TrustFeatures() {
  return <section className="section-pad bg-[#080808] text-white">
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-8 text-center"><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">A partner for the work behind the views.</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map(({ title, note, icon: Icon }, index) => <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45, delay: index * .08 }} whileHover={{ y: -6 }} className="trust-card rounded-xl border border-white/10 bg-white/[.03] p-5" data-testid={`card-trust-${title.toLowerCase().replaceAll(' ', '-')}`}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><Icon size={19} /></span>
          <h3 className="mt-5 font-display text-[16px] font-bold">{title}</h3>
          <p className="mt-2 text-xs leading-5 text-white/55">{note}</p>
        </motion.article>)}
      </div>
    </div>
  </section>;
}

const services = [
  { no: '01', title: 'YouTube monetization', desc: 'Get to partner status, unlock revenue, and make every upload work harder.', icon: Youtube, items: ['YPP eligibility roadmap', 'Channel & content audit', 'AdSense setup guidance'] },
  { no: '02', title: 'Facebook monetization', desc: 'Build a stronger presence and turn your videos into a dependable income stream.', icon: Users, items: ['In-stream ads readiness', 'Stars & fan support setup', 'Rights and policy guidance'] },
  { no: '03', title: 'TikTok growth & earnings', desc: 'Create with a point of view, grow an audience, and find the right creator rewards.', icon: Video, items: ['Account health review', 'Content growth plan', 'Brand deal positioning'] },
  { no: '04', title: 'Content strategy', desc: 'A clear creative direction that helps your content reach the right people.', icon: Clapperboard, items: ['Audience & niche mapping', 'Format and publishing plan', 'Performance-led iteration'] },
];

function ServiceGrid({ detailed = false }: { detailed?: boolean }) {
  return <div className="grid gap-4 md:grid-cols-2">
    {services.map(({ no, title, desc, icon: Icon, items }, index) => <motion.article id={`service-${no}`} key={no} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45, delay: index * .07 }} whileHover={{ y: -5 }} className="service-card rounded-xl border border-white/10 border-t-[3px] border-t-[#d4af37] bg-[#111] p-6 md:p-8">
      <div className="flex items-center justify-between"><span className="eyebrow text-white/35">{no} / Service</span><span className="service-icon grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><Icon size={18} /></span></div>
      <h3 className="mt-8 font-display text-[25px] font-extrabold tracking-[-.05em]">{title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-black/60">{desc}</p>
      {detailed && <ul className="mt-5 grid gap-2">{items.map(item => <li key={item} className="flex items-center gap-2 text-xs text-black/70"><Check size={14} className="text-[#9b7b00]" />{item}</li>)}</ul>}
      <Link href="/contact" className="line-link mt-6 inline-flex items-center gap-2 text-xs font-bold" data-testid={`link-service-${no}`}>Explore the service <ArrowUpRight size={14} /></Link>
    </motion.article>)}
  </div>;
}

const faqs = [
  ['Do I need a large following to work with you?', 'Not at all. We meet you where you are. We’ll look at your content, goals, and platform eligibility, then map the most sensible next step.'],
  ['Which platforms do you support?', 'We work across YouTube, Facebook, and TikTok, with content strategy that can support your wider creator presence too.'],
  ['Can you guarantee monetization or earnings?', 'No one can responsibly guarantee platform approval or a specific income. We offer experienced guidance, clear next steps, and hands-on support—without promises that depend on platform decisions.'],
  ['How does the first conversation work?', 'Send a short note through the form or WhatsApp. We’ll learn about your channel, answer your questions, and recommend a path that makes sense for you.'],
];
function FAQ() {
  return <div className="divide-y divide-black/15 border-y border-black/15">{faqs.map(([q,a], i) => <details className="faq-item py-5" key={q} open={i === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[16px] font-bold tracking-[-.03em] md:text-lg">{q}<span className="faq-mark grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/20"><span className="text-lg leading-none">+</span></span></summary><p className="max-w-2xl pt-4 pr-12 text-sm leading-6 text-black/60">{a}</p></details>)}</div>;
}

function Landing() {
  usePageMeta(
    'SK Media Monetization | Turn Your Passion Into Profit',
    'SK Media Monetization helps creators in Pakistan and beyond earn from YouTube, Facebook, and TikTok with expert guidance and content strategy at every stage.',
  );
  return <div className="site-shell grain">
    <Header />
    <main>
      <section className="relative overflow-hidden bg-[#090909] text-white">
        <div className="hero-grid absolute inset-0 opacity-40" /><div className="absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-[#ffd700]/[.08] blur-[100px]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-6 pb-20 pt-16 md:grid-cols-[1.04fr_.96fr] md:px-10 md:pb-28 md:pt-24">
          <div className="reveal">
            <h1 className="mt-4 font-display text-[clamp(44px,7vw,82px)] font-extrabold uppercase leading-[.91] tracking-[-.075em]"><span className="text-[1.08em] text-[#ffd700]">SK MEDIA</span><br /><span className="text-white">MONETIZATION</span></h1>
            <p className="mt-6 inline-flex max-w-[490px] rounded-full border border-[#ffd700]/45 bg-[#ffd700]/[.055] px-4 py-2.5 font-display text-sm font-bold leading-6 text-white md:text-base">WE HELP YOU EARN FROM WHAT YOU LOVE!</p>
            <p className="mt-3 max-w-[490px] text-[15px] leading-7 text-white/60 md:text-[17px]">We help YouTube, Facebook, and TikTok creators turn their content into a stronger, more sustainable business.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: .98 }} href="#contact" className="btn-gold" data-testid="link-hero-start">Contact Us Now <ArrowRight size={16} /></motion.a><a href="#services" className="btn-outline border-white/30 text-white" data-testid="link-hero-services">See how we help <ArrowDown size={15} /></a></div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-[11px] text-white/45"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#ffd700]" /> Platform policy-aware</span><span className="inline-flex items-center gap-2"><Users size={15} className="text-[#ffd700]" /> Creator-first guidance</span><span className="inline-flex items-center gap-2"><MapPin size={15} className="text-[#ffd700]" /> Proudly based in Pakistan</span></div>
          </div>
          <div className="reveal reveal-delay-1"><LaptopMockup /><p className="mt-5 text-center text-[10px] text-white/35">A sample creator earnings overview. Results vary by channel and platform.</p></div>
        </div>
        <div className="relative border-t border-white/10 py-4">
          <div className="marquee flex w-max items-center gap-12 whitespace-nowrap text-[10px] font-bold tracking-[.18em] text-white/35">{Array.from({length:2},(_,i)=><span className="flex items-center gap-12" key={i}><span>YOUTUBE</span><span className="text-[#ffd700]">✳</span><span>FACEBOOK</span><span className="text-[#ffd700]">✳</span><span>TIKTOK</span><span className="text-[#ffd700]">✳</span><span>CREATOR STRATEGY</span><span className="text-[#ffd700]">✳</span></span>)}</div>
        </div>
        </section>
      <TrustFeatures />
      <section className="section-pad bg-[#f8f7f1]">
        <Reveal><div className="mx-auto grid max-w-[1180px] gap-10">
          <div className="text-center"><h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-.06em] md:text-5xl">Turn your audience into an opportunity.</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8"><div className="border-l-2 border-[#ffd700] pl-5"><span className="font-display text-3xl font-extrabold">01</span><h3 className="mt-2 font-bold">Know what’s possible</h3><p className="mt-2 text-sm leading-6 text-black/55">We review your channel and translate platform rules into a practical path forward.</p></div><div className="border-l-2 border-[#ffd700] pl-5"><span className="font-display text-3xl font-extrabold">02</span><h3 className="mt-2 font-bold">Build with intention</h3><p className="mt-2 text-sm leading-6 text-black/55">A focused content and monetization strategy—built around your voice, not a template.</p></div></div>
        </div></Reveal>
      </section>
      <section id="services" className="section-pad bg-[#e9e7df]">
        <div className="mx-auto max-w-[1180px]"><div className="mb-9 flex flex-col items-center gap-4 text-center"><div><h2 className="mt-3 whitespace-nowrap font-display text-[clamp(24px,4vw,48px)] font-extrabold tracking-[-.06em]">The business behind the post.</h2></div><Link href="/services" className="line-link inline-flex items-center gap-2 text-sm font-bold" data-testid="link-all-services">All services <ArrowRight size={15} /></Link></div><ServiceGrid /></div>
      </section>
      <section className="section-pad relative isolate overflow-hidden bg-[#ffd700]">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-[#d4af37]/25 bg-gradient-to-br from-[#171717] via-[#0b0b0b] to-[#111] px-6 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:px-10 sm:py-16 lg:px-16">
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="mx-auto mt-6 max-w-5xl whitespace-nowrap font-display text-[clamp(1.3rem,5.6vw,3.5rem)] font-extrabold leading-tight tracking-[-.065em]">Creators First. <span className="text-[#ffd700]">Growth Always.</span></h2>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-white/65 md:text-lg">The creator economy is moving fast in Pakistan and beyond. We started SK Media to make the business side feel less intimidating—and the creative side more sustainable.</p>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/45 md:text-base">We help you understand your options, strengthen your content foundation, and make confident decisions about what comes next. No smoke and mirrors—just people in your corner.</p>
            <div className="mx-auto mt-9 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4"><Users className="shrink-0 text-[#ffd700]" size={19} /><span className="text-sm font-semibold text-white/80">Guidance built around you</span></div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4"><ShieldCheck className="shrink-0 text-[#ffd700]" size={19} /><span className="text-sm font-semibold text-white/80">Clear, honest advice</span></div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4"><TrendingUp className="shrink-0 text-[#ffd700]" size={19} /><span className="text-sm font-semibold text-white/80">A sustainable way forward</span></div>
            </div>
            <Link href="/about" className="btn-gold mt-9" data-testid="link-story">Meet SK Media <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </section>
      <section className="section-pad bg-[#f8f7f1]">
        <div className="mx-auto max-w-[1180px]"><div className="mb-10 text-center"><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">Clarity looks good on you.</h2></div>
        <div className="grid gap-8 border-y border-black/15 py-8 md:grid-cols-3">{[['Your own starting point','Every channel is different. Your next steps should be, too.'],['Straight answers','We’ll explain what platforms look for and what you can realistically expect.'],['A partner, not a pitch','We care about the work after the first call as much as the first call itself.']].map(([title, description])=><article key={title}><h3 className="font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{description}</p></article>)}</div></div>
      </section>
      <section className="section-pad bg-[#111] text-white">
        <div className="mx-auto max-w-[1180px]"><div className="mb-9 text-center"><h2 className="mt-4 whitespace-nowrap font-display text-[clamp(1.35rem,5.5vw,3rem)] font-extrabold tracking-[-.06em]">Expert Guidance for Creators</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/45">Illustrative testimonial placeholders. Replace these with approved creator feedback before publishing.</p></div><div className="grid gap-4 sm:grid-cols-2"><blockquote className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><div className="text-[#ffd700]">★★★★★</div><p className="mt-5 font-display text-lg font-semibold leading-7">“The first time someone explained monetization without making it feel like a maze.”</p><footer className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">Placeholder creator feedback <span className="text-white/25">· YouTube</span></footer></blockquote><blockquote className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><div className="text-[#ffd700]">★★★★★</div><p className="mt-5 font-display text-lg font-semibold leading-7">“Practical, honest and genuinely invested in helping me get the foundations right.”</p><footer className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">Placeholder creator feedback <span className="text-white/25">· Facebook</span></footer></blockquote></div></div>
      </section>
      <section className="section-pad bg-[#e9e7df]">
        <div className="mx-auto max-w-[1180px]"><div className="mb-9 text-center"><h2 className="mt-4 whitespace-nowrap font-display text-[clamp(1.35rem,5.5vw,3rem)] font-extrabold tracking-[-.06em]">Your Questions, Answered Clearly</h2><p className="mt-4 text-sm leading-6 text-black/55">Still deciding if we’re the right fit? Start here.</p><Link href="/contact" className="line-link mt-5 inline-flex items-center gap-2 text-sm font-bold">Ask us directly <ArrowRight size={15} /></Link></div><div className="mx-auto max-w-4xl"><FAQ /></div></div>
      </section>
      <section id="contact" className="section-pad bg-[#f8f7f1]">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><h2 className="mt-4 font-display text-4xl font-extrabold leading-[.98] tracking-[-.06em] md:text-6xl">Let’s make your content work harder.</h2><p className="mt-5 max-w-md text-sm leading-6 text-black/60">Tell us where you’re at. We’ll help you find the right next step—whether you’re just starting or ready to scale.</p><div className="mt-8 flex items-center gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="btn-outline border-black/25 text-sm" data-testid="link-whatsapp"><MessageCircle size={16} /> WhatsApp us</a><span className="text-xs text-black/45">Prefer a direct reply? Message us on WhatsApp.</span></div></div>
          <div className="rounded-2xl border border-black/10 bg-white/55 p-5 md:p-8"><ContactForm compact /></div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}

function PageHero({ kicker, title, intro, centered = false }: { kicker: string; title: ReactNode; intro: string; centered?: boolean }) {
  return <section className="bg-[#090909] px-6 py-16 text-white md:px-10 md:py-24"><div className={`mx-auto max-w-[1180px] ${centered ? 'text-center' : ''}`}><div className="eyebrow text-[#ffd700]">{kicker}</div><h1 className={`mt-5 max-w-4xl font-display text-[clamp(45px,8vw,86px)] font-extrabold leading-[.94] tracking-[-.07em] ${centered ? 'mx-auto' : ''}`}>{title}</h1><p className={`mt-6 max-w-2xl text-base leading-7 text-white/55 ${centered ? 'mx-auto' : ''}`}>{intro}</p></div></section>;
}
function AboutPage() {
  usePageMeta(
    'About SK Media Monetization | Creator-First Guidance',
    'Learn how SK Media Monetization supports YouTube, Facebook, and TikTok creators with practical guidance, content strategy, and a sustainable business focus.',
  );
  const teamMembers = [
    { name: 'Creator Strategy', role: 'Strategy & planning', description: 'A thoughtful plan shaped around your channel, audience, and goals.', image: 'photo-1500648767791-00dcc994a43e' },
    { name: 'Monetization Guidance', role: 'Platform readiness', description: 'Clear guidance to understand monetization options and platform requirements.', image: 'photo-1534528741775-53994a69daeb' },
    { name: 'YouTube Support', role: 'Channel growth', description: 'Practical next steps to build a stronger foundation for your channel.', image: 'photo-1506794778202-cad84cf45f1d' },
    { name: 'Facebook Growth', role: 'Audience strategy', description: 'Ideas to help creators strengthen their presence and reach.', image: 'photo-1544005313-94ddf0286df2' },
    { name: 'TikTok Planning', role: 'Content direction', description: 'Focused support to make your content and goals work together.', image: 'photo-1507003211169-0a1dd7228f2d' },
    { name: 'Creator Support', role: 'Ongoing guidance', description: 'A clear, creator-first partner as your work and ambitions grow.', image: 'photo-1508214751196-bcfd4ca60f91' },
  ];
  const [activeTeamMember, setActiveTeamMember] = useState(0);
  const activeMember = teamMembers[activeTeamMember];
  return <><Header /><PageHero kicker="A different kind of partner" title={<>Creators deserve<br />to be <span className="text-[#ffd700]">seen.</span></>} intro="SK Media Monetization exists to help creators move from making content to building something sustainable around it." centered />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-2 lg:gap-16"><div><div className="eyebrow text-[#826900]">Our story</div><h2 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-.06em] md:text-5xl">Built for the people behind the posts.</h2><div className="mt-6 max-w-xl space-y-4 text-[15px] leading-7 text-black/65"><p>Creators are building culture, communities, and businesses every day. But the rules around platform monetization can feel opaque, and the advice available often skips the human part.</p><p>Our focus is making those next steps easier to understand. From platform readiness to content strategy, we offer practical guidance with respect for what makes each creator different.</p><p>We’re based in Pakistan, built for a global creator landscape, and committed to earning trust one clear conversation at a time.</p></div></div><div className="relative overflow-hidden rounded-[28px] border border-[#d4af37]/30 bg-[#111] shadow-[0_24px_70px_rgba(0,0,0,0.38)]"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85" alt="Creators collaborating on ideas and content strategy" className="aspect-[4/3] w-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5 sm:p-7"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ffd700] shadow-[0_0_18px_rgba(255,215,0,0.7)]" /><span className="text-sm font-semibold tracking-wide text-white sm:text-base">Creator-first. Built for what’s next.</span></div></div></div></section>
    <section className="section-pad bg-[#ffd700]"><div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-2 lg:gap-16"><div className="relative overflow-hidden rounded-[28px] border border-[#d4af37]/30 bg-[#111] shadow-[0_24px_70px_rgba(0,0,0,0.38)]"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85" alt="Creator working on a laptop and building an online business" className="aspect-[4/3] w-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5 sm:p-7"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ffd700] shadow-[0_0_18px_rgba(255,215,0,0.7)]" /><span className="text-sm font-semibold tracking-wide text-white sm:text-base">Helping your work go further.</span></div></div><div><div className="eyebrow text-black/50">Our mission</div><h2 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-.06em] md:text-5xl">Make creator income feel more within reach.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-black/70">We help creators understand their options, build a healthier content foundation, and pursue monetization with confidence. The goal isn’t to make you someone else. It’s to help your work go further as you.</p></div></div></section>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1b0f2b] via-[#140b20] to-[#211034] px-6 py-20 text-white md:px-10 md:py-24"><div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" /><div className="relative mx-auto max-w-[1180px]"><div className="mb-10 text-center"><div className="eyebrow text-[#e8bdff]">Our team</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">People in your corner.</h2></div><div className="grid items-stretch gap-7 lg:grid-cols-[.8fr_1.7fr] lg:gap-10"><article className="overflow-hidden rounded-[28px] border border-fuchsia-200/15 bg-gradient-to-b from-[#321a4d] to-[#251239] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.35)] lg:max-w-[420px] lg:self-center"><div className="relative overflow-hidden rounded-[21px]"><img src={`https://images.unsplash.com/${activeMember.image}?auto=format&fit=crop&w=900&h=900&q=85`} alt={`${activeMember.name} team role portrait`} className="aspect-[4/3.6] w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#241033]/70 via-transparent to-transparent" /></div><div className="px-4 pb-4 pt-5 text-center"><div className="eyebrow text-[#e8bdff]">{activeMember.role}</div><h3 className="mt-2 font-display text-2xl font-extrabold">{activeMember.name}</h3><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/65">{activeMember.description}</p><div className="mt-5 flex justify-center gap-3"><Link href="/contact" aria-label="Contact our team" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white transition hover:border-fuchsia-200/60 hover:text-[#e8bdff]"><Mail size={16} /></Link><a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Message our team on WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white transition hover:border-fuchsia-200/60 hover:text-[#e8bdff]"><MessageCircle size={16} /></a><Link href="/contact" aria-label="More about our team" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white transition hover:border-fuchsia-200/60 hover:text-[#e8bdff]"><ArrowUpRight size={16} /></Link></div></div></article><div className="flex flex-col justify-center"><div className="mb-5 flex items-center justify-between gap-4"><p className="text-sm text-white/55">Explore the ways we support creators.</p><div className="flex gap-2"><button type="button" onClick={() => setActiveTeamMember((index) => (index - 1 + teamMembers.length) % teamMembers.length)} aria-label="Previous team profile" className="grid h-10 w-10 place-items-center rounded-full border border-fuchsia-200/20 bg-white/[.05] text-[#e8bdff] transition hover:bg-fuchsia-300/15"><ArrowRight className="rotate-180" size={17} /></button><button type="button" onClick={() => setActiveTeamMember((index) => (index + 1) % teamMembers.length)} aria-label="Next team profile" className="grid h-10 w-10 place-items-center rounded-full border border-fuchsia-200/20 bg-white/[.05] text-[#e8bdff] transition hover:bg-fuchsia-300/15"><ArrowRight size={17} /></button></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">{teamMembers.map((member, index) => <button key={member.name} type="button" onClick={() => setActiveTeamMember(index)} aria-pressed={activeTeamMember === index} aria-label={`Select ${member.name}`} className={`group overflow-hidden rounded-2xl border p-2 text-center transition duration-200 sm:p-3 ${activeTeamMember === index ? 'border-fuchsia-200/70 bg-fuchsia-300/15 shadow-[0_0_24px_rgba(217,70,239,0.12)]' : 'border-white/10 bg-white/[.035] hover:border-fuchsia-200/35 hover:bg-white/[.07]'}`}><img src={`https://images.unsplash.com/${member.image}?auto=format&fit=crop&w=500&h=500&q=80`} alt="" className="aspect-square w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" /><span className="mt-3 block truncate text-xs font-semibold text-white sm:text-sm">{member.name}</span><span className="mt-1 block truncate text-[10px] text-white/45 sm:text-xs">{member.role}</span></button>)}</div></div></div></div></section><Footer /></>;
}
function ServicesPage() {
  usePageMeta(
    'Creator Monetization Services | SK Media Monetization',
    'Explore YouTube and Facebook monetization, TikTok growth, and content strategy services tailored for creators at every stage of their channel journey.',
  );
  return <><Header /><PageHero kicker="A strategy that meets you where you are" title={<>Make your content work smarter</>} intro="Platform monetization, creator growth, and the strategy that ties it together. Practical services designed around your channel—not a cookie-cutter checklist." centered />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto max-w-[1180px]"><div className="mb-8 max-w-2xl"><div className="eyebrow text-[#826900]">Our services</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em]">A clear path, platform by platform.</h2></div><ServiceGrid detailed /></div></section>
    <section className="section-pad bg-[#111] text-white"><div className="mx-auto max-w-[1180px]"><div className="mb-10 text-center"><div className="eyebrow text-[#ffd700]">How we work together</div><h2 className="mx-auto mt-4 whitespace-nowrap font-display text-[clamp(1.3rem,5.6vw,3rem)] font-extrabold tracking-[-.06em]">Less guessing. More forward.</h2></div><div className="grid gap-4 md:grid-cols-3">{[['01','Listen','We learn about your content, audience, and ambition.'],['02','Map it','We build a focused plan from where you are right now.'],['03','Make progress','We support the next steps and adapt as your channel grows.']].map(([n,t,d])=><div key={n} className="rounded-2xl border border-white/10 bg-white/[.035] p-6 transition-colors hover:border-[#ffd700]/45"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#ffd700]/10 font-mono text-xs text-[#ffd700]">{n}</div><h3 className="mt-5 font-display text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-white/55">{d}</p></div>)}</div></div></section>
    <Footer /></>;
}

function PromptPartyPageTemplate({
  title,
  summary,
  focus,
}: {
  title: string;
  summary: string;
  focus: string[];
}) {
  usePageMeta(`${title} | SK Prompt Party`, `Explore ${title.toLowerCase()} in the SK Prompt Party creative hub for new prompts, share ideas, and creator community growth.`);

  return <><Header /><PageHero kicker="SK Prompt Party" title={<>{title}</>} intro={summary} centered />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto max-w-[1180px] rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_18px_40px_rgba(0,0,0,0.04)] md:p-12">
      <div className="mb-8 text-center"><div className="eyebrow text-[#826900]">Creative focus</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">Built to move ideas forward.</h2></div>
      <div className="grid gap-5 md:grid-cols-3">{focus.map((item) => <div key={item} className="rounded-2xl border border-black/10 bg-[#faf7f0] p-6"><h3 className="font-display text-xl font-extrabold tracking-[-.04em]">{item}</h3><p className="mt-3 text-sm leading-6 text-black/60">Use this section to organize your next prompt, creative concept, or community conversation around a clear theme.</p></div>)}</div>
    </div></section>
    <Footer /></>;
}

function AllPromptsPage() {
  usePageMeta('All Prompts | SK Prompt Party', 'Browse all SK Prompt Party creative prompts.');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeCategory, setActiveCategory] = useState('All Categories');

  const visiblePrompts = promptCards
    .filter((prompt) => activeCategory === 'All Categories' || prompt.category === activeCategory)
    .filter((prompt) => !appliedSearch || `${prompt.title} ${prompt.category}`.toLowerCase().includes(appliedSearch.toLowerCase()))
    .sort((first, second) => sortOrder === 'newest' ? second.createdAt - first.createdAt : first.createdAt - second.createdAt);

  return <><Header /><main className="min-h-[70vh] bg-[#f5f4ef] px-5 py-12 text-[#211f1b] md:px-8 md:py-16">
    <div className="mx-auto max-w-[1320px]">
      <div className="mx-auto max-w-[760px]">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchTerm.trim()); }}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search prompts…" aria-label="Search prompts" className="min-w-0 flex-1 rounded-full border border-[#d2d0ca] bg-[#f8f7f4] px-5 py-4 text-sm text-[#1b1b1b] shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none placeholder:text-[#6a655f] focus:border-[#b8b2a5]" />
          <select aria-label="Sort prompts" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')} className="rounded-full border border-[#d2d0ca] bg-[#f8f7f4] px-5 py-4 text-sm font-semibold text-[#1b1b1b] shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select>
          <button type="submit" className="rounded-full bg-black px-8 py-4 text-sm font-extrabold text-white !text-white shadow-[0_8px_22px_rgba(0,0,0,.18)] transition hover:bg-black">SEARCH</button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-3" aria-label="Filter prompts by category">
          {promptCategories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${activeCategory === category ? 'border-black bg-black text-white !text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'border-[#d2d0ca] bg-[#f8f7f4] text-[#1d1d1b] hover:border-[#bdb7ad] hover:bg-white'}`}>{category}</button>)}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visiblePrompts.map((prompt) => <article key={prompt.title} className="flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-[0_12px_30px_rgba(33,31,27,.1)]">
          <img src={`https://images.unsplash.com/${prompt.image}?auto=format&fit=crop&w=800&q=85`} alt={prompt.title} loading="lazy" className="aspect-[1.8/1] w-full object-cover" />
          <div className="flex min-h-[190px] flex-1 flex-col p-4"><span className="prompt-category-badge w-fit rounded-full bg-black px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">{prompt.category}</span><h2 className="mt-3 font-display text-base font-bold uppercase leading-6">{prompt.title}</h2><Link href={`/sk-prompt-party/prompt/${promptSlug(prompt.title)}`} className="mt-auto inline-flex w-full justify-center rounded-full border border-black bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-black hover:text-white">VIEW PROMPT</Link></div>
        </article>)}
      </div>
      {visiblePrompts.length === 0 && <div className="py-16 text-center text-sm text-black/55">No prompts match your filters. Try a different search or category.</div>}
    </div>
  </main><Footer /></>;
}

function ShareIdeasPage() {
  usePageMeta('Share Creator Ideas | SK Prompt Party', 'Explore creative ideas shared by the SK Prompt Party community and submit an idea of your own.');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [ideas, setIdeas] = useState([
    { id: 1, title: 'A day in the life — but told through tiny details', category: 'Storytelling', description: 'Capture small moments and layer them into a warm, cinematic creator story.', date: 'Oct 05, 2026', status: 'Community pick' },
    { id: 2, title: 'What if everyday objects had a secret life?', category: 'Short-form video', description: 'Use visual transitions to turn ordinary objects into surprising characters.', date: 'Oct 04, 2026', status: 'New idea' },
    { id: 3, title: 'One location, three different moods', category: 'Visual concept', description: 'Revisit the same place at different times, with distinct lighting and sound.', date: 'Oct 03, 2026', status: 'In discussion' },
    { id: 4, title: 'Followers choose the next chapter', category: 'Audience engagement', description: 'Let audience comments guide the next episode in a continuing series.', date: 'Oct 02, 2026', status: 'Community pick' },
  ]);

  const submitIdea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newIdea = {
      id: Date.now(),
      title: String(formData.get('ideaTitle') || '').trim(),
      category: String(formData.get('ideaCategory') || 'Other'),
      description: String(formData.get('ideaDescription') || '').trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'New idea',
    };
    setIdeas((currentIdeas) => [newIdea, ...currentIdeas]);
    setShareDialogOpen(false);
  };

  return <><Header />
    <main className="ideas-page min-h-[70vh] bg-[#f6f5f0] px-5 py-12 text-[#171717] md:px-8 md:py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="eyebrow text-[#826900]">SK Prompt Party · Community board</div><h1 className="ideas-title mt-3 font-display text-4xl font-bold tracking-[.01em] text-[#171717] md:text-5xl">Ideas worth sharing.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">Explore creative sparks from the community and add a concept that could inspire someone’s next great piece of content.</p></div>
          <button type="button" onClick={() => setShareDialogOpen(true)} className="btn-gold shrink-0 !px-5 !py-3 text-sm" data-testid="button-share-idea"><Sparkles size={16} /> Share Ideas <ArrowUpRight size={15} /></button>
        </div>
        <section className="mt-9 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_45px_rgba(0,0,0,.07)]" aria-labelledby="ideas-table-title">
          <div className="flex flex-col justify-between gap-2 border-b border-black/10 px-5 py-5 sm:flex-row sm:items-center md:px-6"><div><h2 id="ideas-table-title" className="font-display text-xl font-extrabold tracking-[-.04em] text-[#171717]">Community ideas</h2><p className="mt-1 text-xs text-black/50">{ideas.length} ideas to spark your next post</p></div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[#f0eee7] text-[10px] uppercase tracking-[.12em] text-black/50"><tr><th className="px-5 py-4 font-bold md:px-6">Idea</th><th className="px-4 py-4 font-bold">Category</th><th className="px-4 py-4 font-bold">Description</th></tr></thead>
                <tbody className="divide-y divide-black/10">{ideas.map((idea) => <tr key={idea.id} className="transition-colors hover:bg-[#faf9f5]"><td className="max-w-[255px] px-5 py-5 align-top md:px-6"><div className="font-display text-sm font-bold leading-5 text-[#171717]">{idea.title}</div></td><td className="px-4 py-5 align-top"><span className="inline-flex rounded-full border border-black/10 bg-[#f6f5f0] px-3 py-1.5 text-[10px] font-semibold text-black/65">{idea.category}</span></td><td className="max-w-[300px] px-4 py-5 align-top text-xs leading-5 text-black/65">{idea.description}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="border-t border-black/10 px-5 py-3 text-[10px] text-black/45 md:px-6">New ideas added from this form are kept for this browser session.</div>
        </section>
      </div>
    </main>
    {shareDialogOpen && <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShareDialogOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="share-idea-title" className="relative my-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf6] p-6 text-[#171717] shadow-2xl md:p-8">
        <div className="relative z-10 flex items-start justify-between gap-4"><div><div className="eyebrow text-[#826900]">Community board</div><h2 id="share-idea-title" className="mt-2 font-display text-2xl font-extrabold tracking-[-.05em] text-[#171717]">Share an idea</h2><p className="mt-2 text-sm leading-5 text-black/60">Give the community a useful starting point for their next creative project.</p></div><button type="button" onClick={() => setShareDialogOpen(false)} aria-label="Close share idea form" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/15 text-black/60 hover:bg-black/5 hover:text-black"><X size={17} /></button></div>
        <form className="relative z-10 mt-6 grid gap-4" onSubmit={submitIdea}>
          <label className="grid gap-2 text-xs font-bold text-black/70">Idea title<input name="ideaTitle" required minLength={4} maxLength={100} placeholder="Give your idea a clear title" className="form-field !border-black/15 !bg-white !text-black placeholder:!text-black/40 text-sm focus:!border-[#c9a900]" /></label>
          <label className="grid gap-2 text-xs font-bold text-black/70">Category<select name="ideaCategory" className="form-field !border-black/15 !bg-white !text-black text-sm focus:!border-[#c9a900]"><option>Storytelling</option><option>Short-form video</option><option>Visual concept</option><option>Audience engagement</option><option>Educational content</option><option>Other</option></select></label>
          <label className="grid gap-2 text-xs font-bold text-black/70">Description<textarea name="ideaDescription" required minLength={10} maxLength={500} placeholder="What makes this idea interesting?" className="form-field min-h-[110px] resize-y !border-black/15 !bg-white !text-black placeholder:!text-black/40 text-sm focus:!border-[#c9a900]" /></label>
          <button type="submit" className="btn-gold mt-1 w-full" data-testid="button-submit-idea">Add to ideas table <ArrowRight size={15} /></button>
        </form>
      </section>
    </div>}
    <Footer /></>;
}

function JoinCommunityPage() {
  return <PromptSubscriptionPage />;
}

function PromptSubscriptionPage() {
  usePageMeta('Join the SK Prompt Party | Premium Access', 'Get premium access to SK Prompt Party prompts for $5 per month. Contact our team to arrange subscription payment.');
  const [coupon, setCoupon] = useState('');
  const [, navigate] = useLocation();
  const benefits = ['Access to all prompts — current and future', 'Full prompt content with storyboard images', 'One-click copy prompt', 'New viral niches added weekly', 'Works with Seedance, Kling, Veo & more', 'Instant access after payment', 'Cancel anytime'];
  const paymentMessage = encodeURIComponent('Hi, I would like to subscribe to SK Prompt Party Premium for $5/month. Please share the available payment options.');

  return <><Header />
    <main className="min-h-[75vh] bg-[#171514] bg-[radial-gradient(ellipse_at_top,rgba(113,48,46,.24),transparent_65%)] px-5 py-10 text-white md:py-14">
      <div className="mx-auto max-w-[620px] text-center"><h1 className="font-display text-3xl font-extrabold tracking-[-.04em] md:text-4xl">Join the Community</h1><p className="mt-3 text-sm text-white/55">Unlock every prompt — current &amp; future. New viral drops every week.</p></div>
      <section className="relative mx-auto mt-8 max-w-[480px] rounded-[22px] border border-white/10 bg-[#1e1e1e] px-6 pb-6 pt-9 shadow-[0_24px_70px_rgba(0,0,0,.35)] md:px-8">
        <span className="join-premium-badge absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#090909] px-5 py-2 text-[11px] font-extrabold text-white shadow-lg">Premium Access</span>
        <div className="text-center"><div className="font-display text-5xl font-extrabold tracking-[-.06em]">$5<span className="ml-1 text-sm font-medium tracking-normal text-white/50">/month</span></div></div>
        <ul className="mt-6 divide-y divide-white/10">{benefits.map((benefit) => <li key={benefit} className="flex items-center gap-3 py-2.5 text-xs text-white/80"><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><Check size={11} strokeWidth={3} /></span>{benefit}</li>)}</ul>
        <a href={`${whatsapp}?text=${paymentMessage}`} target="_blank" rel="noreferrer" className="join-payment-cta mt-5 flex w-full justify-center rounded-full bg-[#090909] px-5 py-3.5 text-xs font-extrabold text-white shadow-[0_8px_24px_rgba(0,0,0,.16)] transition hover:bg-[#292929]">ASK ABOUT CRYPTO PAYMENT — $5 / MONTH</a>
        <p className="mt-2 text-center text-[10px] text-white/40">Our team will share the available payment options securely.</p>
        <div className="my-4 flex items-center gap-3 text-[10px] text-white/35"><span className="h-px flex-1 bg-white/10" />OR<span className="h-px flex-1 bg-white/10" /></div>
        <a href={`${whatsapp}?text=${paymentMessage}`} target="_blank" rel="noreferrer" className="flex w-full justify-center rounded-full bg-emerald-500 px-5 py-3.5 text-xs font-extrabold text-white transition hover:bg-emerald-400">💬 ASK TO SUBSCRIBE ON WHATSAPP</a>
        <p className="mt-2 text-center text-[10px] leading-4 text-white/40">Message our team to confirm payment and activate your access.</p>
        <form className="mt-5 flex gap-2 border-t border-dashed border-white/10 pt-4" onSubmit={(event) => { event.preventDefault(); navigate('/sk-prompt-party/all-prompts'); }}>
          <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="HAVE A COUPON CODE?" aria-label="Coupon code" className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#141414] px-4 py-2.5 text-[10px] text-white outline-none placeholder:text-white/35 focus:border-white/25" />
          <button type="submit" className="rounded-full border border-white/10 px-5 py-2.5 text-[10px] font-bold text-white/75 hover:border-white/30 hover:text-white">APPLY</button>
        </form>
      </section>
    </main>
    <Footer /></>;
}

function SKPromptPartyPage() {
  usePageMeta(
    'SK Prompt Party | Creative prompts for creators',
    'SK Prompt Party is a creative prompt-first experience for creators who want smarter ideas, stronger hooks, and a more exciting content workflow.',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const visiblePrompts = promptCards
    .filter((prompt) => activeCategory === 'All Categories' || prompt.category === activeCategory)
    .filter((prompt) => !appliedSearch || `${prompt.title} ${prompt.category}`.toLowerCase().includes(appliedSearch.toLowerCase()))
    .sort((first, second) => sortOrder === 'newest' ? second.createdAt - first.createdAt : first.createdAt - second.createdAt);
  return <><Header /><section className="prompt-profile-section relative overflow-hidden bg-[#f6f5f0] text-[#211f1b]">
    <div className="prompt-marquee-viewport overflow-hidden py-4" aria-label="Featured community prompts">
      <div className="prompt-marquee-track flex w-max gap-4">
        {[...promptCards, ...promptCards].map((prompt, index) => <Link key={`${prompt.title}-${index}`} href={`/sk-prompt-party/prompt/${promptSlug(prompt.title)}`} className="prompt-marquee-card group relative h-[150px] w-[260px] shrink-0 overflow-hidden rounded-xl border border-white/20 bg-[#1e1e1e] sm:h-[174px] sm:w-[310px]">
          <img src={`https://images.unsplash.com/${prompt.image}?auto=format&fit=crop&w=620&h=350&q=80`} alt="" aria-hidden="true" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <span className="prompt-marquee-title absolute inset-x-3 bottom-3 line-clamp-2 text-left text-xs font-bold leading-4 text-white sm:text-sm">{prompt.title}</span>
        </Link>)}
      </div>
    </div>
    <div className="relative z-10 mx-auto -mt-[68px] flex max-w-[1180px] flex-col items-center px-5 pb-8 text-center md:-mt-[92px] md:pb-10">
      <div className="relative h-[156px] w-[156px] overflow-visible rounded-[28px] border-[4px] border-[#f6f5f0] bg-[#17151f] shadow-lg md:h-[188px] md:w-[188px]">
        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=85" alt="SK Prompt Party profile" className="h-full w-full rounded-[20px] object-cover" />
        <span className="absolute -bottom-1 -right-2 grid h-8 w-8 place-items-center rounded-full border-[3px] border-[#f6f5f0] bg-[#e5bd43] text-[#17130a]" aria-label="Verified"><Check size={16} strokeWidth={3} /></span>
      </div>
      <h1 className="mt-5 font-serif text-[27px] font-bold leading-tight tracking-[-.025em] md:mt-6 md:text-[30px]">SK Prompt Party</h1>
      <p className="mt-2 text-sm text-white/75">Viral Prompts by <span className="font-bold text-white">SK MEDIA MONETIZATION</span></p>
    </div>
  </section>
    <main className="min-h-[70vh] bg-[#171514] bg-[radial-gradient(ellipse_at_top,rgba(113,48,46,.22),transparent_65%)] px-5 pb-16 pt-10 text-white md:px-8 md:pt-12">
      <div className="mx-auto max-w-[1320px]">
        <div className="text-center"><h2 className="font-display text-4xl font-extrabold tracking-[-.05em] md:text-[42px]">All Prompts</h2><p className="mt-3 text-base text-white/55">{visiblePrompts.length} prompts</p></div>
        <form className="mx-auto mt-10 flex max-w-[625px] flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchTerm.trim()); }}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search prompts…" aria-label="Search prompts" className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#1c1c1c] px-5 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30" />
          <select aria-label="Sort prompts" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')} className="rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-[#333] outline-none"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select>
          <button type="submit" className="prompt-search-button rounded-full bg-[#090909] px-7 py-3 text-sm font-extrabold text-white !text-white shadow-[0_8px_22px_rgba(0,0,0,.18)] transition hover:bg-[#292929]">SEARCH</button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5" aria-label="Filter prompts by category">
          {promptCategories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`prompt-filter-button rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${activeCategory === category ? 'border-[#090909] bg-[#090909] text-white !text-white' : 'border-white/10 bg-[#1b1b1b] text-white/60 hover:border-white/25 hover:text-white'}`}>{category}</button>)}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visiblePrompts.map((prompt) => <article key={prompt.title} className="overflow-hidden rounded-[20px] border border-white/10 bg-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,.24)] transition hover:-translate-y-1 hover:border-red-500/40">
            <div className="relative aspect-[1.8/1] overflow-hidden bg-[#292929]"><img src={`https://images.unsplash.com/${prompt.image}?auto=format&fit=crop&w=800&q=85`} alt={prompt.title} loading="lazy" className="h-full w-full object-cover" />{prompt.access === 'Premium' && <span className="prompt-premium-badge absolute right-3 top-3 rounded-full bg-[#101010]/90 px-3 py-1.5 text-[11px] font-bold text-white">🔒 Premium</span>}</div>
            <div className="flex min-h-[198px] flex-col p-4">
              <span className="prompt-category-badge w-fit rounded-full bg-black px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">{prompt.category}</span>
              <h3 className="mt-3 font-display text-[16px] font-extrabold uppercase leading-[1.25] tracking-[-.025em]">{prompt.title}</h3>
              <Link href={prompt.access === 'Premium' ? '/sk-prompt-party/join-community' : `/sk-prompt-party/prompt/${promptSlug(prompt.title)}`} className="mt-auto inline-flex w-full justify-center rounded-full border border-[#090909] bg-[#090909] px-4 py-2.5 text-xs font-extrabold text-white transition hover:border-[#292929] hover:bg-[#292929]">{prompt.access === 'Premium' ? 'UNLOCK' : 'VIEW PROMPT'}</Link>
            </div>
          </article>)}
        </div>
        {visiblePrompts.length === 0 && <div className="py-16 text-center text-sm text-white/55">No prompts match your filters. Try a different search or category.</div>}
      </div>
    </main>
    <Footer /></>;
}

  function PromptDetailPage() {
    const [, params] = useRoute('/sk-prompt-party/prompt/:slug');
    const prompt = promptCards.find((item) => promptSlug(item.title) === params?.slug);
    const [referenceZoomOpen, setReferenceZoomOpen] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);
    usePageMeta(prompt ? `${prompt.title} | SK Prompt Party` : 'Prompt not found | SK Prompt Party', prompt ? `${prompt.category} prompt from SK Prompt Party.` : 'This SK Prompt Party prompt could not be found.');
    const promptText = prompt
      ? `# ${prompt.title}\n\nCreate a cinematic ${prompt.category.toLowerCase()} video around “${prompt.title.toLowerCase()}”. Open with an attention-grabbing first moment, build a clear visual progression, and finish with a memorable payoff. Use cinematic framing, natural movement, detailed textures, and a cohesive color palette. Keep the concept original and tailor it to your audience.`
      : '';
    const copyPrompt = async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(promptText);
        } else {
          throw new Error('Clipboard API unavailable');
        }
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = promptText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) {
          setPromptCopied(false);
          return;
        }
      }
      try {
        setPromptCopied(true);
        window.setTimeout(() => setPromptCopied(false), 1800);
      } catch {
        setPromptCopied(false);
      }
    };
    if (!prompt) return <><Header /><main className="min-h-[60vh] bg-[#171514] px-5 py-16 text-center text-white"><h1 className="font-display text-3xl font-extrabold">Prompt not found</h1><Link href="/sk-prompt-party" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/70 hover:text-white">← Back to all prompts</Link></main><Footer /></>;

    return <><Header />
      <main className="min-h-[75vh] bg-[#171514] bg-[radial-gradient(ellipse_at_top,rgba(113,48,46,.2),transparent_65%)] px-5 py-8 text-white md:px-8 md:py-12">
        <article className="mx-auto max-w-[1180px]">
          <Link href="/sk-prompt-party" className="inline-flex rounded-full border border-white/10 bg-[#1d1c1c] px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:text-white">← Back to all prompts</Link>
          <h1 className="mt-7 max-w-4xl font-display text-3xl font-extrabold uppercase leading-tight tracking-[-.04em] md:text-5xl">{prompt.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-white/60"><span className="rounded-full border border-white/10 bg-[#1d1c1c] px-4 py-2">📁 {prompt.category}</span><span className="rounded-full border border-white/10 bg-[#1d1c1c] px-4 py-2">🕒 Updated 05 Oct 2026</span></div>
          <section className="mt-8" aria-labelledby="prompt-reference-title">
            <h2 id="prompt-reference-title" className="mb-3 text-lg font-bold">Storyboard &amp; Reference</h2>
            <div className="w-full max-w-[650px] overflow-hidden rounded-xl border border-white/10 bg-[#1e1d1c] shadow-lg">
              <button type="button" onClick={() => setReferenceZoomOpen(true)} aria-label="Zoom storyboard reference image" className="block w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8860b]">
                <img src={`https://images.unsplash.com/${prompt.image}?auto=format&fit=crop&w=1200&q=85`} alt={`Storyboard reference for ${prompt.title}`} className="aspect-video w-full object-cover transition-transform duration-200 hover:scale-[1.02]" loading="lazy" />
              </button>
            </div>
          </section>
          <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf6] text-[#211f1b] shadow-[0_16px_40px_rgba(0,0,0,.08)]" aria-labelledby="prompt-card-title">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-5 py-4 md:px-7">
              <div><h2 id="prompt-card-title" className="font-display text-xl font-bold">Your Creative Prompt</h2><p className="mt-1 text-sm text-black/55">Ready to copy into your creative workflow.</p></div>
              <button type="button" onClick={copyPrompt} className="prompt-copy-button inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#090909] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#292929]">{promptCopied ? 'COPIED!' : '📋 COPY PROMPT'}</button>
            </div>
            <pre className="whitespace-pre-wrap break-words px-5 py-6 font-sans text-sm leading-7 text-[#39362f] md:px-7 md:py-8">{promptText}</pre>
          </section>
        </article>
      </main>
      {referenceZoomOpen && <div role="dialog" aria-modal="true" aria-label="Expanded storyboard reference" className="fixed inset-0 z-[70] grid cursor-zoom-out place-items-center bg-black/85 p-5 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setReferenceZoomOpen(false); }}>
        <button type="button" onClick={() => setReferenceZoomOpen(false)} aria-label="Close enlarged image" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/60 text-white transition hover:bg-black/85"><X size={22} /></button>
        <img src={`https://images.unsplash.com/${prompt.image}?auto=format&fit=crop&w=1800&q=90`} alt={`Expanded storyboard reference for ${prompt.title}`} className="max-h-[88vh] max-w-[94vw] cursor-default rounded-xl object-contain shadow-2xl" />
      </div>}
      <Footer /></>;
  }

function ContactPage() {
  usePageMeta(
    'Contact SK Media Monetization | Dera Ismail Khan, Pakistan',
    'Contact SK Media Monetization for YouTube, Facebook, and TikTok creator support by form, phone, email, or WhatsApp, or visit our Dera Ismail Khan office.',
  );
  return <><Header /><PageHero kicker="Start a conversation" title={<>Your next move starts <br/>with a hello</>} intro="No complicated pitch deck required. Tell us about your content, your questions, and what you’re working toward." centered />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.1fr_.9fr]"><div><div className="eyebrow text-[#826900]">Tell us a little</div><h2 className="mb-7 mt-3 font-display text-3xl font-extrabold tracking-[-.05em]">We’ll take it from here.</h2><ContactForm /></div><aside className="h-fit rounded-2xl bg-[#111] p-7 text-white md:p-9"><div className="eyebrow text-[#ffd700]">Direct line</div><p className="mt-4 text-sm leading-6 text-white/55">Choose whichever way feels easiest. We’ll meet you there.</p><div className="mt-8 grid gap-5 border-t border-white/10 pt-6"><a className="flex items-center gap-4" href={`tel:${primaryPhone.replaceAll(' ', '')}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><MessageCircle size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Phone / WhatsApp</small><b className="mt-1 block text-sm">{primaryPhone}</b></span></a><a className="flex items-center gap-4" href={`tel:${secondaryPhone.replaceAll(' ', '')}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><MessageCircle size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Phone</small><b className="mt-1 block text-sm">{secondaryPhone}</b></span></a><a className="flex items-center gap-4" href={`mailto:${businessEmail}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Mail size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Email</small><b className="mt-1 block text-sm">{businessEmail}</b></span></a><div className="flex items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><MapPin size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Based in</small><b className="mt-1 block text-sm">{businessAddress}</b></span></div></div><a href={whatsapp} target="_blank" rel="noreferrer" className="btn-gold mt-8 w-full">Message us on WhatsApp <ArrowUpRight size={15} /></a></aside></div></section>
    <div className="bg-[#e9e7df] px-6 py-12"><div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl"><iframe title="Map showing SK Media Monetization in Dera Ismail Khan" src="https://www.google.com/maps?q=Opposite+Daewoo+Terminal,+IT+Park+First+Floor,+Dera+Ismail+Khan&output=embed" className="h-[270px] w-full grayscale-[.65]" loading="lazy" /></div></div><Footer /></>;
}

function AdminLogin() {
  usePageMeta('Admin Sign In | SK Media Monetization', 'Private administrator sign-in for SK Media Monetization.', true);
  const login = useAdminLogin();
  const qc = useQueryClient();
  const [error,setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setError('');const f=new FormData(e.currentTarget);login.mutate({data:{username:String(f.get('username')||''),password:String(f.get('password')||'')}},{onSuccess:()=>qc.invalidateQueries({queryKey:getGetAdminSessionQueryKey()}),onError:()=>setError('That sign-in didn’t work. Check your details and try again.')});};
  return <div className="admin-login-shell">
    <div className="relative hidden overflow-hidden bg-[#000000] p-12 text-white md:flex md:flex-col md:justify-between"><Logo /><div><div className="eyebrow text-[#ffd700]">SK Media · Private workspace</div><h1 className="mt-4 font-display text-6xl font-extrabold leading-[.94] tracking-[-.07em]">Behind every<br />good next step<br />is a <span className="text-[#ffd700] underline decoration-[5px] underline-offset-8">great follow-up.</span></h1><p className="mt-6 max-w-sm text-sm leading-6 text-white/65">Your creator conversations, organized in one place.</p></div><div className="text-xs text-white/50">Dera Ismail Khan · Admin access only</div></div>
    <div className="flex flex-col justify-center px-6 py-14 md:px-[12%]"><div className="mb-12 md:hidden"><Logo light /></div><div className="mx-auto w-full max-w-[390px]"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffd700] text-black"><LockKeyhole size={20} /></div><div className="eyebrow mt-7 text-[#ffd700]">Team access</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em] text-white">Welcome back.</h2><p className="mt-3 text-sm text-white/45">Sign in to manage creator enquiries.</p><form className="mt-8 grid gap-4" onSubmit={submit}><label className="grid gap-2 text-xs font-semibold text-white/70">Username<input name="username" autoComplete="username" required className="form-field border-white/15 bg-white/[.04] text-white placeholder:text-white/25" data-testid="input-admin-username" /></label><label className="grid gap-2 text-xs font-semibold text-white/70">Password<div className="relative"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="form-field w-full border-white/15 bg-white/[.04] text-white placeholder:text-white/25" data-testid="input-admin-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error&&<p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300" role="alert" data-testid="status-admin-login-error">{error}</p>}<button className="btn-gold mt-2 w-full" type="submit" disabled={login.isPending} data-testid="button-admin-login">{login.isPending?'Checking your details…':'Sign in'} <ArrowRight size={15} /></button></form><Link href="/" className="mt-8 inline-flex text-xs text-white/40 hover:text-[#ffd700]">← Back to the public site</Link></div></div>
  </div>;
}

function MemberAuthForm({ register = false, onModeChange }: { register?: boolean; onModeChange?: (mode: 'login' | 'register') => void }) {
  const [notice, setNotice] = useState('');
  const title = register ? 'Create your account' : 'Welcome back';
  const action = register ? 'Create account' : 'Sign in';
  const message = encodeURIComponent(register ? 'Hi, I would like to register for SK Prompt Party.' : 'Hi, I need help signing in to SK Prompt Party.');
  return <section className="w-full">
    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffd700] text-black"><LockKeyhole size={20} /></div><div className="eyebrow mt-6 text-[#ffd700]">SK Prompt Party · Member access</div><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.05em]">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{register ? 'Join the creator community and get ready for fresh ideas.' : 'Sign in to continue to your creator community.'}</p>
    <form className="mt-7 grid gap-4" onSubmit={(event) => { event.preventDefault(); setNotice('Member account sign-in and registration are not connected yet. Contact our team on WhatsApp for access.'); }}>
      {register && <label className="grid gap-2 text-xs font-semibold text-white/75">Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Your name" className="form-field border-white/15 bg-white/[.04] text-white placeholder:text-white/30" /></label>}
      <label className="grid gap-2 text-xs font-semibold text-white/75">Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="form-field border-white/15 bg-white/[.04] text-white placeholder:text-white/30" /></label>
      <label className="grid gap-2 text-xs font-semibold text-white/75">Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} placeholder="At least 8 characters" className="form-field border-white/15 bg-white/[.04] text-white placeholder:text-white/30" /></label>
      {notice && <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100" role="status">{notice}<a href={`${whatsapp}?text=${message}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-emerald-300 hover:text-emerald-200">Contact us on WhatsApp <ArrowUpRight size={14} className="ml-1" /></a></div>}
      <button type="submit" className="btn-gold mt-2 w-full">{action} <ArrowRight size={15} /></button>
    </form>
    <p className="mt-6 text-center text-sm text-white/50">{register ? 'Already have an account?' : 'New to SK Prompt Party?'} {onModeChange ? <button type="button" onClick={() => onModeChange(register ? 'login' : 'register')} className="font-bold text-[#ffd700] hover:underline">{register ? 'Login' : 'Register'}</button> : <Link href={register ? '/login' : '/register'} className="font-bold text-[#ffd700] hover:underline">{register ? 'Login' : 'Register'}</Link>}</p>
  </section>;
}

function MemberAuthPage({ register = false }: { register?: boolean }) {
  const action = register ? 'Create account' : 'Sign in';
  usePageMeta(`${action} | SK Prompt Party`, register ? 'Create your SK Prompt Party member account.' : 'Sign in to your SK Prompt Party member account.');
  return <><Header /><main className="grid min-h-[72vh] place-items-center bg-[#070707] px-5 py-14 text-white"><section className="w-full max-w-[460px] rounded-2xl border border-white/10 bg-[#111] p-6 shadow-[0_24px_70px_rgba(0,0,0,.35)] md:p-9"><MemberAuthForm register={register} /></section></main><Footer /></>;
}

function AdminDashboard({ username }: { username: string | null }) {
  const qc=useQueryClient();
  const contactsQuery=useGetContacts({query:{queryKey:getGetContactsQueryKey()}});
  const summaryQuery=useGetContactSummary({query:{queryKey:getGetContactSummaryQueryKey()}});
  const logout=useAdminLogout();
  const update=useUpdateContactStatus();
  const remove=useDeleteContact();
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState<'all'|'new'|'contacted'>('all');
  const [actionError,setActionError]=useState('');
  const contacts=contactsQuery.data ?? [];
  const visible=useMemo(()=>contacts.filter((c:Contact)=>{
    const term=search.trim().toLowerCase();
    return (filter==='all'||c.status===filter)&&(!term||[c.name,c.email,c.phone,c.platform,c.message||''].some(v=>v.toLowerCase().includes(term)));
  }),[contacts,filter,search]);
  const mutateStatus=(contact:Contact)=>{setActionError('');update.mutate({id:contact.id,data:{status:contact.status==='new'?'contacted':'new'}},{onSuccess:()=>{qc.invalidateQueries({queryKey:getGetContactsQueryKey()});qc.invalidateQueries({queryKey:getGetContactSummaryQueryKey()});},onError:()=>setActionError('Couldn’t update this lead. Please try again.')});};
  const deleteLead=(contact:Contact)=>{if(!window.confirm(`Delete the enquiry from ${contact.name}? This cannot be undone.`))return;setActionError('');remove.mutate({id:contact.id},{onSuccess:()=>{qc.invalidateQueries({queryKey:getGetContactsQueryKey()});qc.invalidateQueries({queryKey:getGetContactSummaryQueryKey()});},onError:()=>setActionError('Couldn’t delete this lead. Please try again.')});};
  return <div className="admin-dashboard min-h-[100dvh] bg-[#f3f1e9]">
    <header className="border-b border-black/10 bg-[#090909] text-white"><div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-8"><Logo light /><div className="flex items-center gap-3"><span className="hidden text-xs text-white/50 sm:inline">Signed in as <b className="text-white">{username||'Admin'}</b></span><button className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold hover:border-[#ffd700] hover:text-[#ffd700]" onClick={()=>logout.mutate(undefined,{onSuccess:()=>{qc.invalidateQueries({queryKey:getGetAdminSessionQueryKey()});}})} disabled={logout.isPending} data-testid="button-admin-logout">{logout.isPending?'Signing out…':'Sign out'}</button></div></div></header>
    <main className="admin-main mx-auto max-w-[1400px] px-5 py-8 md:px-8 md:py-12"><div className="admin-layout">
      <aside className="admin-sidebar" aria-label="Dashboard navigation"><div className="eyebrow mb-4 text-white/35">Workspace</div><a href="#overview">Overview</a><a href="#leads" aria-current="page">Creator leads</a></aside><div className="admin-main-panel">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Private workspace</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Creator enquiries</h1><p className="mt-2 text-sm text-black/50">A clear view of the conversations coming your way.</p></div><button onClick={()=>{contactsQuery.refetch();summaryQuery.refetch();}} className="btn-outline w-fit border-black/20 !px-4 !py-2.5 text-xs" data-testid="button-refresh-leads"><TrendingUp size={14} /> Refresh leads</button></div>
      <div id="overview" className="mt-8 grid gap-3 sm:grid-cols-3">{[['Total enquiries',summaryQuery.data?.total,'All time'],['New',summaryQuery.data?.new,'Needs a first reply'],['Contacted',summaryQuery.data?.contacted,'Follow-up started']].map(([title,value,sub],i)=><div key={String(title)} className="rounded-xl border border-black/10 bg-[#fbfaf6] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-black/55">{title}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${i===1?'bg-[#ffd700]':'bg-black/5'}`}>{i===0?<Users size={15}/>:i===1?<CircleHelp size={15}/>:<Check size={15}/>}</span></div><div className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em]" data-testid={`text-summary-${String(title).toLowerCase().replace(' ','-')}`}>{summaryQuery.isLoading?<span className="inline-block h-9 w-14 animate-pulse rounded bg-black/10"/>:value??'—'}</div><div className="mt-1 text-[11px] text-black/40">{sub}</div></div>)}</div>
      <section id="leads" className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf6]">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-5 md:flex-row md:items-center md:p-6"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">All leads</h2><p className="mt-1 text-xs text-black/45">{visible.length} {visible.length===1?'conversation':'conversations'} shown</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={15}/><input className="form-field !rounded-lg !py-2.5 pl-9 text-xs sm:w-[230px]" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" aria-label="Search leads" data-testid="input-lead-search"/></label><select className="form-field !rounded-lg !py-2.5 text-xs sm:w-[150px]" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} aria-label="Filter leads by status" data-testid="select-lead-filter"><option value="all">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option></select></div></div>
        {actionError&&<div className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="status-admin-action-error">{actionError}</div>}
        {contactsQuery.isLoading?<div className="grid gap-3 p-5">{[1,2,3].map(x=><div key={x} className="skeleton-gold h-16 rounded-lg"/> )}</div>
        :contactsQuery.isError?<div className="p-10 text-center"><div className="font-semibold">We couldn’t load your leads.</div><p className="mt-2 text-sm text-black/50">Try again in a moment.</p><button onClick={()=>contactsQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs" data-testid="button-retry-leads">Retry <ArrowRight size={14}/></button></div>
        :visible.length===0?<div className="px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ffd700]/40"><Search size={19}/></div><h3 className="mt-4 font-display text-xl font-bold">{contacts.length===0?'No enquiries yet':'No matching leads'}</h3><p className="mt-2 text-sm text-black/45">{contacts.length===0?'New creator conversations will appear here when they reach out.':'Try changing your search or status filter.'}</p>{(search||filter!=='all')&&<button onClick={()=>{setSearch('');setFilter('all');}} className="mt-4 text-xs font-bold underline underline-offset-4" data-testid="button-clear-filters">Clear filters</button>}</div>
        :<div className="overflow-x-auto"><table className="admin-table w-full min-w-[890px]"><thead><tr><th>Creator</th><th>Platform</th><th>Message</th><th>Received</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{visible.map(contact=><tr key={contact.id} data-testid={`row-lead-${contact.id}`}><td><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ffd700] text-xs font-extrabold">{contact.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><div><div className="text-sm font-bold">{contact.name}</div><a className="mt-1 block text-xs text-black/50 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a><a className="mt-1 block text-[11px] text-black/40" href={`tel:${contact.phone}`}>{contact.phone}</a></div></div></td><td><span className="inline-flex items-center gap-2 text-xs font-semibold"><PlatformMark platform={contact.platform}/>{contact.platform}</span></td><td className="max-w-[220px] text-xs leading-5 text-black/60">{contact.message||<span className="italic text-black/30">No message included</span>}</td><td className="whitespace-nowrap text-xs text-black/55">{new Date(contact.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</td><td><span className={`status-badge-${contact.status} inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize`}>{contact.status}</span></td><td><div className="flex justify-end gap-2"><button onClick={()=>mutateStatus(contact)} disabled={update.isPending} className="rounded-lg border border-black/15 px-3 py-2 text-[10px] font-bold hover:border-black/50" data-testid={`button-status-${contact.id}`}>{contact.status==='new'?'Mark contacted':'Mark new'}</button><button onClick={()=>deleteLead(contact)} disabled={remove.isPending} aria-label={`Delete enquiry from ${contact.name}`} className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50" data-testid={`button-delete-${contact.id}`}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <p className="mt-5 text-[11px] text-black/40">Lead data is private to your team. Keep creator details confidential.</p>
      </div></div></main>
  </div>;
}
function AdminPage() {
  usePageMeta('Admin Dashboard | SK Media Monetization', 'Private lead management dashboard for SK Media Monetization.', true);
  const qc = useQueryClient();
  const session=useGetAdminSession({query:{queryKey:getGetAdminSessionQueryKey(),retry:false}});
  useEffect(() => {
    if (!session.isLoading && !session.data?.authenticated) {
      qc.removeQueries({ queryKey: getGetContactsQueryKey() });
      qc.removeQueries({ queryKey: getGetContactSummaryQueryKey() });
    }
  }, [qc, session.data?.authenticated, session.isLoading]);
  if(session.isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-[#090909]"><div className="w-[280px] animate-pulse"><div className="h-8 w-8 rounded-full bg-[#ffd700]"/><div className="mt-5 h-8 w-56 rounded bg-white/10"/><div className="mt-3 h-4 w-40 rounded bg-white/10"/></div></div>;
  if(session.data?.authenticated) return <AdminDashboard username={session.data.username}/>;
  return <AdminLogin />;
}

function RouteBoundary({children}:{children:ReactNode}) {
  const [location]=useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function FloatingWhatsApp() {
  return <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Chat with SK Media on WhatsApp" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105 hover:bg-[#1fba59]" data-testid="link-whatsapp-floating"><SiWhatsapp size={25} /></a>;
}
function Router() {
  const [path] = useLocation();
  const usesLightPageTheme = path === '/' || path === '/services' || path === '/sk-prompt-party' || path.startsWith('/sk-prompt-party/') || path === '/about' || path === '/contact';
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(decodeURIComponent(hash)) : null;
    if (target) {
      target.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [path]);
  return <><RouteBoundary><AnimatePresence mode="wait" initial={false}><motion.div key={path} className={`min-h-[100dvh] ${usesLightPageTheme ? 'public-light-theme' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}><Switch>
    <Route path="/" component={Landing} />
    <Route path="/about" component={AboutPage} />
    <Route path="/services" component={ServicesPage} />
    <Route path="/sk-prompt-party/prompt/:slug" component={PromptDetailPage} />
    <Route path="/sk-prompt-party/subscribe" component={PromptSubscriptionPage} />
    <Route path="/sk-prompt-party" component={SKPromptPartyPage} />
    <Route path="/sk-prompt-party/all-prompts" component={AllPromptsPage} />
    <Route path="/sk-prompt-party/share-ideas" component={ShareIdeasPage} />
    <Route path="/sk-prompt-party/join-community" component={JoinCommunityPage} />
    <Route path="/login" component={() => <MemberAuthPage />} />
    <Route path="/register" component={() => <MemberAuthPage register />} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/admin" component={AdminPage} />
    <Route component={NotFound} />
  </Switch></motion.div></AnimatePresence></RouteBoundary>{path !== '/admin' && <FloatingWhatsApp />}</>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
