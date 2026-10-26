import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  FiShoppingCart,
  FiZap,
  FiHeart,
  FiColumns,
  FiShield,
  FiRefreshCw,
  FiTruck,
  FiCreditCard,
  FiCheck,
} from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import Rating from '../components/common/Rating';
import Price from '../components/common/Price';
import ProductGallery from '../components/product/ProductGallery';
import VariantSelector from '../components/product/VariantSelector';
import SpecsTable from '../components/product/SpecsTable';
import ReviewSection from '../components/product/ReviewSection';
import ProductSlider from '../components/product/ProductSlider';
import EmptyState from '../components/common/EmptyState';
import { useGetProductQuery, useGetRelatedQuery } from '../services/productApi';
import useCart from '../hooks/useCart';
import useWishlist from '../hooks/useWishlist';
import useCompare from '../hooks/useCompare';
import { addRecent } from '../features/recent/recentSlice';
import { formatPrice, emiPerMonth, formatDate } from '../utils/format';

const TABS = ['Specifications', 'Description', 'Warranty & Returns'];

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetProductQuery(slug);
  const product = data?.product;
  const { data: related, isLoading: relatedLoading } = useGetRelatedQuery(product?._id, { skip: !product });
  const { addToCart, adding } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState(TABS[0]);
  const [extendedWarranty, setExtendedWarranty] = useState(false);

  useEffect(() => {
    if (!product) return;
    setVariant(product.variants.find((v) => v.stock > 0) || product.variants[0]);
    setQty(1);
    dispatch(
      addRecent({
        _id: product._id,
        title: product.title,
        slug: product.slug,
        brandName: product.brandName,
        images: product.images.slice(0, 1),
        price: product.price,
        mrp: product.mrp,
        discountPercent: product.discountPercent,
        ratingAverage: product.ratingAverage,
        ratingCount: product.ratingCount,
        stock: product.stock,
        emiAvailable: product.emiAvailable,
        category: product.category?._id,
        variants: product.variants.map(({ sku, color, ram, storage, price, mrp, stock }) => ({ sku, color, ram, storage, price, mrp, stock })),
      })
    );
  }, [product, dispatch]);

  const images = useMemo(() => {
    if (!product) return [];
    const own = variant?.images?.filter(Boolean) || [];
    return own.length ? own : product.images.map((i) => i.url);
  }, [product, variant]);

  if (isLoading) return <Loader full />;
  if (isError || !product) {
    return (
      <div className="container-x py-10">
        <EmptyState title="Product not found" message="It may have been removed or the link is incorrect." actionLabel="Browse products" />
      </div>
    );
  }

  const current = product.variants.find((v) => v.sku === variant?.sku) || product.variants[0];
  const inStock = current.stock > 0;
  const deliveryDate = formatDate(new Date(Date.now() + 4 * 86400000), { weekday: 'short', day: 'numeric', month: 'short' });

  const handleAdd = async (buyNow = false) => {
    const ok = await addToCart(product, current, qty, { silent: buyNow });
    if (ok && buyNow) navigate('/cart');
  };

  return (
    <div className="container-x py-6">
      <Seo title={product.title} description={product.description?.slice(0, 155)} image={product.images?.[0]?.url} />

      <nav className="mb-4 text-xs text-gray-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-600">Home</Link> /{' '}
        <Link to={`/category/${product.category?.slug}`} className="hover:text-brand-600">{product.category?.name}</Link> /{' '}
        <span className="text-gray-700 dark:text-gray-300">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <ProductGallery images={images} title={product.title} />
        </div>

        <div>
          <Link to={`/products?brand=${product.brand?.slug}`} className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {product.brandName}
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{product.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={product.ratingAverage} count={product.ratingCount} />
            <a href="#reviews" className="text-xs text-brand-600 hover:underline">See reviews</a>
          </div>

          <div className="mt-4">
            <Price price={current.price} mrp={current.mrp} size="lg" />
            <p className="text-xs text-gray-500">Inclusive of all taxes (GST 18%)</p>
          </div>

          {product.emiAvailable && current.price >= 3000 && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
              <FiCreditCard /> No-cost EMI from <b>{formatPrice(emiPerMonth(current.price, 6))}/month</b> for 6 months on select cards
            </p>
          )}

          <div className="mt-5">
            <VariantSelector variants={product.variants} selected={current} onSelect={setVariant} />
          </div>

          <p className={`mt-5 text-sm font-semibold ${inStock ? (current.stock <= 5 ? 'text-orange-600' : 'text-green-600') : 'text-red-600'}`}>
            {inStock ? (current.stock <= 5 ? `Hurry, only ${current.stock} left!` : 'In stock') : 'Out of stock'}
          </p>

          {inStock && (
            <div className="mt-3 flex items-center gap-3">
              <label htmlFor="qty" className="text-sm">Quantity</label>
              <select id="qty" className="input w-20 py-2" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: Math.min(current.stock, 10) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {product.warranty?.extendedAvailable && (
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
              <input type="checkbox" className="mt-0.5 rounded text-brand-600" checked={extendedWarranty} onChange={(e) => setExtendedWarranty(e.target.checked)} />
              <span>
                <b>Extended warranty</b> - add 1 more year of protection for {formatPrice(product.warranty.extendedPrice)}
                <span className="block text-xs text-gray-500">Purchase at the store counter or with customer support after delivery.</span>
              </span>
            </label>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary py-3" disabled={!inStock || adding} onClick={() => handleAdd(false)}>
              <FiShoppingCart /> Add to cart
            </button>
            <button type="button" className="btn-primary py-3" disabled={!inStock || adding} onClick={() => handleAdd(true)}>
              <FiZap /> Buy now
            </button>
            <button type="button" className="btn-outline" onClick={() => wishlist.toggle(product._id)}>
              <FiHeart className={wishlist.has(product._id) ? 'fill-red-500 text-red-500' : ''} />
              {wishlist.has(product._id) ? 'Wishlisted' : 'Wishlist'}
            </button>
            <button type="button" className={`btn-outline ${compare.has(product._id) ? 'border-brand-500 text-brand-600' : ''}`} onClick={() => compare.toggle(product)}>
              <FiColumns /> {compare.has(product._id) ? 'Added to compare' : 'Compare'}
            </button>
          </div>

          <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2"><FiTruck className="text-brand-600" /> Delivery by <b>{deliveryDate}</b></li>
            <li className="flex items-center gap-2"><FiRefreshCw className="text-brand-600" /> {product.returnDays || 7} days replacement</li>
            <li className="flex items-center gap-2"><FiShield className="text-brand-600" /> {product.warranty?.months || 12} months {product.warranty?.type}</li>
            <li className="flex items-center gap-2"><FiCreditCard className="text-brand-600" /> Cash on Delivery available</li>
          </ul>

          {product.highlights?.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold">Highlights</h2>
              <ul className="space-y-1.5 text-sm">
                {product.highlights.map((h) => (
                  <li key={h} className="flex gap-2"><FiCheck className="mt-0.5 shrink-0 text-green-600" /> {h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="card mt-10 p-4 sm:p-6">
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-800" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 px-3 pb-2 text-sm font-semibold ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'Specifications' && <SpecsTable specifications={product.specifications} />}
        {tab === 'Description' && <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">{product.description || 'No description available.'}</p>}
        {tab === 'Warranty & Returns' && (
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><b>Warranty:</b> {product.warranty?.months || 12} months {product.warranty?.type || 'brand warranty'} from the date of invoice.</p>
            {product.warranty?.extendedAvailable && <p><b>Extended warranty:</b> available for {formatPrice(product.warranty.extendedPrice)}.</p>}
            <p><b>Replacement:</b> {product.returnDays || 7} day replacement for damaged, defective or wrong products. Serial number / IMEI must match the invoice.</p>
            <p><b>GST invoice:</b> downloadable from your order page once the order is placed.</p>
          </div>
        )}
      </section>

      <ReviewSection product={product} />
      <ProductSlider title="Similar products" products={related?.products} loading={relatedLoading} />
    </div>
  );
}
