import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';

const product = {
  _id: 'p1',
  title: 'Test Phone 5G',
  slug: 'test-phone-5g',
  brandName: 'Acme',
  price: 15000,
  mrp: 20000,
  discountPercent: 25,
  stock: 3,
  ratingAverage: 4.4,
  ratingCount: 120,
  emiAvailable: true,
  images: [{ url: 'https://example.com/p.png' }],
  variants: [{ sku: 'A', price: 15000, mrp: 20000, stock: 3 }],
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} {...props} />
    </MemoryRouter>
  );

describe('ProductCard', () => {
  test('shows title, price, discount and low stock hint', () => {
    renderCard();
    expect(screen.getByText('Test Phone 5G')).toBeInTheDocument();
    expect(screen.getByText('25% OFF')).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
  });

  test('calls add to cart with the first in-stock variant', async () => {
    const onAddToCart = vi.fn();
    renderCard({ onAddToCart });
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAddToCart).toHaveBeenCalledWith(product, product.variants[0]);
  });

  test('disables add to cart when out of stock', () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...product, stock: 0, variants: [{ ...product.variants[0], stock: 0 }] }} onAddToCart={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /sold out/i })).toBeDisabled();
  });
});
