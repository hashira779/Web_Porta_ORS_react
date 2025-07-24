import React, { useState, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
// CORRECTED: Imported the correct icon names
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { jwtDecode } from 'jwt-decode';
import authService from '../../services/auth.service';
import { DecodedToken } from '../../types';

const Header: React.FC = () => {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const token = authService.getCurrentUserToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        setUsername(decodedToken.sub);
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
        {/* Search Bar */}
        <div className="flex-1 min-w-0">
          <div className="relative text-gray-400 focus-within:text-gray-600">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            {/* CORRECTED: Used the correct icon component */}
            <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
          </span>
            <input
                id="search-field"
                className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm bg-gray-100 rounded-md"
                placeholder="Search..."
                type="search"
                name="search"
            />
          </div>
        </div>

        {/* Right side icons and profile */}
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notifications Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </Menu.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                </div>
                <Menu.Item>
                  {({ active }) => (
                      <a href="#" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                        New report generated
                      </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Profile Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {getInitials(username)}
              </div>
              <div className="hidden md:flex flex-col items-start ml-3">
                <span className="text-sm font-medium text-gray-800">{username}</span>
                <span className="text-xs text-gray-500">View Profile</span>
              </div>
            </Menu.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                      <a href="#" className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}>
                        <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400"/> Your Profile
                      </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                      <a href="#" className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}>
                        <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400"/> Settings
                      </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                      <button onClick={authService.logout} className={`${active ? 'bg-gray-100' : ''} w-full text-left flex items-center px-4 py-2 text-sm text-gray-700`}>
                        {/* CORRECTED: Used the correct icon component */}
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400"/> Sign out
                      </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </header>
  );
};

export default Header;