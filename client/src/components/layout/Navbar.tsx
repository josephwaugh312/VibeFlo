import React from 'react';
import { Disclosure } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/" className="text-xl font-bold text-white">
                    VibeFlo
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    <Link
                      to="/"
                      className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                    >
                      Home
                    </Link>
                    <Link
                      to="/about"
                      className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                    >
                      About
                    </Link>
                    {isAuthenticated && (
                      <>
                        <Link
                          to="/profile"
                          className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/stats"
                          className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                        >
                          Stats
                        </Link>
                        <Link
                          to="/playlists"
                          className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                        >
                          Playlists
                        </Link>
                        <Link
                          to="/themes"
                          className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                        >
                          Themes
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex items-center">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center px-3 py-2 text-sm font-medium text-white">
                        @{user?.username}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="px-3 py-2 ml-2 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="flex -mr-2 sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" aria-label="Open main menu">
                  {open ? (
                    <CloseIcon className="block w-6 h-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block w-6 h-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
              >
                About
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/stats"
                    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Stats
                  </Link>
                  <Link
                    to="/playlists"
                    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Playlists
                  </Link>
                  <Link
                    to="/themes"
                    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Themes
                  </Link>
                  <div className="block px-3 py-2 text-base font-medium text-white rounded-md">
                    @{user?.username}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar; 