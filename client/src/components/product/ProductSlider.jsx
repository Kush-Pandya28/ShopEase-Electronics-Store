import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import { ConnectedProductCard } from './ProductGrid';
import { ProductCardSkeleton } from '../common/Loader';

/** `bare` renders only the carousel (no heading / outer margin), for use inside a custom section. */
export default function ProductSlider({ title, products = [], loading, viewAllTo, subtitle, bare = false }) {
  if (!loading && !products.length) return null;
  return (
    <section className={bare ? 'mt-4' : 'mt-14'}>
      {!bare && (
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              View all <FiArrowRight className="transition group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Navigation, FreeMode]}
          navigation
          freeMode
          spaceBetween={14}
          slidesPerView={1.6}
          breakpoints={{
            480: { slidesPerView: 2.3 },
            768: { slidesPerView: 3.3 },
            1024: { slidesPerView: 4.3 },
            1280: { slidesPerView: 5 },
          }}
          className="!pb-2"
        >
          {products.map((p) => (
            <SwiperSlide key={p._id} className="!h-auto">
              <ConnectedProductCard product={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
