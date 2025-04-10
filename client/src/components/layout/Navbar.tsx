import React, { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Disclosure } from '@headlessui/react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 bg-opacity-80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-white drop-shadow-md">VibeFlo</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex space-x-4">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    isActive 
                      ? "px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600" 
                      : "px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black/20"
                  }
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => 
                    isActive 
                      ? "px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600" 
                      : "px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black/20"
                  }
                >
                  About
                </NavLink>
                {user && (
                  <>
                    <NavLink 
                      to="/dashboard" 
                      className={({ isActive }) => 
                        isActive 
                          ? "px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600" 
                          : "px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black/20"
                      }
                    >
                      Dashboard
                    </NavLink>
                    <NavLink 
                      to="/stats" 
                      className={({ isActive }) => 
                        isActive 
                          ? "px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600" 
                          : "px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black/20"
                      }
                    >
                      Stats
                    </NavLink>
                    <NavLink 
                      to="/playlists" 
                      className={({ isActive }) => 
                        isActive 
                          ? "px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600" 
                          : "px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black/20"
                      }
                    >
                      Playlists
                    </NavLink>
                    <NavLink 
                      to="/themes" 
                      className={({ isActive }) => 
                        isActive 
                          ? "px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600" 
                          : "px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black/20"
                      }
                    >
                      Themes
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white drop-shadow-md">@{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium text-white hover:text-indigo-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Disclosure>
            {({ open }) => (
              <div>
                <div className="flex items-center sm:hidden">
                  <Disclosure.Button
                    className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-expanded="false"
                  >
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <svg
                        className="block h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg
                        className="block h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </Disclosure.Button>
                </div>

                {/* Mobile menu panel */}
                <Disclosure.Panel className="sm:hidden bg-black/40 backdrop-blur-sm">
                  <div className="pt-2 pb-3 space-y-1">
                    <Link
                      to="/"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                    >
                      Home
                    </Link>
                    <Link
                      to="/about"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                    >
                      About
                    </Link>
                    {user && (
                      <div>
                        <Link
                          to="/dashboard"
                          className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/stats"
                          className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                        >
                          Stats
                        </Link>
                        <Link
                          to="/playlists"
                          className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                        >
                          Playlists
                        </Link>
                        <Link
                          to="/themes"
                          className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                        >
                          Themes
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 pb-3 border-t border-white/20">
                    {user ? (
                      <div className="px-4 space-y-2">
                        <div className="text-base font-medium text-white">@{user.username}</div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 space-y-2">
                        <Link
                          to="/login"
                          className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black/20"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-200"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                  </div>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 