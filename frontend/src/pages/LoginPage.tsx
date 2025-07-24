import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    authService.login(username, password)
        .then(() => {
          setIsLoading(false);
          navigate('/dashboard');
        })
        .catch(err => {
          setIsLoading(false);
          setError(err.response?.data?.detail || 'Login failed');
        });
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative w-full max-w-md p-6 sm:p-8 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-6 sm:mb-8 animate-fade-in-down">Welcome Back</h2>
          {error && (
              <p className="text-center text-sm sm:text-base text-red-600 bg-red-100 py-2 sm:py-3 rounded-lg mb-6 animate-shake">
                {error}
              </p>
          )}
          <div className="space-y-6">
            <div className="animate-fade-in-up">
              <label htmlFor="username" className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
                Username
              </label>
              <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md text-sm sm:text-base"
                  placeholder="Enter your username"
              />
            </div>
            <div className="animate-fade-in-up animation-delay-200">
              <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-800 mb-2">
                Password
              </label>
              <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md text-sm sm:text-base"
                  placeholder="Enter your password"
              />
            </div>
            <div className="animate-fade-in-up animation-delay-400">
              <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 sm:py-3 font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base ${
                      isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <span>Signing In...</span>
                    </>
                ) : (
                    <span>Sign In</span>
                )}
              </button>
            </div>
          </div>
          <p className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-gray-600 animate-fade-in-up animation-delay-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-200">
              Sign up
            </a>
          </p>
        </div>
      </div>
  );
};

export default LoginPage;