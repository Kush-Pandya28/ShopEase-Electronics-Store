import { Link, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMoon, FiSun, FiTruck, FiShield, FiRefreshCw, FiCreditCard, FiZap } from 'react-icons/fi';
import { toggleTheme } from '../features/ui/uiSlice';

const perks = [
  { icon: FiTruck, title: 'Free delivery', text: 'On orders above ₹999' },
  { icon: FiShield, title: '100% genuine', text: 'With brand warranty' },
  { icon: FiRefreshCw, title: '7 day replacement', text: 'Hassle-free returns' },
  { icon: FiCreditCard, title: 'EMI & COD', text: 'No-cost EMI, Cash on Delivery' },
];

// Bundled sample photos (server/public/products)
const photo = (file) => `/api/media/products/${file}`;
const SHOWCASE = [
  { file: 'apple-iphone-16-pro-256-gb-1.jpg', name: 'iPhone 16 Pro', tag: 'Mobiles' },
  { file: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones-1.jpg', name: 'Sony WH-1000XM5', tag: 'Headphones' },
  { file: 'apple-macbook-air-m3-13-inch-1.jpg', name: 'MacBook Air M3', tag: 'Laptops' },
  { file: 'nintendo-switch-oled-model-1.jpg', name: 'Switch OLED', tag: 'Gaming' },
  { file: 'apple-watch-series-9-gps-45mm-1.jpg', name: 'Apple Watch S9', tag: 'Smartwatches' },
  { file: 'nikon-z50-mirrorless-camera-with-16-50mm-lens-1.jpg', name: 'Nikon Z50', tag: 'Cameras' },
];
const STRIP = [
  'samsung-galaxy-s24-ultra-5g-1.jpg',
  'apple-airpods-pro-2nd-gen-with-magsafe-usb-c-1.jpg',
  'jbl-charge-5-portable-waterproof-speaker-1.jpg',
  'canon-eos-r50-mirrorless-camera-with-18-45mm-lens-1.jpg',
  'sony-playstation-5-slim-console-1.jpg',
  'apple-ipad-10th-generation-wi-fi-1.jpg',
  'logitech-mx-master-3s-wireless-mouse-1.jpg',
  'garmin-forerunner-265-gps-running-watch-1.jpg',
];

const hideOnError = (e) => {
  e.currentTarget.closest('[data-photo]')?.classList.add('hidden');
};

function Logo({ light = false }) {
  return (
    <Link to="/login" className={`flex items-center gap-2.5 text-xl font-extrabold ${light ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg shadow-brand-600/40">
        S
      </span>
      ShopEase
    </Link>
  );
}

/** Left half on desktop: the store's showcase */
function Showcase() {
  return (
    <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] animate-blob rounded-full bg-sky-500/25 blur-3xl [animation-delay:-6s]" />
      <div className="pointer-events-none absolute right-1/3 top-1/3 h-72 w-72 animate-blob rounded-full bg-indigo-500/30 blur-3xl [animation-delay:-10s]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:24px_24px]" />

      <div className="relative flex flex-1 flex-col px-10 py-8 xl:px-14">
        <Logo light />

        <div className="my-auto py-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <FiZap className="text-amber-300" /> Mega Electronics Sale · up to 80% off
          </span>
          <h2 className="mt-5 max-w-lg text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
            Your next gadget is{' '}
            <span className="animate-gradient-x bg-gradient-to-r from-amber-300 via-pink-300 to-sky-300 bg-[length:200%_auto] bg-clip-text text-transparent">
              one click away.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            105+ mobiles, laptops, audio and smart gadgets from 47 top brands - with GST invoice and brand warranty.
          </p>

          {/* floating product collage */}
          <div className="mt-8 grid max-w-md grid-cols-3 gap-4 xl:max-w-lg">
            {SHOWCASE.map((p, i) => (
              <figure
                key={p.file}
                data-photo
                className={`group relative overflow-hidden rounded-2xl bg-white/5 shadow-2xl ring-1 ring-white/15 ${i % 2 ? 'animate-float' : 'animate-float-slow'}`}
                style={{ animationDelay: `${-i * 0.7}s` }}
              >
                <img
                  src={photo(p.file)}
                  alt={p.name}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110"
                  onError={hideOnError}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2 pt-6 text-[11px] leading-tight">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="text-white/70">{p.tag}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <ul className="relative grid grid-cols-2 gap-3 xl:grid-cols-4 [@media(max-height:840px)]:hidden">
          {perks.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
              <Icon className="text-amber-300" size={18} />
              <p className="mt-2 text-sm font-semibold">{title}</p>
              <p className="text-xs text-white/60">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Phones / tablets: a compact banner with a moving strip of products */
function MobileBanner() {
  const loop = [...STRIP, ...STRIP];
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-5 pb-4 pt-5 text-white shadow-xl lg:hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-blob rounded-full bg-fuchsia-500/40 blur-3xl" />
      <p className="relative text-xs font-semibold text-amber-300">
        <FiZap className="mr-1 inline" /> Mega Electronics Sale · up to 80% off
      </p>
      <p className="relative mt-1 text-xl font-extrabold leading-tight">Your next gadget is one click away.</p>
      <div className="relative -mx-5 mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 [animation-duration:30s]">
          {loop.map((file, i) => (
            <span key={`${file}-${i}`} data-photo className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/20">
              <img src={photo(file)} alt="" className="h-full w-full object-cover" onError={hideOnError} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Layout for login / register / password pages (the store itself needs login). */
export default function AuthLayout() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);

  return (
    <div className="grid min-h-screen bg-gray-50 dark:bg-gray-950 lg:grid-cols-[1.05fr_1fr]">
      <Showcase />

      <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* soft colour wash behind the form */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-700/20" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-fuchsia-300/25 blur-3xl dark:bg-fuchsia-800/15" />

        <header className="relative flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="lg:invisible">
            <Logo />
          </div>
          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white/70 p-2.5 text-gray-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:bg-gray-900"
            onClick={() => dispatch(toggleTheme())}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        </header>

        <main id="main" className="relative flex flex-1 flex-col justify-center gap-6 px-4 pb-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <MobileBanner />
          </div>
          <Outlet />
        </main>

        <footer className="relative pb-5 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ShopEase · All prices are inclusive of GST
        </footer>
      </div>
    </div>
  );
}
