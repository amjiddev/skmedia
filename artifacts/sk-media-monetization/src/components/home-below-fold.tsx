import { ArrowRight, ArrowUpRight, Check, Clapperboard, MapPin, ShieldCheck, Sparkles, Target, TrendingUp, Users, Video, Youtube } from 'lucide-react';
import { Link } from 'wouter';
import type { FAQEntry, HomePageContent, ServiceCardContent } from '@workspace/api-client-react';

const homeFeatureIcons = {
  users: Users,
  shield: ShieldCheck,
  target: Target,
  trend: TrendingUp,
  youtube: Youtube,
  facebook: Users,
  tiktok: Video,
  pin: MapPin,
  video: Video,
  sparkles: Sparkles,
  clapperboard: Clapperboard,
};

const defaultFaqs: FAQEntry[] = [
  { id: 'faq-following', question: 'Do I need a large following to work with you?', answer: 'Not at all. We meet you where you are. We’ll look at your content, goals, and platform eligibility, then map the most sensible next step.', isPublished: true },
  { id: 'faq-platforms', question: 'Which platforms do you support?', answer: 'We work across YouTube, Facebook, and TikTok, with content strategy that can support your wider creator presence too.', isPublished: true },
  { id: 'faq-guarantee', question: 'Can you guarantee monetization or earnings?', answer: 'No one can responsibly guarantee platform approval or a specific income. We offer experienced guidance, clear next steps, and hands-on support—without promises that depend on platform decisions.', isPublished: true },
  { id: 'faq-conversation', question: 'How does the first conversation work?', answer: 'We start with a straightforward conversation about your content and goals, then share practical next steps that fit where you are today.', isPublished: true },
];

function FAQ({ faqs }: { faqs: FAQEntry[] }) {
  return <div className="divide-y divide-black/15 border-y border-black/15">{faqs.map((faq, index) => <details className="faq-item py-5" key={faq.id} open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[16px] font-bold tracking-[-.03em] md:text-lg">{faq.question}<span className="faq-mark grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/20"><span className="text-lg leading-none">+</span></span></summary><p className="max-w-2xl whitespace-pre-line pt-4 pr-12 text-sm leading-6 text-black/60">{faq.answer}</p></details>)}</div>;
}

function TrustFeatures({ title, cards }: { title: string; cards: HomePageContent['trust']['cards'] }) {
  return <section className="section-pad bg-[#080808] text-white">
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-8 text-center"><h2 className="mt-3 font-sans text-3xl font-bold tracking-[-.05em] md:text-5xl">{title}</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title: cardTitle, description, icon }, index) => {
          const Icon = homeFeatureIcons[icon];
          return <article key={`${cardTitle}-${index}`} className="trust-card rounded-xl border border-white/10 bg-white/[.03] p-5" data-testid={`card-trust-${cardTitle.toLowerCase().replaceAll(' ', '-')}`}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffd700] text-black"><Icon size={19} /></span>
            <h3 className="mt-5 font-display text-[16px] font-bold">{cardTitle}</h3>
            <p className="mt-2 text-xs leading-5 text-white/55">{description}</p>
          </article>;
        })}
      </div>
    </div>
  </section>;
}

function ServiceGrid({ services }: { services: ServiceCardContent[] }) {
  return <div className="grid gap-4 md:grid-cols-2">
    {services.map((service, index) => {
      const Icon = homeFeatureIcons[service.icon];
      return <article id={`service-${service.number}`} key={`${service.number}-${index}`} className="service-card rounded-xl border border-white/10 border-t-[3px] border-t-[#d4af37] bg-[#111] p-6 md:p-8">
        <div className="flex items-center justify-between gap-4"><h3 className="min-w-0 flex-1 font-display text-[25px] font-extrabold tracking-[-.05em]">{service.title}</h3><span className={`service-icon grid shrink-0 ${service.logo ? 'h-14 w-14' : 'h-10 w-10'} place-items-center overflow-hidden rounded-full bg-[#ffd700] text-black`}>{service.logo ? <img src={service.logo} alt={`${service.title} logo`} className="h-full w-full object-contain p-1" loading="lazy" decoding="async" width={112} height={112} /> : <Icon size={18} />}</span></div>
        <p className="mt-3 max-w-md text-sm leading-6 text-black/60">{service.description}</p>
        <Link href="/contact" className="line-link mt-6 inline-flex items-center gap-2 text-xs font-bold" data-testid={`link-service-${service.number}`}>{service.ctaLabel} <ArrowUpRight size={14} /></Link>
      </article>;
    })}
  </div>;
}

