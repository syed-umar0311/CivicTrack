/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ComplaintForm } from './pages/ComplaintForm';
import { Navbar } from './components/layout/Navbar';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
          <Navbar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg w-64 sm:w-96">
                <span className="text-slate-400 text-sm truncate">Search complaints, houses, or IDs...</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                <button className="hidden sm:block px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Generate Report</button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <PrivateRoute>
                      <ComplaintForm />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
