import { BarChart3, TrendingUp } from 'lucide-react';

import type { HomePageContent } from '@workspace/api-client-react';

export default function EarningsCard({ hero }: { hero: HomePageContent['hero'] }) {
  const earnings = hero.chartMonths.map(({ month, earnings: value, bonus }) => ({ month, value, bonus }));
  const maximum = Math.max(1, ...earnings.map(({ value, bonus }) => value + bonus));
  const chartTop = 8;
  const chartBottom = 122;
  const chartHeight = chartBottom - chartTop;
  const groupWidth = 320 / Math.max(1, earnings.length);
  const barWidth = Math.min(12, groupWidth * 0.28);

  return (
    <div className="earnings-card relative mx-auto w-full max-w-[470px] rotate-[1deg] rounded-[24px] border border-white/15 bg-black p-5 text-white shadow-[0_32px_90px_rgba(0,0,0,.45)] md:p-7">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium text-white/45">{hero.chartTitle}</div>
          <div className="mt-2 font-display text-[32px] font-extrabold tracking-[-.06em] md:text-[40px]">{hero.chartTotal}</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#ffd700]/15 px-2.5 py-1 text-[10px] font-bold text-[#ffd700]">
            <TrendingUp size={12} /> {hero.chartGrowth}
            <span className="font-normal text-white/55">{hero.chartGrowthCaption}</span>
          </div>
        </div>
        <span className="rounded-lg bg-white/5 p-2 text-[#ffd700]"><BarChart3 size={18} /></span>
      </div>
      <div className="mt-6 h-[155px] w-full">
        <svg
          className="h-full w-full"
          viewBox="0 0 320 155"
          preserveAspectRatio="none"
          role="img"
          aria-label="Sample monthly creator earnings chart"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = chartTop + (chartHeight * line) / 3;
            return <line key={line} x1="0" x2="320" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />;
          })}
          {earnings.map(({ month, value, bonus }, index) => {
            const center = groupWidth * (index + 0.5);
            const valueHeight = (value / maximum) * chartHeight;
            const bonusHeight = (bonus / maximum) * chartHeight;
            return (
              <g key={month}>
                <rect
                  x={center - barWidth - 1}
                  y={chartBottom - valueHeight}
                  width={barWidth}
                  height={valueHeight}
                  rx="2"
                  fill="#ffd700"
                >
                  <title>{`${month} ad revenue: $${value.toLocaleString()}`}</title>
                </rect>
                <rect
                  x={center + 1}
                  y={chartBottom - bonusHeight}
                  width={barWidth}
                  height={bonusHeight}
                  rx="2"
                  fill="#60a5fa"
                >
                  <title>{`${month} creator bonuses: $${bonus.toLocaleString()}`}</title>
                </rect>
                <text x={center} y="145" fill="rgba(255,255,255,.48)" fontSize="9" textAnchor="middle">
                  {month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4">
        {hero.chartPlatforms.map(({ name, amount }) => (
          <div className="px-2 first:pl-0" key={name}>
            <div className="text-[9px] text-white/40">{name}</div>
            <div className="mt-1 text-xs font-bold md:text-sm">{amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
