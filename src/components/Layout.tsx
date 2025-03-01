import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Home, Code, LogOut, User, Bell, Settings, AlertTriangle, X, Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = React.useState(3);
  const [showNotifications, setShowNotifications] = React.useState(false);

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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (notifications > 0) {
      setNotifications(0);
    }
  };

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
            <li>
              <Link 
                to="/api-docs" 
                className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-700 ${
                  location.pathname === '/api-docs' ? 'bg-gray-700 text-emerald-400' : ''
                }`}
              >
                <Server className="h-5 w-5" />
                <span>API & Integrations</span>
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
        {/* Top Navigation */}
        <div className="bg-gray-800 p-4 flex justify-end items-center space-x-4 shadow-md">
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className="p-2 rounded-full hover:bg-gray-700 relative"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-700">
                <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium">Notifications</h3>
                  <button className="text-gray-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-gray-700 hover:bg-gray-700">
                    <div className="flex items-start">
                      <div className="bg-emerald-500/20 p-2 rounded-full mr-3">
                        <Shield className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Security scan completed</p>
                        <p className="text-xs text-gray-400 mt-1">Your latest code scan found 2 vulnerabilities</p>
                        <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-b border-gray-700 hover:bg-gray-700">
                    <div className="flex items-start">
                      <div className="bg-amber-500/20 p-2 rounded-full mr-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New vulnerability detected</p>
                        <p className="text-xs text-gray-400 mt-1">High severity SQL injection vulnerability found</p>
                        <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-gray-700">
                    <div className="flex items-start">
                      <div className="bg-purple-500/20 p-2 rounded-full mr-3">
                        <Code className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New feature available</p>
                        <p className="text-xs text-gray-400 mt-1">Try our improved code scanning algorithm</p>
                        <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 text-center border-t border-gray-700">
                  <button className="text-sm text-emerald-400 hover:text-emerald-300">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button className="p-2 rounded-full hover:bg-gray-700">
            <Settings className="h-5 w-5" />
          </button>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;