import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters and can only contain letters, numbers, and underscores');
      return;
    }
    
    setIsLoading(true);

    try {
      const data = await authAPI.register(name, username, email, password);
      
      // Store the token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set registered email for use in UI
      setRegisteredEmail(email);
      
      // Show success message about email verification
      if (data.emailError) {
        setSuccess('Registration successful, but we could not send the verification email. Please use the resend verification option below.');
      } else {
        setSuccess('Registration successful! Please check your email to verify your account.');
      }
      
      // Set registration complete to show different UI
      setRegistrationComplete(true);
      
      // Log for debugging
      console.log('Registration successful, verification email should be sent');
      
      // Show verification notification
      toast.success('Registration successful! Please check your email to verify your account.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = () => {
    navigate(`/resend-verification?email=${encodeURIComponent(registeredEmail)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-lg space-y-8">
        {!registrationComplete ? (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                Create your account
              </h2>
              <p className="mt-2 text-center text-sm text-white/70">
                Or{' '}
                <Link to="/login" className="font-medium text-purple-300 hover:text-white">
                  sign in to existing account
                </Link>
              </p>
            </div>
            {error && (
              <div className="bg-red-900/70 border border-red-500 text-white px-4 py-3 rounded-lg shadow-lg relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} role="form">
              <input type="hidden" name="remember" value="true" />
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-white/70 mb-4">
                  <strong>Important:</strong> After registration, you'll need to verify your email address to access all features. 
                  A verification link will be sent to your email. Please check both your inbox and spam folder.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <h2 className="text-center text-3xl font-extrabold text-white">
              Registration Complete!
            </h2>
            <div className="bg-green-900/70 border border-green-500 text-white px-4 py-3 rounded-lg shadow-lg relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
            
            <div className="space-y-4 px-1">
              <h3 className="text-xl font-medium text-white">Next Steps:</h3>
              
              <div className="space-y-2">
                <p className="text-sm text-white/90">
                  1. A verification email has been sent to <strong>{registeredEmail}</strong>
                </p>
                <p className="text-sm text-white/90">
                  2. Click the verification link in the email to activate your account
                </p>
                <p className="text-sm text-white/90">
                  3. Once verified, you'll have full access to VibeFlo
                </p>
              </div>
              
              <div className="bg-gray-700/70 p-4 rounded-md">
                <h4 className="text-md font-medium text-white">Didn't receive the email?</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-white/80">
                  <li>Check your spam or junk folder</li>
                  <li>Verify you entered the correct email address</li>
                  <li>Wait a few minutes - sometimes emails take time to arrive</li>
                </ul>
                <button
                  onClick={handleResendVerification}
                  className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Resend Verification Email
                </button>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <Link 
                  to="/login" 
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Go to Login
                </Link>
                <Link 
                  to="/" 
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-400 text-sm font-medium rounded-md text-white bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register; 