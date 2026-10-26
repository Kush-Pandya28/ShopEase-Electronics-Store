import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiHeadphones,
  FiWatch,
  FiCamera,
  FiTv,
  FiSpeaker,
  FiBatteryCharging,
  FiHome,
  FiArrowRight,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiCreditCard,
  FiZap,
  FiClock,
  FiStar,
} from 'react-icons/fi';
import { FaGamepad, FaKeyboard } from 'react-icons/fa';
import Seo from '../components/common/Seo';
import ProductSlider from '../components/product/ProductSlider';
import { Skeleton } from '../components/common/Loader';
import {
  useGetBannersQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetFeaturedQuery,
  useGetDealsQuery,
  useGetNewArrivalsQuery,
  useGetProductsQuery,
} from '../services/productApi';
import { formatPrice } from '../utils/format';

const CATEGORY_STYLE = {
  smartphone: { icon: FiSmartphone, tile: 'from-indigo-500 to-violet-600' },
  laptop: { icon: FiMonitor, tile: 'from-sky-500 to-blue-700' },
  tablet: { icon: FiTablet, tile: 'from-cyan-500 to-teal-600' },
  headphones: { icon: FiHeadphones, tile: 'from-rose-500 to-pink-600' },
  watch: { icon: FiWatch, tile: 'from-amber-500 to-orange-600' },
  camera: { icon: FiCamera, tile: 'from-red-500 to-rose-700' },
  tv: { icon: FiTv, tile: 'from-blue-600 to-indigo-800' },
  speaker: { icon: FiSpeaker, tile: 'from-orange-500 to-red-600' },
  gamepad: { icon: FaGamepad, tile: 'from-emerald-500 to-green-700' },
  keyboard: { icon: FaKeyboard, tile: 'from-slate-500 to-slate-800' },
  battery: { icon: FiBatteryCharging, tile: 'from-lime-500 to-emerald-600' },
  home: { icon: FiHome, tile: 'from-fuchsia-500 to-purple-700' },
};

const isPhoto = (url = '') => Boolean(url) && !url.startsWith('data:image/svg');

const OFFER_STYLES = [
  'from-violet-600 via-indigo-600 to-blue-600',
  'from-sky-500 via-blue-600 to-indigo-700',
  'from-rose-500 via-red-500 to-orange-500',
];

const BUDGETS = [
  {
    label: 'Under ₹2,000',
    hint: 'Earbuds, chargers, smartwatches',
    to: '/products?maxPrice=2000&sort=popularity',
    tone: 'from-emerald-400 to-teal-500',
  },
  {
    label: '₹2,000 - ₹15,000',
    hint: 'Speakers, headphones, accessories',
    to: '/products?minPrice=2000&maxPrice=15000&sort=popularity',
    tone: 'from-sky-400 to-blue-500',
  },
  {
    label: '₹15,000 - ₹50,000',
    hint: 'Phones, tablets, TVs',
    to: '/products?minPrice=15000&maxPrice=50000&sort=popularity',
    tone: 'from-violet-400 to-purple-500',
  },
  {
    label: 'Premium ₹50,000+',
    hint: 'Flagships, MacBooks, OLED TVs',
    to: '/products?minPrice=50000&sort=price_desc',
    tone: 'from-amber-400 to-orange-500',
  },
];

const PERKS = [
  { icon: FiTruck, title: 'Free delivery', text: 'On orders above ₹999' },
  { icon: FiCreditCard, title: 'No-cost EMI', text: 'On major credit cards' },
  { icon: FiRefreshCw, title: '7 day replacement', text: 'Hassle-free returns' },
  { icon: FiShield, title: '100% genuine', text: 'With brand warranty' },
];

