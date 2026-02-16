import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AppProvider, useApp } from './context/AppContext';

import Login from './components/auth/Login';
import UpdatePasswordForm from './components/auth/UpdatePasswordForm';
import Dashboard from './components/dashboard/Dashboard';

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-900" size={20} /></div>;
  
  if (showPasswordUpdate) return <UpdatePasswordForm onComplete={() => setShowPasswordUpdate(false)} />;
  
  if (!session) return <Login />;

  return <Dashboard />;
}

export default function App() {
  return (
    // This Provider is CRITICAL. It makes useApp() work inside Dashboard.
    <AppProvider>
      <Toaster position="bottom-right" theme="light" closeButton />
      <AppContent />
    </AppProvider>
  );
}