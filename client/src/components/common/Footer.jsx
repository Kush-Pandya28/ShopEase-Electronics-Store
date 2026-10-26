import { Link } from 'react-router-dom';
import { FiTruck, FiRefreshCw, FiShield, FiCreditCard } from 'react-icons/fi';
import { FaGithub, FaInstagram, FaXTwitter, FaYoutube } from 'react-icons/fa6';

const perks = [
  { icon: FiTruck, title: 'Free delivery', text: 'On orders above Rs. 999' },
  { icon: FiRefreshCw, title: '7 day replacement', text: 'Easy returns on defects' },
  { icon: FiShield, title: 'Brand warranty', text: '100% genuine products' },
  { icon: FiCreditCard, title: 'No-cost EMI', text: 'On major cards' },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="container-x grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/40">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-gray-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="container-x grid gap-8 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold text-brand-600">ShopEase</p>
            <p className="mt-2 text-gray-500">
              Your trusted destination for mobiles, laptops, audio, TVs and smart gadgets at honest prices.
            </p>
            <div className="mt-4 flex gap-3 text-gray-500">
              <a href="https://github.com" aria-label="GitHub" className="hover:text-brand-600"><FaGithub size={18} /></a>
              <a href="https://instagram.com" aria-label="Instagram" className="hover:text-brand-600"><FaInstagram size={18} /></a>
              <a href="https://x.com" aria-label="X" className="hover:text-brand-600"><FaXTwitter size={18} /></a>
              <a href="https://youtube.com" aria-label="YouTube" className="hover:text-brand-600"><FaYoutube size={18} /></a>
            </div>
          </div>
          <div>
            <p className="mb-3 font-semibold">Shop</p>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/category/mobiles" className="hover:text-brand-600">Mobiles</Link></li>
              <li><Link to="/category/laptops" className="hover:text-brand-600">Laptops</Link></li>
              <li><Link to="/category/headphones-and-earbuds" className="hover:text-brand-600">Audio</Link></li>
              <li><Link to="/category/tvs" className="hover:text-brand-600">TVs</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold">My account</p>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/profile" className="hover:text-brand-600">Profile</Link></li>
              <li><Link to="/orders" className="hover:text-brand-600">Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-brand-600">Wishlist</Link></li>
              <li><Link to="/compare" className="hover:text-brand-600">Compare</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold">Help</p>
            <ul className="space-y-2 text-gray-500">
              <li>Returns: 7 day replacement policy</li>
              <li>Shipping: Free above Rs. 999</li>
              <li>Email: support@shopease.com</li>
              <li>Phone: 1800-123-4567</li>
            </ul>
          </div>
        </div>
      </div>
      <p className="border-t border-gray-100 py-4 text-center text-xs text-gray-500 dark:border-gray-800">
        © {new Date().getFullYear()} ShopEase. All prices are inclusive of GST.
      </p>
    </footer>
  );
}
