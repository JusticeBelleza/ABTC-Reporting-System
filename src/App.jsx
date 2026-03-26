import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AppProvider, useApp } from './context/AppContext';

import Login from './components/auth/Login';
import UpdatePasswordForm from './components/auth/UpdatePasswordForm';
import Dashboard from './components/dashboard/Dashboard';

import MainReportTableV2 from './components/reports/MainReportTableV2';

function AppContent() {
  const { session, loading, logout } = useApp();
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);

  useEffect(() => {
    // Listen for Password Recovery events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setShowPasswordUpdate(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Session expiry check (24h limit)
  useEffect(() => {
    if (!session) return;
    const checkSessionAge = () => {
      const loginTime = localStorage.getItem('abtc_login_time');
      if (loginTime) {
        if (Date.now() - parseInt(loginTime, 10) > 86400000) {
          toast.info("Session expired. Please log in again.");
          logout();
        }
      }
    };
    const interval = setInterval(checkSessionAge, 60000);
    return () => clearInterval(interval);
  }, [session, logout]);

  // 1. Keep your loading UI exactly the same
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-900" size={20} /></div>;
  
  // 2. Keep your password update UI exactly the same
  if (showPasswordUpdate) return <UpdatePasswordForm onComplete={() => setShowPasswordUpdate(false)} />;
  
  // 3. Here is where the Router takes over!
  return (
    <Routes>
      {/* The Dashboard Route (Protected)
        If they have a session, show the Dashboard. If not, redirect to /login 
      */}
      <Route 
        path="/" 
        element={session ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      
      {/* The Login Route
        If they DON'T have a session, show Login. If they do, redirect to the Dashboard 
      */}
      <Route 
        path="/login" 
        element={!session ? <Login /> : <Navigate to="/" replace />} 
      />

      {/* SECRET V2 TEST ROUTE: This is where we added the new DOH Form preview! */}
      <Route 
        path="/v2-test" 
        element={
          <div className="p-8 bg-gray-100 min-h-screen">
            <MainReportTableV2 facilityName="Preview Mode (Secret URL)" />
          </div>
        } 
      />

      {/* Catch-all route: If they type a random URL, send them back to the start */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    // This Provider is CRITICAL. It makes useApp() work inside Dashboard.
    <AppProvider>
      {/* We wrap everything inside the Router so all components know about the current URL */}
      <Router>
        <Toaster position="bottom-right" theme="light" closeButton />
        <AppContent />
      </Router>
    </AppProvider>
  );
}