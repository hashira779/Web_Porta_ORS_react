import React from 'react';
import UserManagement from '../components/admin/UserManagement';

const AdminPage: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>
    <UserManagement />
  </div>
);

export default AdminPage;