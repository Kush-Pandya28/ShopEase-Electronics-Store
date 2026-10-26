import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';
import { useGetUsersQuery, useUpdateUserMutation } from '../../services/adminApi';
import { formatDate, errorMessage } from '../../utils/format';

export default function AdminUsers() {
  const me = useSelector((s) => s.auth.user);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(q, 350);
  const { data, isLoading, isFetching } = useGetUsersQuery({ q: search, role, page });
  const [update] = useUpdateUserMutation();

  const act = async (body, msg) => {
    try {
      await update(body).unwrap();
      toast.success(msg);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <Seo title="Users" noIndex />
      <h1 className="mb-4 text-2xl font-bold">Users {data && <span className="text-base font-normal text-gray-500">({data.total})</span>}</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name, email, phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search users" />
        <select className="input w-auto" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {isLoading ? <Loader /> : (
        <div className={`card overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
          <table className="table-base">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {data.users.map((u) => {
                const self = u._id === me?._id;
                return (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name} {self && <span className="text-xs text-gray-400">(you)</span>}</td>
                    <td>{u.email} {u.isVerified && <span className="text-xs text-green-600">✓</span>}</td>
                    <td>{u.phone || '-'}</td>
                    <td className="whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td>
                      <select
                        className="input w-auto px-2 py-1 text-xs"
                        value={u.role}
                        disabled={self}
                        onChange={(e) => act({ id: u._id, role: e.target.value }, 'Role updated')}
                        aria-label={`Role for ${u.name}`}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={self}
                        onClick={() => act({ id: u._id, isBlocked: !u.isBlocked }, u.isBlocked ? 'User unblocked' : 'User blocked')}
                        className={`btn-sm btn ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {u.isBlocked ? 'Blocked · Unblock' : 'Active · Block'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </div>
  );
}
