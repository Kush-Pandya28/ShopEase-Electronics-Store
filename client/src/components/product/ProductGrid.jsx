import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Loader';
import useCart from '../../hooks/useCart';
import useWishlist from '../../hooks/useWishlist';
import useCompare from '../../hooks/useCompare';

/** Wires ProductCard to cart / wishlist / compare state. */
export function ConnectedProductCard({ product }) {
  const { addToCart } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  return (
    <ProductCard
      product={product}
      onAddToCart={addToCart}
      onToggleWishlist={wishlist.toggle}
      onToggleCompare={compare.toggle}
      inWishlist={wishlist.has(product._id)}
      inCompare={compare.has(product._id)}
    />
  );
}

export default function ProductGrid({ products = [], loading = false, skeletons = 8, cols = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' }) {
  return (
    <div className={`grid gap-3 sm:gap-4 ${cols}`}>
      {loading && !products.length
        ? Array.from({ length: skeletons }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ConnectedProductCard key={p._id} product={p} />)}
    </div>
  );
}
