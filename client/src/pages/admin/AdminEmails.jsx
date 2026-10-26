import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FiMail, FiSend, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiExternalLink } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import { useGetEmailsQuery, useSendTestEmailMutation } from '../../services/adminApi';
import { formatDateTime, errorMessage } from '../../utils/format';

const MODE_INFO = {
  smtp: {
    title: 'Real emails are being sent',
    tone: 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
    text: 'Customers receive emails in their real inbox.',
  },
  preview: {
    title: 'Test mode - emails go to a test mailbox',
    tone: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    text: 'Every email is delivered to a free Ethereal test inbox. Click "View" to read it. To send to real inboxes, double-click setup-email.bat in the project folder and restart the app.',
  },
  console: {
    title: 'Emails are not being sent',
    tone: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
    text: 'No SMTP is configured and the test mailbox is unreachable. Double-click setup-email.bat in the project folder, then restart the app.',
  },
};

export default function AdminEmails() {
  const me = useSelector((s) => s.auth.user);
  const { data, isLoading, isFetching, refetch } = useGetEmailsQuery(undefined, { pollingInterval: 15000 });
  const [sendTest, { isLoading: sending }] = useSendTestEmailMutation();
  const [to, setTo] = useState('');

  if (isLoading) return <Loader full />;
  const { status, emails } = data;
  const info = MODE_INFO[status.mode] || MODE_INFO.console;
  const failed = emails.filter((e) => e.status === 'failed').length;

  const onTest = async (e) => {
    e.preventDefault();
    try {
      const res = await sendTest(to || me.email).unwrap();
      if (res.previewUrl) {
        toast.success('Test email sent to the test mailbox');
        window.open(res.previewUrl, '_blank', 'noopener');
      } else {
        toast.success(`Test email sent to ${res.to}`);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Test email failed'));
    }
  };

  return (
    <div className="space-y-5">
      <Seo title="Emails" noIndex />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Emails</h1>
        <button type="button" className="btn-outline btn-sm" onClick={refetch} disabled={isFetching}>
          <FiRefreshCw className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <section className={`rounded-xl border p-4 ${info.tone}`}>
        <p className="flex items-center gap-2 font-semibold">
          {status.mode === 'smtp' ? <FiCheckCircle /> : <FiAlertTriangle />} {info.title}
        </p>
        <p className="mt-1 text-sm">{info.text}</p>
        <p className="mt-2 text-xs opacity-80">
          From: {status.from}
          {status.detail ? ` · ${status.detail}` : ''}
        </p>
      </section>

      <form onSubmit={onTest} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="test-to" className="label">
            Send a test email
          </label>
          <input
            id="test-to"
            type="email"
            className="input"
            placeholder={me?.email}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={sending}>
          <FiSend /> {sending ? 'Sending...' : 'Send test'}
        </button>
      </form>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <FiMail /> Recent emails ({emails.length})
          </h2>
          {failed > 0 && <span className="badge bg-red-100 text-red-700">{failed} failed</span>}
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Time</th>
              <th>To</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e._id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(e.createdAt)}</td>
                <td className="text-xs">{e.to}</td>
                <td>{e.subject}</td>
                <td className="text-xs text-gray-500">{e.type}</td>
                <td>
                  {e.status === 'sent' ? (
                    <span className="badge bg-green-100 text-green-700">
                      {e.mode === 'smtp'
                        ? 'Delivered to inbox'
                        : e.mode === 'preview'
                          ? 'Test mailbox'
                          : 'Logged only'}
                    </span>
                  ) : (
                    <span className="badge bg-red-100 text-red-700" title={e.error}>
                      Failed
                    </span>
                  )}
                  {e.error && <p className="mt-1 max-w-xs text-xs text-red-600">{e.error}</p>}
                </td>
                <td>
                  {e.previewUrl && (
                    <a
                      href={e.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
                    >
                      View <FiExternalLink />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!emails.length && <p className="p-6 text-center text-sm text-gray-500">No emails sent yet.</p>}
      </section>
    </div>
  );
}
