import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUser } from '../../api/api';
import { User } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = () => {
    setLoading(true);
    getAllUsers()
      .then(response => setUsers(response.data))
      .catch(error => console.error("Error fetching users:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleUpdate = (userId: number, currentRoleId: number, currentStatus: boolean) => {
    updateUser(userId, { role_id: currentRoleId, is_active: !currentStatus })
      .then(() => fetchUsers())
      .catch(error => console.error("Error updating user:", error));
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">User Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
                <tr key={user.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.username}</td>
                <td><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => handleUpdate(user.id, user.role_id, user.is_active)} className="text-indigo-600 hover:text-indigo-900">Toggle Status</button></td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;