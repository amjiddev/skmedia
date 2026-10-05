import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, CircleHelp, Clapperboard, Eye, EyeOff, LockKeyhole, Mail, MapPin, Menu, MessageCircle, Play, Search, ShieldCheck, Sparkles, Target, TrendingUp, Users, Video, X, Youtube } from 'lucide-react';
import { SiFacebook, SiTiktok, SiYoutube } from 'react-icons/si';
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

const queryClient = new QueryClient();
const primaryPhone = '+92 311 0380241';
const secondaryPhone = '+92 343 9360383';
const businessEmail = 'skmediamonetization@gmail.com';
const businessAddress = 'Opposite Daewoo Terminal, IT Park First Floor, Dera Ismail Khan';
const whatsapp = 'https://wa.me/923110380241';
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
  return <Link href="/" className={`flex items-center gap-3 ${light ? 'text-white' : 'text-white'} no-underline`} data-testid="link-brand">
    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-[13px] font-extrabold tracking-[-.1em] text-black">SK</span>
    <span className="leading-[1.05]"><b className="block font-display text-[15px] font-extrabold tracking-[-.04em]">SK MEDIA</b><span className="text-[9px] font-bold tracking-[.16em] opacity-60">MONETIZATION</span></span>
  </Link>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [path] = useLocation();
  const links = [['Services', '/services'], ['Our story', '/about'], ['Contact', '/contact']];
  return <header className="relative z-20 border-b border-white/10 bg-black text-white">
    <div className="border-b border-white/10 bg-[#080808]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-2.5 md:px-8">
        <span className="inline-flex items-center gap-2 text-[9px] font-bold tracking-[.13em] text-white/65 md:text-[10px]"><Target size={13} className="text-[#ffd700]" /> YOUR SUCCESS IS OUR MISSION</span>
        <div className="flex items-center gap-3 text-white/65" aria-label="Social media">
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className="transition-colors hover:text-[#ffd700]" data-testid="link-social-facebook"><SiFacebook size={14} /></a>
          <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok" className="transition-colors hover:text-[#ffd700]" data-testid="link-social-tiktok"><SiTiktok size={14} /></a>
          <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube" className="transition-colors hover:text-[#ffd700]" data-testid="link-social-youtube"><SiYoutube size={16} /></a>
        </div>
      </div>
    </div>
    <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 md:px-8">
      <Logo />
      <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href} className={`line-link text-[13px] font-semibold ${path === href ? 'text-white' : 'text-white/65'}`} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}>{label}</Link>)}
      </nav>
      <div className="hidden md:block"><Link href="/contact" className="btn-gold !px-5 !py-3 text-[12px]" data-testid="link-header-cta">Let’s talk <ArrowUpRight size={15} /></Link></div>
      <button className="grid h-10 w-10 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="absolute left-0 right-0 top-full border-t border-white/10 bg-black px-6 py-4 text-white shadow-xl md:hidden">
      {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-white/10 py-4 text-sm font-semibold" data-testid={`link-mobile-${label.toLowerCase().replace(' ', '-')}`}>{label}<ArrowRight className="float-right" size={16} /></Link>)}
      <Link href="/contact" onClick={() => setOpen(false)} className="btn-gold mt-4 w-full">Let’s talk <ArrowUpRight size={15} /></Link>
    </nav>}
  </header>;
}

