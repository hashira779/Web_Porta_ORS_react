import React from 'react';

const Profile: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">My Profile</h2>
      <p className="mt-2 text-gray-600">This page can be used to display and edit the logged-in user's profile details.</p>
    </div>
  );
};

export default Profile;