export default function HomeBelowFold({ home, faqContent }: { home: HomePageContent; faqContent?: { title: string; description: string; faqs: FAQEntry[] } }) {
  return <>
    <TrustFeatures title={home.trust.title} cards={home.trust.cards} />
    <section className="section-pad bg-[#f8f7f1]">
      <div className="mx-auto grid max-w-[1180px] gap-10">
        <div className="text-center"><h2 className="mt-4 font-sans text-3xl font-bold leading-[1.02] tracking-[-.06em] md:text-5xl">{home.opportunity.title}</h2></div>
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">{home.opportunity.steps.map((step, index) => <div className="border-l-2 border-[#ffd700] pl-5" key={`${step.number}-${index}`}><span className="font-display text-3xl font-extrabold">{step.number}</span><h3 className="mt-2 font-bold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{step.description}</p></div>)}</div>
      </div>
    </section>
    <section id="services" className="section-pad bg-[#e9e7df]">
      <div className="mx-auto max-w-[1180px]"><div className="mb-9 flex flex-col items-center gap-4 text-center"><div><h2 className="mt-3 whitespace-normal font-sans text-3xl font-bold tracking-[-.06em] md:whitespace-nowrap md:text-5xl">{home.services.title}</h2></div></div><ServiceGrid services={home.services.cards} /></div>
    </section>
    <section className="section-pad relative isolate overflow-hidden bg-[#ffd700]">
      <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-[#d4af37]/25 bg-gradient-to-br from-[#171717] via-[#0b0b0b] to-[#111] px-6 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:px-10 sm:py-16 lg:px-16">
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="mx-auto mt-6 max-w-5xl whitespace-normal font-sans text-3xl font-bold leading-tight tracking-[-.065em] md:whitespace-nowrap md:text-5xl">{home.story.title}</h2>
          <p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-white/65 md:text-lg">{home.story.intro}</p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/45">{home.story.detail}</p>
          <div className="mx-auto mt-9 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
            {home.story.benefits.map((benefit, index) => {
              const Icon = homeFeatureIcons[benefit.icon];
              return <div key={`${benefit.text}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4"><Icon className="shrink-0 text-[#ffd700]" size={19} /><span className="text-sm font-semibold text-white/80">{benefit.text}</span></div>;
            })}
          </div>
          <Link href="/about" className="btn-gold mt-9" data-testid="link-story">{home.story.ctaLabel} <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </section>
    <section className="section-pad bg-[#e9e7df]">
      <div className="mx-auto max-w-[1180px]"><div className="mb-9 text-center"><h2 className="mt-4 whitespace-normal font-sans text-3xl font-bold tracking-[-.06em] md:whitespace-nowrap md:text-5xl">{faqContent?.title ?? 'Your Questions, Answered Clearly'}</h2><p className="mt-4 whitespace-pre-line text-sm leading-6 text-black/55">{faqContent?.description ?? 'Still deciding if we’re the right fit? Start here.'}</p><Link href="/contact" className="line-link mt-5 inline-flex items-center gap-2 text-sm font-bold">{home.faq.askLabel} <ArrowRight size={15} /></Link></div><div className="mx-auto max-w-4xl"><FAQ faqs={faqContent?.faqs ?? defaultFaqs} /></div></div>
    </section>
  </>;
}