function Footer() {
  return <footer className="bg-[#090909] text-white">
    <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
      <div><Logo light /><p className="mt-5 max-w-sm text-sm leading-6 text-white/55">We help creators build the business behind the content. Based in Pakistan. Working everywhere.</p></div>
      <div><div className="eyebrow text-[#ffd700]">Explore</div><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/services">Services</Link><Link href="/about">Our story</Link><Link href="/contact">Contact</Link><Link href="/admin">Team login</Link></div></div>
      <div><div className="eyebrow text-[#ffd700]">Say hello</div><div className="mt-4 grid gap-3 text-sm text-white/70"><a href={`tel:${primaryPhone.replaceAll(' ', '')}`}>{primaryPhone}</a><a href={`tel:${secondaryPhone.replaceAll(' ', '')}`}>{secondaryPhone}</a><a href={`mailto:${businessEmail}`}>{businessEmail}</a><span>{businessAddress}</span></div></div>
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
  if (sent) return <div className="rounded-2xl border border-[#e2d9aa] bg-[#fffbe8] p-6" data-testid="status-contact-success">
    <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#ffd700]"><Check size={20} /></div>
    <h3 className="font-display text-xl font-extrabold">You’re on our radar.</h3><p className="mt-2 text-sm leading-6 text-black/65">Thanks for reaching out. Our team will review your note and follow up. Reference <span className="font-mono">{sent.id.slice(0, 8)}</span>.</p>
    {sent.notification !== 'sent' && <p className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-[#6c5810]" data-testid="status-email-notification">{sent.notification === 'not_configured' ? 'Your request was received. Email notifications are currently unavailable, but we have your details.' : 'Your request was received. We could not send an email notification, but our team has your details.'}</p>}
  </div>;
  return <form className="grid gap-4" onSubmit={submit} data-testid="form-contact">
    <div className={compact ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
      <label className="grid gap-2 text-xs font-semibold">Your name<input className="form-field text-sm" name="name" minLength={2} maxLength={100} required placeholder="Ayesha Khan" data-testid="input-contact-name" /></label>
      <label className="grid gap-2 text-xs font-semibold">Email address<input className="form-field text-sm" name="email" type="email" maxLength={254} required placeholder="you@example.com" data-testid="input-contact-email" /></label>
      <label className="grid gap-2 text-xs font-semibold">WhatsApp number<input className="form-field text-sm" name="phone" type="tel" minLength={7} maxLength={32} required placeholder="+92 3XX XXXXXXX" data-testid="input-contact-phone" /></label>
      <label className="grid gap-2 text-xs font-semibold">Main platform<select className="form-field text-sm" name="platform" defaultValue="YouTube" data-testid="select-contact-platform"><option>YouTube</option><option>Facebook</option><option>TikTok</option><option>Other</option></select></label>
    </div>
    <label className="grid gap-2 text-xs font-semibold">What are you building? <span className="font-normal text-black/45">Optional</span><textarea className="form-field min-h-[110px] resize-y text-sm" name="message" maxLength={2000} placeholder="A little about your content and where you want to take it…" data-testid="input-contact-message" /></label>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="status-contact-error">{error}</p>}
    <button className="btn-gold w-full sm:w-fit" type="submit" disabled={createContact.isPending} data-testid="button-contact-submit">{createContact.isPending ? 'Sending your note…' : 'Send your note'} {createContact.isPending ? <span className="h-4 w-4 animate-pulse rounded-full bg-black/30" /> : <ArrowRight size={16} />}</button>
    <p className="text-[11px] text-black/45">No pressure. No spam. Just a useful first conversation.</p>
  </form>;
}

function PlatformMark({ platform }: { platform: string }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-[#ffd700]">{platform === 'YouTube' ? <Youtube size={20} /> : platform === 'Facebook' ? <span className="font-display text-xl font-extrabold">f</span> : <Video size={19} />}</span>;
}

function EarningsCard() {
  return <div className="relative mx-auto w-full max-w-[470px] rotate-[1deg] rounded-[24px] border border-white/15 bg-[#161616] p-5 text-white shadow-[0_32px_90px_rgba(0,0,0,.45)] md:p-7">
    <div className="flex items-start justify-between"><div><div className="text-[11px] font-medium text-white/45">Creator earnings overview</div><div className="mt-2 font-display text-[32px] font-extrabold tracking-[-.06em] md:text-[40px]">$24,560.00</div><div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#ffd700]/15 px-2.5 py-1 text-[10px] font-bold text-[#ffd700]"><TrendingUp size={12} /> +18.6% <span className="font-normal text-white/55">this month</span></div></div><span className="rounded-lg bg-white/5 p-2 text-[#ffd700]"><BarChart3 size={18} /></span></div>
    <div className="mt-7 h-[142px] w-full">
      <div className="flex h-full items-end justify-between gap-2 border-b border-white/10 px-1 pb-2">{[32,44,37,54,48,66,58,71,63,82,76,96].map((height, i) => <div key={i} className="w-full rounded-t-sm bg-[#ffd700]" style={{ height: `${height}%`, opacity: .25 + i * .06 }} />)}</div>
    </div>
    <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[.14em] text-white/35"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Today</span></div>
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
    <div className="social-float social-float-facebook" aria-hidden="true"><SiFacebook size={20} /></div>
    <div className="social-float social-float-tiktok" aria-hidden="true"><SiTiktok size={19} /></div>
    <div className="social-float social-float-youtube" aria-hidden="true"><SiYoutube size={22} /></div>
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
      <div className="mb-8"><div className="eyebrow text-[#ffd700]">Built around your success</div><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">A partner for the work behind the views.</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map(({ title, note, icon: Icon }) => <article key={title} className="rounded-xl border border-white/10 bg-white/[.03] p-5" data-testid={`card-trust-${title.toLowerCase().replaceAll(' ', '-')}`}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><Icon size={19} /></span>
          <h3 className="mt-5 font-display text-[16px] font-bold">{title}</h3>
          <p className="mt-2 text-xs leading-5 text-white/55">{note}</p>
        </article>)}
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
  return <div className="grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 md:grid-cols-2">
    {services.map(({ no, title, desc, icon: Icon, items }) => <article id={`service-${no}`} key={no} className="bg-[#f8f7f1] p-6 md:p-8">
      <div className="flex items-center justify-between"><span className="eyebrow text-black/35">{no} / Service</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700]"><Icon size={18} /></span></div>
      <h3 className="mt-8 font-display text-[25px] font-extrabold tracking-[-.05em]">{title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-black/60">{desc}</p>
      {detailed && <ul className="mt-5 grid gap-2">{items.map(item => <li key={item} className="flex items-center gap-2 text-xs text-black/70"><Check size={14} className="text-[#9b7b00]" />{item}</li>)}</ul>}
      <Link href="/contact" className="line-link mt-6 inline-flex items-center gap-2 text-xs font-bold" data-testid={`link-service-${no}`}>Explore the service <ArrowUpRight size={14} /></Link>
    </article>)}
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
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-[10px] font-semibold tracking-[.11em] text-white/65"><span className="h-1.5 w-1.5 rounded-full bg-[#ffd700]" /> PAKISTAN ROOTED. CREATOR READY.</div>
            <p className="eyebrow text-[#ffd700]">TURN YOUR PASSION INTO PROFIT</p>
            <h1 className="mt-4 font-display text-[clamp(44px,7vw,82px)] font-extrabold leading-[.91] tracking-[-.075em]"><span className="text-white">SK MEDIA</span><br /><span className="text-[#ffd700]">MONETIZATION</span></h1>
            <p className="mt-6 max-w-[490px] font-display text-xl font-bold leading-7 text-white md:text-2xl">WE HELP YOU EARN FROM WHAT YOU LOVE!</p>
            <p className="mt-3 max-w-[490px] text-[15px] leading-7 text-white/60 md:text-[17px]">We help YouTube, Facebook, and TikTok creators turn their content into a stronger, more sustainable business.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#contact" className="btn-gold" data-testid="link-hero-start">Contact Us Now <ArrowRight size={16} /></a><a href="#services" className="btn-outline border-white/30 text-white" data-testid="link-hero-services">See how we help <ArrowDown size={15} /></a></div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/45"><span>Start here:</span><Link href="/services#service-01" className="line-link hover:text-[#ffd700]" data-testid="link-platform-youtube">YouTube</Link><Link href="/services#service-02" className="line-link hover:text-[#ffd700]" data-testid="link-platform-facebook">Facebook</Link><Link href="/services#service-03" className="line-link hover:text-[#ffd700]" data-testid="link-platform-tiktok">TikTok</Link></div>
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
        <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[.8fr_1.2fr]">
          <div><div className="eyebrow text-[#826900]">Good content deserves a plan</div><h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-.06em] md:text-5xl">Turn your audience into an opportunity.</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8"><div className="border-l-2 border-[#ffd700] pl-5"><span className="font-display text-3xl font-extrabold">01</span><h3 className="mt-2 font-bold">Know what’s possible</h3><p className="mt-2 text-sm leading-6 text-black/55">We review your channel and translate platform rules into a practical path forward.</p></div><div className="border-l-2 border-[#ffd700] pl-5"><span className="font-display text-3xl font-extrabold">02</span><h3 className="mt-2 font-bold">Build with intention</h3><p className="mt-2 text-sm leading-6 text-black/55">A focused content and monetization strategy—built around your voice, not a template.</p></div></div>
        </div>
      </section>
      <section id="services" className="section-pad bg-[#e9e7df]">
        <div className="mx-auto max-w-[1180px]"><div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="eyebrow text-[#826900]">How we help</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">The business behind<br className="hidden md:block" /> the post.</h2></div><Link href="/services" className="line-link inline-flex items-center gap-2 text-sm font-bold" data-testid="link-all-services">All services <ArrowRight size={15} /></Link></div><ServiceGrid /></div>
      </section>
      <section className="section-pad bg-[#ffd700]">
        <div className="mx-auto grid max-w-[1180px] gap-8 md:grid-cols-[.9fr_1.1fr] md:items-center">
          <div><div className="eyebrow text-black/55">Not another agency playbook</div><h2 className="mt-4 font-display text-4xl font-extrabold leading-[.98] tracking-[-.065em] md:text-6xl">Creators aren’t<br />inventory. They’re<br />the whole point.</h2></div>
          <div className="md:pl-12"><p className="text-[16px] leading-7 text-black/75">The creator economy is moving fast in Pakistan and beyond. We started SK Media to make the business side feel less intimidating—and the creative side more sustainable.</p><p className="mt-5 text-[15px] leading-7 text-black/70">Our job is to help you understand your options, strengthen your content foundation, and make confident decisions about what comes next. No smoke and mirrors. Just people in your corner.</p><Link href="/about" className="btn-outline mt-7 border-black/40" data-testid="link-story">Meet SK Media <ArrowUpRight size={15} /></Link></div>
        </div>
      </section>
      <section className="section-pad bg-[#f8f7f1]">
        <div className="mx-auto max-w-[1180px]"><div className="mb-10 flex items-end justify-between"><div><div className="eyebrow text-[#826900]">A better way forward</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">Clarity looks good on you.</h2></div><Sparkles className="hidden text-[#b18f00] md:block" size={30} /></div>
        <div className="grid gap-8 border-y border-black/15 py-8 md:grid-cols-3">{[['01','Your own starting point','Every channel is different. Your next steps should be, too.'],['02','Straight answers','We’ll explain what platforms look for and what you can realistically expect.'],['03','A partner, not a pitch','We care about the work after the first call as much as the first call itself.']].map(([n,t,d])=><article key={n} className="grid grid-cols-[42px_1fr] gap-3"><span className="font-mono text-xs text-[#947900]">{n}</span><div><h3 className="font-display text-lg font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-black/55">{d}</p></div></article>)}</div></div>
      </section>
      <section className="section-pad bg-[#111] text-white">
        <div className="mx-auto max-w-[1180px]"><div className="grid gap-4 md:grid-cols-[.7fr_1.3fr]"><div><div className="eyebrow text-[#ffd700]">Creator voices</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">Real partnership.<br />Real perspective.</h2><p className="mt-4 text-sm leading-6 text-white/45">Illustrative testimonial placeholders. Replace these with approved creator feedback before publishing.</p></div><div className="grid gap-4 sm:grid-cols-2"><blockquote className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><div className="text-[#ffd700]">★★★★★</div><p className="mt-5 font-display text-lg font-semibold leading-7">“The first time someone explained monetization without making it feel like a maze.”</p><footer className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">Placeholder creator feedback <span className="text-white/25">· YouTube</span></footer></blockquote><blockquote className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><div className="text-[#ffd700]">★★★★★</div><p className="mt-5 font-display text-lg font-semibold leading-7">“Practical, honest and genuinely invested in helping me get the foundations right.”</p><footer className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">Placeholder creator feedback <span className="text-white/25">· Facebook</span></footer></blockquote></div></div></div>
      </section>
      <section className="section-pad bg-[#e9e7df]">
        <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[.75fr_1.25fr]"><div><div className="eyebrow text-[#826900]">The useful details</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">Good questions.<br />Clear answers.</h2><p className="mt-4 text-sm leading-6 text-black/55">Still deciding if we’re the right fit? Start here.</p><Link href="/contact" className="line-link mt-6 inline-flex items-center gap-2 text-sm font-bold">Ask us directly <ArrowRight size={15} /></Link></div><FAQ /></div>
      </section>
      <section id="contact" className="section-pad bg-[#f8f7f1]">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="eyebrow text-[#826900]">Your next chapter starts here</div><h2 className="mt-4 font-display text-4xl font-extrabold leading-[.98] tracking-[-.06em] md:text-6xl">Let’s make your content work harder.</h2><p className="mt-5 max-w-md text-sm leading-6 text-black/60">Tell us where you’re at. We’ll help you find the right next step—whether you’re just starting or ready to scale.</p><div className="mt-8 flex items-center gap-3"><a href={whatsapp} target="_blank" rel="noreferrer" className="btn-outline border-black/25 text-sm" data-testid="link-whatsapp"><MessageCircle size={16} /> WhatsApp us</a><span className="text-xs text-black/45">Prefer a direct reply? Message us on WhatsApp.</span></div></div>
          <div className="rounded-2xl border border-black/10 bg-white/55 p-5 md:p-8"><ContactForm compact /></div>
        </div>
      </section>
      <section className="bg-[#e9e7df]">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-14 md:grid-cols-2 md:px-8">
          <div><div className="eyebrow text-[#ffd700]">Find us</div><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.05em]">Dera Ismail Khan.<br />Everywhere creators are.</h2><p className="mt-3 text-sm text-white/55">Our home base is in Dera Ismail Khan. Our conversations go wherever you create.</p><div className="mt-5 flex items-center gap-2 text-sm font-semibold"><MapPin size={16} />{businessAddress}</div></div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010]"><iframe title="Map showing SK Media Monetization in Dera Ismail Khan" src="https://www.google.com/maps?q=Opposite+Daewoo+Terminal,+IT+Park+First+Floor,+Dera+Ismail+Khan&output=embed" className="h-[230px] w-full grayscale-[.65]" loading="lazy" /><a href="https://www.google.com/maps/search/?api=1&query=Opposite+Daewoo+Terminal,+IT+Park+First+Floor,+Dera+Ismail+Khan" target="_blank" rel="noreferrer" className="block bg-[#101010] px-4 py-3 text-[11px] font-semibold text-white/55">View our location <ArrowUpRight className="ml-1 inline" size={13} /></a></div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}

function PageHero({ kicker, title, intro }: { kicker: string; title: ReactNode; intro: string }) {
  return <section className="bg-[#090909] px-6 py-16 text-white md:px-10 md:py-24"><div className="mx-auto max-w-[1180px]"><div className="eyebrow text-[#ffd700]">{kicker}</div><h1 className="mt-5 max-w-4xl font-display text-[clamp(45px,8vw,86px)] font-extrabold leading-[.94] tracking-[-.07em]">{title}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/55">{intro}</p></div></section>;
}
function AboutPage() {
  usePageMeta(
    'About SK Media Monetization | Creator-First Guidance',
    'Learn how SK Media Monetization supports YouTube, Facebook, and TikTok creators with practical guidance, content strategy, and a sustainable business focus.',
  );
  return <><Header /><PageHero kicker="A different kind of partner" title={<>The best creator<br />businesses start<br />with <span className="text-[#ffd700]">being seen.</span></>} intro="SK Media Monetization exists to help creators move from making content to building something sustainable around it." />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[.7fr_1.3fr]"><div><div className="eyebrow text-[#826900]">Our story</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em]">Built for the people behind the posts.</h2></div><div className="space-y-5 text-[15px] leading-7 text-black/65"><p>Creators are building culture, communities, and businesses every day. But the rules around platform monetization can feel opaque, and the advice available often skips the human part.</p><p>Our focus is making those next steps easier to understand. From platform readiness to content strategy, we offer practical guidance with respect for what makes each creator different.</p><p>We’re based in Pakistan, built for a global creator landscape, and committed to earning trust one clear conversation at a time.</p></div></div></section>
    <section className="section-pad bg-[#ffd700]"><div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-2"><div><div className="eyebrow text-black/50">Our mission</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">Make creator income feel more within reach.</h2></div><p className="max-w-xl text-lg leading-8 text-black/70">We help creators understand their options, build a healthier content foundation, and pursue monetization with confidence. The goal isn’t to make you someone else. It’s to help your work go further as you.</p></div></section>
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto max-w-[1180px]"><div className="eyebrow text-[#826900]">What we believe</div><div className="mt-7 grid gap-7 md:grid-cols-3">{[['Clarity over hype','Honest guidance is more valuable than a shiny promise.'],['The creator comes first','Your creative voice is the asset. We help protect and grow it.'],['Progress is personal','Your right next step should fit your goals, stage, and life.']].map(([title,desc],i)=><div className="border-t-2 border-[#ffd700] pt-5" key={title}><div className="font-mono text-xs text-black/35">0{i+1}</div><h3 className="mt-5 font-display text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{desc}</p></div>)}</div><Link href="/contact" className="btn-gold mt-10">Let’s talk about your goals <ArrowRight size={15} /></Link></div></section><Footer /></>;
}
function ServicesPage() {
  usePageMeta(
    'Creator Monetization Services | SK Media Monetization',
    'Explore YouTube and Facebook monetization, TikTok growth, and content strategy services tailored for creators at every stage of their channel journey.',
  );
  return <><Header /><PageHero kicker="A strategy that meets you where you are" title={<>Make your content<br />work <span className="text-[#ffd700]">smarter.</span></>} intro="Platform monetization, creator growth, and the strategy that ties it together. Practical services designed around your channel—not a cookie-cutter checklist." />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto max-w-[1180px]"><div className="mb-8 max-w-2xl"><div className="eyebrow text-[#826900]">Our services</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em]">A clear path, platform by platform.</h2></div><ServiceGrid detailed /></div></section>
    <section className="section-pad bg-[#111] text-white"><div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[.8fr_1.2fr]"><div><div className="eyebrow text-[#ffd700]">How we work together</div><h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em]">Less guessing.<br />More forward.</h2></div><div className="grid gap-6 sm:grid-cols-3">{[['01','Listen','We learn about your content, audience, and ambition.'],['02','Map it','We build a focused plan from where you are right now.'],['03','Make progress','We support the next steps and adapt as your channel grows.']].map(([n,t,d])=><div key={n} className="border-t border-[#ffd700]/60 pt-4"><div className="text-xs font-mono text-[#ffd700]">{n}</div><h3 className="mt-4 font-display text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-white/50">{d}</p></div>)}</div></div></section>
    <section className="section-pad bg-[#e9e7df]"><div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-7 md:flex-row md:items-center"><div><div className="eyebrow text-[#826900]">Ready when you are</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em]">Let’s find your next step.</h2></div><Link href="/contact" className="btn-gold">Talk to our team <ArrowRight size={15} /></Link></div></section><Footer /></>;
}
function ContactPage() {
  usePageMeta(
    'Contact SK Media Monetization | Dera Ismail Khan, Pakistan',
    'Contact SK Media Monetization for YouTube, Facebook, and TikTok creator support by form, phone, email, or WhatsApp, or visit our Dera Ismail Khan office.',
  );
  return <><Header /><PageHero kicker="Start a conversation" title={<>Your next move<br />starts with a <span className="text-[#ffd700]">hello.</span></>} intro="No complicated pitch deck required. Tell us about your content, your questions, and what you’re working toward." />
    <section className="section-pad bg-[#f8f7f1]"><div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.1fr_.9fr]"><div><div className="eyebrow text-[#826900]">Tell us a little</div><h2 className="mb-7 mt-3 font-display text-3xl font-extrabold tracking-[-.05em]">We’ll take it from here.</h2><ContactForm /></div><aside className="h-fit rounded-2xl bg-[#111] p-7 text-white md:p-9"><div className="eyebrow text-[#ffd700]">Direct line</div><h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em]">Real people.<br />Real replies.</h2><p className="mt-4 text-sm leading-6 text-white/55">Choose whichever way feels easiest. We’ll meet you there.</p><div className="mt-8 grid gap-5 border-t border-white/10 pt-6"><a className="flex items-center gap-4" href={`tel:${primaryPhone.replaceAll(' ', '')}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><MessageCircle size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Phone / WhatsApp</small><b className="mt-1 block text-sm">{primaryPhone}</b></span></a><a className="flex items-center gap-4" href={`tel:${secondaryPhone.replaceAll(' ', '')}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><MessageCircle size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Phone</small><b className="mt-1 block text-sm">{secondaryPhone}</b></span></a><a className="flex items-center gap-4" href={`mailto:${businessEmail}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Mail size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Email</small><b className="mt-1 block text-sm">{businessEmail}</b></span></a><div className="flex items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><MapPin size={18} /></span><span><small className="block text-[10px] uppercase tracking-wider text-white/40">Based in</small><b className="mt-1 block text-sm">{businessAddress}</b></span></div></div><a href={whatsapp} target="_blank" rel="noreferrer" className="btn-gold mt-8 w-full">Message us on WhatsApp <ArrowUpRight size={15} /></a></aside></div></section>
    <div className="bg-[#e9e7df] px-6 py-12"><div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl"><iframe title="Map showing SK Media Monetization in Dera Ismail Khan" src="https://www.google.com/maps?q=Opposite+Daewoo+Terminal,+IT+Park+First+Floor,+Dera+Ismail+Khan&output=embed" className="h-[270px] w-full grayscale-[.65]" loading="lazy" /></div></div><Footer /></>;
}

function AdminLogin() {
  usePageMeta('Admin Sign In | SK Media Monetization', 'Private administrator sign-in for SK Media Monetization.', true);
  const login = useAdminLogin();
  const qc = useQueryClient();
  const [error,setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setError('');const f=new FormData(e.currentTarget);login.mutate({data:{username:String(f.get('username')||''),password:String(f.get('password')||'')}},{onSuccess:()=>qc.invalidateQueries({queryKey:getGetAdminSessionQueryKey()}),onError:()=>setError('That sign-in didn’t work. Check your details and try again.')});};
  return <div className="grid min-h-[100dvh] bg-[#090909] md:grid-cols-[1fr_1fr]">
    <div className="relative hidden overflow-hidden bg-[#000000] p-12 text-white md:flex md:flex-col md:justify-between"><Logo /><div><div className="eyebrow text-[#ffd700]">SK Media · Private workspace</div><h1 className="mt-4 font-display text-6xl font-extrabold leading-[.94] tracking-[-.07em]">Behind every<br />good next step<br />is a <span className="text-[#ffd700] underline decoration-[5px] underline-offset-8">great follow-up.</span></h1><p className="mt-6 max-w-sm text-sm leading-6 text-white/65">Your creator conversations, organized in one place.</p></div><div className="text-xs text-white/50">Dera Ismail Khan · Admin access only</div></div>
    <div className="flex flex-col justify-center px-6 py-14 md:px-[12%]"><div className="mb-12 md:hidden"><Logo light /></div><div className="mx-auto w-full max-w-[390px]"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffd700] text-black"><LockKeyhole size={20} /></div><div className="eyebrow mt-7 text-[#ffd700]">Team access</div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em] text-white">Welcome back.</h2><p className="mt-3 text-sm text-white/45">Sign in to manage creator enquiries.</p><form className="mt-8 grid gap-4" onSubmit={submit}><label className="grid gap-2 text-xs font-semibold text-white/70">Username<input name="username" autoComplete="username" required className="form-field border-white/15 bg-white/[.04] text-white placeholder:text-white/25" data-testid="input-admin-username" /></label><label className="grid gap-2 text-xs font-semibold text-white/70">Password<div className="relative"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="form-field w-full border-white/15 bg-white/[.04] text-white placeholder:text-white/25" data-testid="input-admin-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error&&<p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300" role="alert" data-testid="status-admin-login-error">{error}</p>}<button className="btn-gold mt-2 w-full" type="submit" disabled={login.isPending} data-testid="button-admin-login">{login.isPending?'Checking your details…':'Sign in'} <ArrowRight size={15} /></button></form><Link href="/" className="mt-8 inline-flex text-xs text-white/40 hover:text-[#ffd700]">← Back to the public site</Link></div></div>
  </div>;
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
    <main className="mx-auto max-w-[1400px] px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Private workspace</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Creator enquiries</h1><p className="mt-2 text-sm text-black/50">A clear view of the conversations coming your way.</p></div><button onClick={()=>{contactsQuery.refetch();summaryQuery.refetch();}} className="btn-outline w-fit border-black/20 !px-4 !py-2.5 text-xs" data-testid="button-refresh-leads"><TrendingUp size={14} /> Refresh leads</button></div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">{[['Total enquiries',summaryQuery.data?.total,'All time'],['New',summaryQuery.data?.new,'Needs a first reply'],['Contacted',summaryQuery.data?.contacted,'Follow-up started']].map(([title,value,sub],i)=><div key={String(title)} className="rounded-xl border border-black/10 bg-[#fbfaf6] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-black/55">{title}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${i===1?'bg-[#ffd700]':'bg-black/5'}`}>{i===0?<Users size={15}/>:i===1?<CircleHelp size={15}/>:<Check size={15}/>}</span></div><div className="mt-4 font-display text-4xl font-extrabold tracking-[-.06em]" data-testid={`text-summary-${String(title).toLowerCase().replace(' ','-')}`}>{summaryQuery.isLoading?<span className="inline-block h-9 w-14 animate-pulse rounded bg-black/10"/>:value??'—'}</div><div className="mt-1 text-[11px] text-black/40">{sub}</div></div>)}</div>
      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf6]">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-5 md:flex-row md:items-center md:p-6"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">All leads</h2><p className="mt-1 text-xs text-black/45">{visible.length} {visible.length===1?'conversation':'conversations'} shown</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={15}/><input className="form-field !rounded-lg !py-2.5 pl-9 text-xs sm:w-[230px]" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" aria-label="Search leads" data-testid="input-lead-search"/></label><select className="form-field !rounded-lg !py-2.5 text-xs sm:w-[150px]" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} aria-label="Filter leads by status" data-testid="select-lead-filter"><option value="all">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option></select></div></div>
        {actionError&&<div className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="status-admin-action-error">{actionError}</div>}
        {contactsQuery.isLoading?<div className="grid gap-3 p-5">{[1,2,3].map(x=><div key={x} className="h-16 animate-pulse rounded-lg bg-black/[.05]"/> )}</div>
        :contactsQuery.isError?<div className="p-10 text-center"><div className="font-semibold">We couldn’t load your leads.</div><p className="mt-2 text-sm text-black/50">Try again in a moment.</p><button onClick={()=>contactsQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs" data-testid="button-retry-leads">Retry <ArrowRight size={14}/></button></div>
        :visible.length===0?<div className="px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ffd700]/40"><Search size={19}/></div><h3 className="mt-4 font-display text-xl font-bold">{contacts.length===0?'No enquiries yet':'No matching leads'}</h3><p className="mt-2 text-sm text-black/45">{contacts.length===0?'New creator conversations will appear here when they reach out.':'Try changing your search or status filter.'}</p>{(search||filter!=='all')&&<button onClick={()=>{setSearch('');setFilter('all');}} className="mt-4 text-xs font-bold underline underline-offset-4" data-testid="button-clear-filters">Clear filters</button>}</div>
        :<div className="overflow-x-auto"><table className="admin-table w-full min-w-[890px]"><thead><tr><th>Creator</th><th>Platform</th><th>Message</th><th>Received</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{visible.map(contact=><tr key={contact.id} data-testid={`row-lead-${contact.id}`}><td><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ffd700] text-xs font-extrabold">{contact.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><div><div className="text-sm font-bold">{contact.name}</div><a className="mt-1 block text-xs text-black/50 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a><a className="mt-1 block text-[11px] text-black/40" href={`tel:${contact.phone}`}>{contact.phone}</a></div></div></td><td><span className="inline-flex items-center gap-2 text-xs font-semibold"><PlatformMark platform={contact.platform}/>{contact.platform}</span></td><td className="max-w-[220px] text-xs leading-5 text-black/60">{contact.message||<span className="italic text-black/30">No message included</span>}</td><td className="whitespace-nowrap text-xs text-black/55">{new Date(contact.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</td><td><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${contact.status==='new'?'bg-[#fff1a6] text-[#705900]':'bg-[#e8eee7] text-[#466047]'}`}>{contact.status}</span></td><td><div className="flex justify-end gap-2"><button onClick={()=>mutateStatus(contact)} disabled={update.isPending} className="rounded-lg border border-black/15 px-3 py-2 text-[10px] font-bold hover:border-black/50" data-testid={`button-status-${contact.id}`}>{contact.status==='new'?'Mark contacted':'Mark new'}</button><button onClick={()=>deleteLead(contact)} disabled={remove.isPending} aria-label={`Delete enquiry from ${contact.name}`} className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50" data-testid={`button-delete-${contact.id}`}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <p className="mt-5 text-[11px] text-black/40">Lead data is private to your team. Keep creator details confidential.</p>
    </main>
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
  return <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Chat with SK Media on WhatsApp" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#ffd700] text-black shadow-xl transition-transform hover:scale-105" data-testid="link-whatsapp-floating"><MessageCircle size={22} /></a>;
}
function Router() {
  const [path] = useLocation();
  return <><RouteBoundary><Switch>
    <Route path="/" component={Landing} />
    <Route path="/about" component={AboutPage} />
    <Route path="/services" component={ServicesPage} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/admin" component={AdminPage} />
    <Route component={NotFound} />
  </Switch></RouteBoundary>{path !== '/admin' && <FloatingWhatsApp />}</>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
