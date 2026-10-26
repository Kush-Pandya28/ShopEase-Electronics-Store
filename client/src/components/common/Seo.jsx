import { Helmet } from 'react-helmet-async';

export default function Seo({ title, description, image, noIndex = false }) {
  const fullTitle = title ? `${title} | ShopEase` : 'ShopEase - Electronics Store';
  const desc =
    description || 'Buy mobiles, laptops, headphones, TVs and more electronics at the best prices with no-cost EMI.';
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {image && <meta property="og:image" content={image} />}
      {noIndex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
}