function SectionHeader({ eyebrow, title, action, to }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {to && (
        <Link
          to={to}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {action || 'View all'} <FiArrowRight className="transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

/** Rotating "hot right now" product spotlight shown in the hero */
function Spotlight({ products }) {
  const [index, setIndex] = useState(0);
  const list = products.slice(0, 5);

  useEffect(() => {
    if (list.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), 4000);
    return () => clearInterval(id);
  }, [list.length]);

  if (!list.length) return <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-3xl" />;
  const p = list[index % list.length];

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={p._id}
          initial={{ opacity: 0, y: 20, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -20, rotate: 2 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
        >
          <Link to={`/product/${p.slug}`} className="block">
            <div className="relative overflow-hidden rounded-2xl">
              <img src={p.images?.[0]?.url} alt={p.title} className="aspect-square w-full object-cover" />
              {p.discountPercent > 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-gray-900 shadow">
                  {p.discountPercent}% OFF
                </span>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Hot right now</p>
                <p className="truncate text-lg font-bold">{p.title}</p>
                <p className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-xl font-extrabold">{formatPrice(p.price)}</span>
                  {p.mrp > p.price && (
                    <span className="text-sm text-white/50 line-through">{formatPrice(p.mrp)}</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white p-3 text-gray-900 shadow-lg transition hover:scale-105">
                <FiArrowRight />
              </span>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex justify-center gap-1.5">
        {list.map((item, i) => (
          <button
            key={item._id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${item.title}`}
            className={`h-1.5 rounded-full transition-all ${i === index % list.length ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>

      {/* Floating trust chips */}
      <div className="pointer-events-none absolute -left-10 bottom-28 hidden animate-float rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-xl lg:flex lg:items-center lg:gap-2">
        <FiCreditCard className="text-brand-600" /> No-cost EMI
      </div>
      <div className="pointer-events-none absolute -right-8 top-1/2 hidden animate-float-slow rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-xl lg:flex lg:items-center lg:gap-2">
        <FiTruck className="text-emerald-600" /> Free delivery
      </div>
    </div>
  );
}

function Hero() {
  const user = useSelector((s) => s.auth.user);
  const featured = useGetFeaturedQuery();
  const { data: all } = useGetProductsQuery({ limit: 1 });
  const { data: brands } = useGetBrandsQuery();
  const firstName = user?.name?.split(' ')[0];

  const stats = [
    { value: all?.total ? `${all.total}+` : '100+', label: 'Products' },
    { value: brands?.items?.length ? `${brands.items.length}+` : '40+', label: 'Top brands' },
    { value: '₹0', label: 'Delivery above ₹999' },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
      {/* Animated colour blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-10 h-80 w-80 animate-blob rounded-full bg-sky-500/30 blur-3xl [animation-delay:-5s]" />
      <div className="pointer-events-none absolute right-1/3 top-10 h-48 w-48 animate-blob rounded-full bg-indigo-500/40 blur-3xl [animation-delay:-9s]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:22px_22px]" />

      <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur"
          >
            <FiZap className="text-amber-300" /> Mega Electronics Sale is live · up to 80% off
          </motion.span>
          {firstName && (
            <p className="mt-5 text-sm font-medium text-white/70">Hi {firstName}, great to see you 👋</p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${firstName ? 'mt-2' : 'mt-5'} text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl`}
          >
            Upgrade your tech.
            <span className="block bg-gradient-to-r from-amber-300 via-pink-300 to-sky-300 bg-clip-text text-transparent">
              Pay less for it.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 max-w-xl text-base text-white/75 sm:text-lg"
          >
            The latest phones, laptops, audio and smart gadgets from brands you love, with GST invoice, brand
            warranty and delivery to your doorstep.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/products?sort=discount"
              className="btn bg-white px-6 py-3 text-base text-gray-900 shadow-lg shadow-black/20 hover:bg-gray-100"
            >
              Shop today&apos;s deals <FiArrowRight />
            </Link>
            <Link
              to="/products?sort=newest"
              className="btn border border-white/30 bg-white/10 px-6 py-3 text-base text-white backdrop-blur hover:bg-white/20"
            >
              New arrivals
            </Link>
          </motion.div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-2xl font-extrabold sm:text-3xl">{s.value}</dt>
                <dd className="text-xs text-white/60 sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Spotlight products={featured.data?.products || []} />
      </div>
    </section>
  );
}

function Perks() {
  return (
    <section className="relative z-10 mx-auto -mt-6 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-lg dark:border-gray-800 dark:bg-gray-800 md:grid-cols-4">
      {PERKS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3 bg-white p-4 dark:bg-gray-900">
          <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs leading-snug text-gray-500">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Categories() {
  const { data, isLoading } = useGetCategoriesQuery();
  return (
    <section className="mt-14">
      <SectionHeader eyebrow="Explore" title="Shop by category" to="/products" action="All products" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : data?.items?.map((c, i) => {
              const style = CATEGORY_STYLE[c.icon] || CATEGORY_STYLE.smartphone;
              const Icon = style.icon;
              const photo = isPhoto(c.image);
              return (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.05 }}
                >
                  <Link
                    to={`/category/${c.slug}`}
                    className={`group relative flex h-40 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-44 ${style.tile}`}
                  >
                    {photo ? (
                      <>
                        <img
                          src={c.image}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                        <span className={`absolute inset-0 bg-gradient-to-br opacity-60 mix-blend-multiply ${style.tile}`} />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <Icon
                        className="absolute -bottom-3 -right-3 text-white/15 transition duration-500 group-hover:rotate-12 group-hover:scale-110"
                        size={96}
                      />
                    )}
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/25 shadow-sm backdrop-blur">
                      <Icon size={20} />
                    </span>
                    <span className="relative">
                      <span className="block text-sm font-bold leading-tight drop-shadow sm:text-base">{c.name}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-white/85">
                        {c.productCount} products{' '}
                        <FiArrowRight className="transition group-hover:translate-x-1" />
                      </span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </section>
  );
}

/** Live countdown to midnight for the deals section */
function useCountdown() {
  const calc = () => {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  };
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) =>
    String(n).padStart(2, '0')
  );
}

function Deals() {
  const deals = useGetDealsQuery();
  const [h, m, s] = useCountdown();
  return (
    <section className="mt-14 overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 ring-1 ring-orange-100 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/30 dark:ring-orange-900/40 sm:p-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            <FiZap /> Limited time
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Deals of the day</h2>
        </div>
        <div className="flex items-center gap-2" aria-label={`Deals end in ${h} hours ${m} minutes`}>
          <FiClock className="text-orange-600" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Ends in</span>
          {[h, m, s].map((v, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="min-w-[2.5rem] rounded-lg bg-gray-900 px-2 py-1.5 text-center font-mono text-lg font-bold text-white tabular-nums dark:bg-white dark:text-gray-900">
                {v}
              </span>
              {i < 2 && <span className="font-bold text-gray-500">:</span>}
            </span>
          ))}
        </div>
      </div>
      <ProductSlider bare products={deals.data?.products} loading={deals.isLoading} />
      <div className="mt-4 text-center">
        <Link to="/products?sort=discount" className="btn-primary">
          See all deals <FiArrowRight />
        </Link>
      </div>
    </section>
  );
}

const offerIcon = (link = '') =>
  /laptop/.test(link)
    ? FiMonitor
    : /head|audio|earbud/.test(link)
      ? FiHeadphones
      : /tv/.test(link)
        ? FiTv
        : FiSmartphone;

function Offers() {
  const { data, isLoading } = useGetBannersQuery();
  const banners = (data?.banners || []).slice(0, 3);
  if (isLoading) return <Skeleton className="mt-14 h-64 rounded-[2rem]" />;
  if (!banners.length) return null;
  return (
    <section className="mt-14">
      <SectionHeader eyebrow="Offers for you" title="Top picks this week" />
      <div className="grid gap-4 md:grid-cols-2 md:grid-rows-2">
        {banners.map((b, i) => {
          const Icon = offerIcon(b.link);
          return (
            <Link
              key={b._id}
              to={b.link || '/products'}
              className={`group relative flex overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-6 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-8 ${OFFER_STYLES[i % OFFER_STYLES.length]} ${
                i === 0 ? 'min-h-[22rem] md:row-span-2' : 'min-h-[10rem]'
              }`}
            >
              {isPhoto(b.image) ? (
                <img
                  src={b.image}
                  alt=""
                  loading="lazy"
                  className={`absolute rounded-3xl object-cover shadow-2xl ring-4 ring-white/20 transition duration-500 group-hover:-rotate-3 group-hover:scale-105 ${
                    i === 0
                      ? 'right-6 top-6 h-36 w-36 rotate-6 sm:h-48 sm:w-48 md:right-8 md:top-1/2 md:h-56 md:w-56 md:-translate-y-1/2 lg:h-64 lg:w-64'
                      : 'right-5 top-1/2 h-24 w-24 -translate-y-1/2 rotate-6 sm:h-32 sm:w-32'
                  }`}
                />
              ) : (
                <Icon
                  className={`absolute text-white/15 transition duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
                    i === 0 ? '-bottom-10 -right-6' : '-bottom-6 -right-4'
                  }`}
                  size={i === 0 ? 260 : 150}
                />
              )}
              <div className={`relative mt-auto ${i === 0 ? 'max-w-xs md:max-w-[45%]' : 'max-w-[60%] sm:max-w-[65%]'}`}>
                <h3
                  className={`font-extrabold leading-tight ${i === 0 ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}
                >
                  {b.title}
                </h3>
                {b.subtitle && <p className="mt-2 text-sm text-white/85">{b.subtitle}</p>}
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow transition group-hover:gap-3">
                  {b.buttonText || 'Shop now'} <FiArrowRight />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Budgets() {
  return (
    <section className="mt-14">
      <SectionHeader eyebrow="Smart shopping" title="Shop by budget" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {BUDGETS.map((b) => (
          <Link
            key={b.label}
            to={b.to}
            className="card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
          >
            <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${b.tone}`} />
            <p className="text-lg font-extrabold sm:text-xl">{b.label}</p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">{b.hint}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition group-hover:gap-2 dark:text-brand-400">
              Explore <FiArrowRight />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BrandMarquee() {
  const { data } = useGetBrandsQuery();
  const brands = (data?.items || [])
    .filter((b) => b.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount);
  if (!brands.length) return null;
  const loop = [...brands, ...brands];
  return (
    <section className="mt-14">
      <SectionHeader eyebrow="Official stores" title="Top brands" />
      <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white py-4 dark:border-gray-800 dark:bg-gray-900 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused]">
          {loop.map((b, i) => (
            <Link
              key={`${b._id}-${i}`}
              to={`/products?brand=${b.slug}`}
              aria-hidden={i >= brands.length}
              tabIndex={i >= brands.length ? -1 : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-brand-900/40"
            >
              {b.name}
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-900">
                {b.productCount}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromiseSection({ products = [] }) {
  const photos = products.filter(
    (p, i, all) => isPhoto(p.images?.[0]?.url) && all.findIndex((x) => x._id === p._id) === i
  );
  return (
    <section className="mt-14 grid overflow-hidden rounded-[2rem] bg-gray-900 text-white dark:bg-gray-900 md:grid-cols-[1.2fr_1fr]">
      <div className="p-8 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">The ShopEase promise</p>
        <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Buy electronics with total peace of mind</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ['GST invoice on every order', 'Download it anytime from My orders'],
            ['Serial / IMEI recorded', 'For easy warranty claims'],
            ['Track every step', 'Placed to delivered, live timeline'],
            ['Secure payments', 'UPI, cards, EMI or Cash on Delivery'],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <FiStar className="mt-1 shrink-0 text-amber-300" />
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="text-sm text-white/60">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative hidden items-center justify-center bg-gradient-to-br from-brand-600 to-violet-700 p-10 md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:18px_18px]" />
        {photos.length >= 6 ? (
          <div className="relative grid grid-cols-3 gap-3">
            {photos.slice(0, 6).map((p, i) => (
              <Link
                key={p._id}
                to={`/product/${p.slug}`}
                title={p.title}
                className={`block overflow-hidden rounded-2xl shadow-xl ring-2 ring-white/30 transition hover:scale-105 ${i % 2 ? 'animate-float translate-y-4' : 'animate-float-slow'}`}
              >
                <img src={p.images[0].url} alt={p.title} loading="lazy" className="h-24 w-24 object-cover lg:h-28 lg:w-28" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="relative grid grid-cols-3 gap-4">
            {[FiSmartphone, FiHeadphones, FiWatch, FiMonitor, FiCamera, FiTv].map((Icon, i) => (
              <span
                key={i}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ${i % 2 ? 'animate-float' : 'animate-float-slow'}`}
              >
                <Icon size={28} />
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const featured = useGetFeaturedQuery();
  const fresh = useGetNewArrivalsQuery();
  const recent = useSelector((s) => s.recent.items);

  return (
    <div className="container-x py-4 sm:py-6">
      <Seo title="Buy Mobiles, Laptops & Electronics Online" />
      <Hero />
      <Perks />
      <Categories />
      <Deals />
      <Offers />
      <ProductSlider
        title="Featured products"
        subtitle="Hand-picked bestsellers loved by our customers"
        products={featured.data?.products}
        loading={featured.isLoading}
        viewAllTo="/products?featured=true"
      />
      <Budgets />
      <BrandMarquee />
      <ProductSlider
        title="New arrivals"
        subtitle="Just landed in the store"
        products={fresh.data?.products}
        loading={fresh.isLoading}
        viewAllTo="/products?sort=newest"
      />
      <PromiseSection products={[...(fresh.data?.products || []), ...(featured.data?.products || [])]} />
      {recent.length > 0 && <ProductSlider title="Recently viewed" products={recent} />}
    </div>
  );
}
