import toast from 'react-hot-toast';
import { FiCopy, FiExternalLink, FiGlobe, FiWifi } from 'react-icons/fi';
import { useGetPublicLinkQuery } from '../../services/adminApi';

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Link copied');
  } catch {
    toast.error('Could not copy - select the link and copy it');
  }
};

/** The store's internet link (any network / mobile data) with a QR code to open it on a phone. */
export default function ShareStoreCard() {
  const { data } = useGetPublicLinkQuery(undefined, { pollingInterval: 60000 });
  // The public link is optional and off by default - show nothing unless it is running
  if (!data?.url) return null;

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-semibold">
            <FiGlobe className="text-brand-600" /> Share your store
          </h2>
          {data.url ? (
            <>
              <p className="mt-1 text-sm text-gray-500">
                Opens on any phone or computer, on any Wi-Fi or mobile data. Scan the QR code with a phone camera.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-brand-700 dark:bg-gray-800 dark:text-brand-300">
                  {data.url}
                </code>
                <button type="button" className="btn-outline btn-sm" onClick={() => copy(data.url)}>
                  <FiCopy /> Copy
                </button>
                <a href={data.url} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                  <FiExternalLink /> Open
                </a>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This computer must stay on. The link changes when the computer restarts - this card always
                shows the current one.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              The internet link is not running. Double-click <b>public-link.bat</b> in the ShopEase folder (needs
              internet).
            </p>
          )}
          {data.lanUrl && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <FiWifi /> Same Wi-Fi only: {data.lanUrl}
            </p>
          )}
        </div>
        {data.qr && (
          <img
            src={data.qr}
            alt={`QR code for ${data.url}`}
            className="h-40 w-40 shrink-0 self-center rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700"
          />
        )}
      </div>
    </section>
  );
}
