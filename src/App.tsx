import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CodeScanner from './pages/CodeScanner';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import ApiDocs from './pages/ApiDocs';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="scanner" element={<CodeScanner />} />
              <Route path="api-docs" element={<ApiDocs />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;