import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck2, ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import DoctorCard, { DoctorCardSkeleton } from "@/components/Doctors/DoctorCard";
import Error from "@/components/Error/Error";
import PageHero from "@/components/Home/PageHero";
import NextAppointment from "@/components/Booking/NextAppointment";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/utils/api";
import SymptomCheckCard from "@/components/Symptoms/SymptomCheckCard";

const PAGE_SIZE = 6;

const PRICE_BANDS = [
  { value: "", label: "Any fee" },
  { value: "0-500", label: "Up to ₹500" },
  { value: "500-800", label: "₹500 – ₹800" },
  { value: "800-", label: "₹800 and above" },
];
// a fee range from the AI search that isn't one of the bands is added as its own option
const priceOptions = price => {
  if (!price || PRICE_BANDS.some(band => band.value === price)) return PRICE_BANDS;
  const [min, max] = price.split("-").map(Number);
  const label = max ? (min ? `₹${min} – ₹${max}` : `Up to ₹${max}`) : `₹${min} and above`;
  return [...PRICE_BANDS, { value: price, label }];
};

const RATINGS = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4★ and up" },
  { value: "4.5", label: "4.5★ and up" },
];
const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "price_low", label: "Fee: low to high" },
  { value: "price_high", label: "Fee: high to low" },
];

const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="flex min-w-0 flex-col gap-1">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="h-10 rounded-xl border border-input bg-card px-3 text-sm font-medium capitalize focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
    >
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

// 1 … 4 5 6 … 12
const pageNumbers = (page, pages) => {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["gap", n] : [n]));
};

