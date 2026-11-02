import { useState } from "react";
import { formatPrice } from "@/utils/formatPrice";

const monthName = key => new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });

// a few round numbers for the y axis: 0, step, 2*step... covering the max
const niceTicks = max => {
  if (max <= 0) return [0, 500, 1000];
  const rough = max / 3;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map(m => m * power).find(m => m >= rough);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
};

const compactRupees = value => (value >= 1000 ? `₹${(value / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k` : `₹${value}`);

// one series (revenue kept per month), so one hue and no legend: the card title names it
export const RevenueChart = ({ months }) => {
  const [hover, setHover] = useState(null);
  const ticks = niceTicks(Math.max(...months.map(m => m.revenue)));
  const top = ticks[ticks.length - 1];
  const latest = months.length - 1;

  return (
    <div>
      <div className="relative flex h-56 gap-3">
        {/* y axis labels */}
        <div className="flex flex-col-reverse justify-between pb-6 text-right text-[11px] text-muted-foreground">
          {ticks.map(tick => <span key={tick} className="leading-none">{compactRupees(tick)}</span>)}
        </div>
        <div className="relative flex-1">
          {/* recessive grid */}
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col-reverse justify-between">
            {ticks.map(tick => <div key={tick} className={`border-t ${tick === 0 ? "border-border" : "border-dashed border-border/60"}`} />)}
          </div>
          <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-3 sm:gap-5">
            {months.map((month, index) => {
              const height = top ? (month.revenue / top) * 100 : 0;
              const active = hover === index;
              return (
                <div
                  key={month.month}
                  className="relative flex h-full flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(index)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${monthName(month.month)}: ${formatPrice(month.revenue)} from ${month.bookings} bookings`}
                >
                  <div className="relative flex w-full flex-1 items-end justify-center pb-6">
                    <div
                      className={`w-full max-w-[44px] rounded-t-[4px] transition-colors ${active ? "bg-primary" : index === latest ? "bg-primary/85" : "bg-primary/55"}`}
                      style={{ height: `${height}%`, minHeight: month.revenue ? 4 : 0 }}
                    />
                    {/* selective direct label: only the current month */}
                    {index === latest && !active && month.revenue > 0 && (
                      <span className="absolute text-xs font-bold text-foreground" style={{ bottom: `calc(${height}% + 4px)` }}>
                        {compactRupees(month.revenue)}
                      </span>
                    )}
                    {active && (
                      <div className="pointer-events-none absolute z-10 w-max rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-panelShadow" style={{ bottom: `calc(${height}% + 8px)` }}>
                        <p className="font-semibold">{new Date(`${month.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                        <p className="text-muted-foreground">{formatPrice(month.revenue)} · {month.bookings} booking{month.bookings === 1 ? "" : "s"}</p>
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-0 text-[11px] text-muted-foreground">{monthName(month.month)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ranked list with thin bars: specialty -> number of paid bookings
export const SpecialtyBars = ({ items }) => {
  const max = Math.max(1, ...items.map(item => item.bookings));
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No bookings yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.specialization} title={`${item.bookings} bookings`}>
          <div className="flex justify-between text-sm">
            <span className="font-medium capitalize">{item.specialization}</span>
            <span className="text-muted-foreground">{item.bookings}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.bookings / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};
