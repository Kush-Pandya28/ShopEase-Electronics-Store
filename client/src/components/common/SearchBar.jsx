import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import { useGetSuggestionsQuery } from '../../services/productApi';
import { formatPrice } from '../../utils/format';

export default function SearchBar({ className = '' }) {
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') || '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(term.trim(), 300);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  const { data } = useGetSuggestionsQuery(debounced, { skip: debounced.length < 2 });
  const suggestions = debounced.length >= 2 ? data?.suggestions || [] : [];
  const categories = debounced.length >= 2 ? data?.categories || [] : [];

  useEffect(() => {
    const close = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    setActive(-1);
  }, [debounced]);

  // Picking a suggestion opens that page, so the box is cleared for the next search
  const pick = () => {
    setOpen(false);
    setTerm('');
  };

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    if (active >= 0 && suggestions[active]) {
      pick();
      navigate(`/product/${suggestions[active].slug}`);
      return;
    }
    if (term.trim()) navigate(`/products?q=${encodeURIComponent(term.trim())}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          type="search"
          autoComplete="off"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search mobiles, laptops, brands..."
          className="input pr-10"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="search-suggestions"
        />
        <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-brand-600" aria-label="Search">
          <FiSearch size={18} />
        </button>
      </form>

      {open && (suggestions.length > 0 || categories.length > 0) && (
        <ul id="search-suggestions" role="listbox" className="card absolute left-0 right-0 top-full z-40 mt-1 max-h-96 overflow-y-auto py-1">
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                to={`/category/${c.slug}`}
                onClick={pick}
                className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FiSearch className="mr-2 inline text-gray-400" /> in <b>{c.name}</b>
              </Link>
            </li>
          ))}
          {suggestions.map((s, i) => (
            <li key={s._id} role="option" aria-selected={i === active}>
              <Link
                to={`/product/${s.slug}`}
                onClick={pick}
                className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  i === active ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              >
                <img src={s.image} alt="" className="h-10 w-10 rounded object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.title}</span>
                  <span className="text-xs text-gray-500">{s.brandName}</span>
                </span>
                <span className="font-semibold">{formatPrice(s.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