const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pages">
      <Button variant="outline" size="icon" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pageNumbers(page, pages).map((n, index) =>
        n === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground">…</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-colors ${
              n === page ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:border-primary/50 hover:text-primary"
            }`}
          >
            {n}
          </button>
        )
      )}
      <Button variant="outline" size="icon" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams();
  // everything lives in the URL so a search can be shared, reloaded or opened from the home page
  const filters = {
    query: searchParams.get("query") || "",
    specialty: searchParams.get("specialty") || "",
    price: searchParams.get("price") || "",
    rating: searchParams.get("rating") || "",
    sort: searchParams.get("sort") || "recommended",
    today: searchParams.get("today") === "1",
    page: Math.max(1, Number(searchParams.get("page")) || 1),
  };
  const [query, setQuery] = useState(filters.query);
  // search in plain words ("skin doctor under 600 free today", Hindi too): the AI turns it into the filters below
  const [ask, setAsk] = useState("");
  const [asking, setAsking] = useState(false);
  const [understood, setUnderstood] = useState(null);
  const [result, setResult] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // change some filters; anything other than the page number starts again at page 1
  const update = changes => {
    const next = { ...filters, page: 1, ...changes };
    const params = {};
    if (next.query) params.query = next.query;
    if (next.specialty) params.specialty = next.specialty;
    if (next.price) params.price = next.price;
    if (next.rating) params.rating = next.rating;
    if (next.sort !== "recommended") params.sort = next.sort;
    if (next.today) params.today = "1";
    if (next.page > 1) params.page = String(next.page);
    setSearchParams(params, { replace: !("page" in changes) });
  };

  // the URL changed from outside (back button, a link to /doctors): show its search text
  useEffect(() => {
    if (filters.query !== query.trim()) setQuery(filters.query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query]);

  // wait until the user stops typing before searching
  useEffect(() => {
    if (query.trim() === filters.query) return;
    const timeout = setTimeout(() => update({ query: query.trim() }), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const apiParams = useMemo(() => {
    const [minPrice, maxPrice] = filters.price.split("-");
    const params = new URLSearchParams({ page: String(filters.page), limit: String(PAGE_SIZE), sort: filters.sort });
    if (filters.query) params.set("query", filters.query);
    if (filters.specialty) params.set("specialty", filters.specialty);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (filters.rating) params.set("minRating", filters.rating);
    if (filters.today) params.set("availableToday", "true");
    return params.toString();
  }, [filters.query, filters.specialty, filters.price, filters.rating, filters.sort, filters.today, filters.page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiRequest(`/doctors?${apiParams}`)
      .then(data => !cancelled && setResult(data))
      .catch(err => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiParams]);

  const doctors = result?.data || [];
  const pagination = result?.pagination || { page: 1, pages: 1, total: 0 };
  const specialties = result?.facets?.specialties || [];
  const activeCount = [filters.specialty, filters.price, filters.rating, filters.today].filter(Boolean).length + (filters.query ? 1 : 0);
  const clearFilters = () => {
    setQuery("");
    setSearchParams({}, { replace: true });
  };
  // the same fields in the desktop row and the phone sheet
  const filterFields = (
    <>
      <FilterSelect
        label="Specialty"
        value={filters.specialty.toLowerCase()}
        onChange={specialty => update({ specialty })}
        options={[{ value: "", label: "All specialties" }, ...specialties.map(item => ({ value: item.name, label: `${item.label || item.name} (${item.count})` }))]}
      />
      <FilterSelect label="Consultation fee" value={filters.price} onChange={price => update({ price })} options={priceOptions(filters.price)} />
      <FilterSelect label="Patient rating" value={filters.rating} onChange={rating => update({ rating })} options={RATINGS} />
      <FilterSelect label="Sort by" value={filters.sort} onChange={sort => update({ sort })} options={SORTS} />
    </>
  );

  const askAi = async event => {
    event.preventDefault();
    if (ask.trim().length < 3) return;
    setAsking(true);
    try {
      const { data } = await apiRequest(`/doctors/search/ai?q=${encodeURIComponent(ask.trim())}`);
      const price = data.minPrice || data.maxPrice ? `${data.minPrice || 0}-${data.maxPrice || ""}` : "";
      setQuery(data.name || "");
      update({
        query: data.name || "",
        specialty: data.specialty || "",
        price,
        rating: data.minRating ? String(data.minRating) : "",
        sort: data.sort || "recommended",
        today: Boolean(data.availableToday),
      });
      setUnderstood({ text: data.understood || "All doctors", source: data.source });
    } catch (error) {
      setUnderstood({ text: error.message, error: true });
    }
    setAsking(false);
  };

  const changePage = page => {
    update({ page });
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <>
      <PageHero
        eyebrow="Find a doctor"
        title={<>Book the <span className="gradient-text">right specialist</span></>}
        subtitle="Search verified doctors by name or specialty and book a free slot instantly."
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            update({ query: query.trim() });
          }}
          className="glass mx-auto flex max-w-2xl items-center gap-2 rounded-full p-2 shadow-soft focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"
        >
          <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by doctor name or specialty"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search doctors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                update({ query: "" });
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <form onSubmit={askAi} className="mx-auto mt-3 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1.5 focus-within:border-primary/60">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <input
              type="text"
              value={ask}
              maxLength={200}
              onChange={e => setAsk(e.target.value)}
              placeholder="Or describe it: child with fever, under ₹600, today"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Describe the doctor you need"
            />
          </div>
          <Button type="submit" size="sm" variant="soft" disabled={asking || ask.trim().length < 3}>
            {asking ? <Spinner className="h-4 w-4" /> : "Find with AI"}
          </Button>
        </form>
        {understood && (
          <p className={`mx-auto mt-2 max-w-2xl text-center text-xs ${understood.error ? "text-destructive" : "text-muted-foreground"}`}>
            {understood.error ? understood.text : <>Showing: <span className="font-semibold text-foreground">{understood.text}</span>{understood.source === "rules" && " (quick match)"}</>}
          </p>
        )}

        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
          {specialties.map(item => {
            const active = filters.specialty.toLowerCase() === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => update({ specialty: active ? "" : item.name })}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card/60 text-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {item.label || item.name}
              </button>
            );
          })}
        </div>
      </PageHero>

      <section className="pt-0">
        <div className="container">
          <NextAppointment />
          {/* on phones the floating button and the menu lead to the checker, so the card would only push results down */}
          <div className="mb-6 hidden sm:block">
            <SymptomCheckCard />
          </div>

          {/* filters: a row on larger screens */}
          <div className="card-surface mb-6 hidden gap-3 p-4 sm:grid sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
            {filterFields}
            <Button variant="ghost" className="h-10" disabled={activeCount === 0} onClick={clearFilters}>
              <X className="h-4 w-4" /> Clear{activeCount > 0 && ` (${activeCount})`}
            </Button>
          </div>

          {/* on phones: one sticky bar with the count, the filters open in a sheet from the bottom */}
          <div className="sticky top-[72px] z-30 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-xl sm:hidden">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
              {loading ? "Searching…" : `${pagination.total} ${pagination.total === 1 ? "doctor" : "doctors"}`}
            </p>
            <Button size="sm" variant={activeCount ? "default" : "outline"} onClick={() => setSheetOpen(true)} aria-expanded={sheetOpen}>
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && ` (${activeCount})`}
            </Button>
          </div>
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close filters"
                  className="fixed inset-0 z-[70] bg-slate-950/40 sm:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSheetOpen(false)}
                />
                <motion.div
                  role="dialog"
                  aria-label="Filters"
                  className="fixed inset-x-0 bottom-0 z-[71] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-popover px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 shadow-panelShadow sm:hidden"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%", transition: { duration: 0.18, ease: "easeIn" } }}
                  transition={{ type: "spring", stiffness: 380, damping: 36 }}
                >
                  <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">Filters</p>
                    <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">{filterFields}</div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button variant="outline" disabled={activeCount === 0} onClick={clearFilters}>Clear all</Button>
                    <Button onClick={() => setSheetOpen(false)}>
                      {loading ? <Spinner className="h-4 w-4" /> : `Show ${pagination.total} ${pagination.total === 1 ? "doctor" : "doctors"}`}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {!loading && !error && (
            <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              {pagination.total} {pagination.total === 1 ? "doctor" : "doctors"} found
              {filters.query && <> for &ldquo;<span className="font-semibold text-foreground">{filters.query}</span>&rdquo;</>}
              {pagination.pages > 1 && <span>· page {pagination.page} of {pagination.pages}</span>}
              {/* doctors with a free slot today (shown while there are any, or while the filter is on) */}
              {(result?.availableToday > 0 || filters.today) && (
                <button
                  type="button"
                  aria-pressed={filters.today}
                  onClick={() => update({ today: !filters.today })}
                  className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filters.today ? "border-success bg-success/15 text-success" : "border-border bg-card text-foreground hover:border-success/60"
                  }`}
                >
                  <CalendarCheck2 className="h-3.5 w-3.5" /> Available today
                </button>
              )}
            </p>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }, (_, index) => <DoctorCardSkeleton key={index} />)}
            </div>
          )}

          {error && !loading && <Error errMessage="We couldn't load doctors right now. Please try again shortly." />}

          {!loading && !error && doctors.length > 0 && (
            <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {doctors.map((doctor, index) => (
                  <motion.div
                    key={doctor._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <DoctorCard doctor={doctor} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && !error && doctors.length === 0 && (
            <div className="card-surface mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <SearchX className="h-7 w-7" />
              </span>
              <h3 className="text-lg font-bold">No doctors found</h3>
              <p className="text-sm text-muted-foreground">Try another name, a wider fee range or a lower rating.</p>
              {activeCount > 0 && (
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    setQuery("");
                    setSearchParams({}, { replace: true });
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {!loading && !error && <Pagination page={pagination.page} pages={pagination.pages} onChange={changePage} />}
        </div>
      </section>
    </>
  );
}

export default Doctors;
