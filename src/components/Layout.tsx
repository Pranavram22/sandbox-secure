import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Home, Code, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-8 p-2">
          <Shield className="h-8 w-8 text-emerald-400" />
          <span className="text-xl font-bold">SecureScript AI</span>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/" 
                className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-700 ${
                  location.pathname === '/' ? 'bg-gray-700 text-emerald-400' : ''
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/scanner" 
                className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-700 ${
                  location.pathname === '/scanner' ? 'bg-gray-700 text-emerald-400' : ''
                }`}
              >
                <Code className="h-5 w-5" />
                <span>Code Scanner</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-gray-600 rounded-full h-10 w-10 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-300" />
            </div>
            <div>
              <div className="font-medium">{user.email}</div>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-700 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;