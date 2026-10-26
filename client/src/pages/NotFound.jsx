import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-20 text-center">
      <Seo title="Page not found" noIndex />
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-500">The page you are looking for does not exist or has been moved.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/products" className="btn-outline">Browse products</Link>
      </div>
    </div>
  );
}
