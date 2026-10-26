import { API_URL } from '../services/api';
import { setCredentials, logout } from '../features/auth/authSlice';

/**
 * Downloads a protected file (invoice PDF, CSV report). Retries once after refreshing the access token.
 * The store is passed in to avoid a circular import with app/store.
 */
export async function downloadFile(store, path, filename) {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${store.getState().auth.accessToken}` },
    });

  let res = await doFetch();
  if (res.status === 401) {
    const refresh = await fetch(`${API_URL}/auth/refresh-token`, { method: 'POST', credentials: 'include' });
    if (!refresh.ok) {
      store.dispatch(logout());
      throw new Error('Session expired, please login again');
    }
    store.dispatch(setCredentials(await refresh.json()));
    res = await doFetch();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Download failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers; release the memory a bit later
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}
