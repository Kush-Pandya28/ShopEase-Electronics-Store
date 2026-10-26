import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addToCompare, removeFromCompare, MAX_COMPARE } from '../features/compare/compareSlice';

export default function useCompare() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.compare.items);

  const toggle = useCallback(
    (product) => {
      if (items.some((i) => i._id === product._id)) {
        dispatch(removeFromCompare(product._id));
        return;
      }
      const categoryId = String(product.category?._id || product.category);
      if (items.length && items[0].categoryId !== categoryId) {
        toast('Compare list reset: only products of the same category can be compared', { icon: 'ℹ️' });
      } else if (items.length >= MAX_COMPARE) {
        toast(`You can compare up to ${MAX_COMPARE} products. Oldest one removed.`, { icon: 'ℹ️' });
      } else {
        toast.success('Added to compare');
      }
      dispatch(
        addToCompare({
          _id: product._id,
          title: product.title,
          slug: product.slug,
          image: product.images?.[0]?.url,
          price: product.price,
          categoryId,
          categoryName: product.category?.name,
        })
      );
    },
    [items, dispatch]
  );

  return { items, has: (id) => items.some((i) => i._id === id), toggle };
}
