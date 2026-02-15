import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase } from './lib/supabase';
import { DEFAULT_FACILITIES, INITIAL_FACILITY_BARANGAYS } from './lib/constants';

import Login from './components/auth/Login';
import UpdatePasswordForm from './components/auth/UpdatePasswordForm';
import Dashboard from './components/dashboard/Dashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [facilityBarangays, setFacilityBarangays] = useState(INITIAL_FACILITY_BARANGAYS);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setShowPasswordUpdate(true);
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('abtc_login_time');
      }
    });
    return () => {
        subscription.unsubscribe();
        // Cleanup global variable on unmount 
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const checkSessionAge = () => {
      const loginTime = localStorage.getItem('abtc_login_time');
      if (loginTime) {
        const timeElapsed = Date.now() - parseInt(loginTime, 10);
        if (timeElapsed > 86400000) {
          toast.info("Session expired (24h limit). Please log in again.");
          supabase.auth.signOut();
        }
      }
    };
    checkSessionAge();
    const interval = setInterval(checkSessionAge, 60000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if(supabase && session) {
      // NOTE: .single() might throw error if 0 rows, consider .maybeSingle() if row might not exist
      supabase.from('settings').select('*').single().then(({data}) => { if(data) setGlobalSettings(data); });
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => { if(data) setUserProfile(data); });
    }
  }, [session]);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      // Fallback logic preserved from your original code
      name: session.user.user_metadata?.facility_name || 'Unknown Facility',
      fullName: session.user.user_metadata?.full_name, 
      role: session.user.user_metadata?.role || 'user'
    };
  }, [session]);

  if (!supabase) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Configuration Missing</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-900" size={20} /></div>;
  
  // NOTE: Pass user prop to UpdatePasswordForm if it needs context, currently it doesn't seem to based on usage
  if (showPasswordUpdate) return <UpdatePasswordForm onComplete={() => setShowPasswordUpdate(false)} />;
  if (!session) return <Login />;

  return (
    <>
      <Toaster position="bottom-right" theme="light" closeButton />
      <Dashboard 
        user={user} 
        facilities={facilities} 
        setFacilities={setFacilities} 
        facilityBarangays={facilityBarangays} 
        setFacilityBarangays={setFacilityBarangays} 
        onLogout={() => supabase.auth.signOut()} 
        globalSettings={globalSettings}
        setGlobalSettings={setGlobalSettings}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
    </>
  );
}