import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_FACILITIES, INITIAL_FACILITY_BARANGAYS } from '../lib/constants';
import { toast } from 'sonner';

// 1. Create the Context
const AppContext = createContext();

// 2. Create the Provider Component
export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [facilityBarangays, setFacilityBarangays] = useState(INITIAL_FACILITY_BARANGAYS);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Auth & Session Logic
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    
    supabase.auth.getSession().then(({ data: { session } }) => { 
        setSession(session); 
        setLoading(false); 
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') localStorage.removeItem('abtc_login_time');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Metadata (Facilities, Settings, Profile)
  useEffect(() => {
    if (session) {
      // Fetch Settings
      supabase.from('settings').select('*').single().then(({data}) => { if(data) setGlobalSettings(data); });
      // Fetch Profile
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => { if(data) setUserProfile(data); });
      // Fetch Facilities
      fetchFacilitiesList();
    }
  }, [session]);

  const fetchFacilitiesList = async () => {
    try {
      const { data } = await supabase.from('facilities').select('*');
      let combinedFacilities = [...DEFAULT_FACILITIES];
      let combinedBarangays = { ...INITIAL_FACILITY_BARANGAYS };
      
      if (data && data.length > 0) {
        const dbNames = data.map(f => f.name);
        const dbBarangays = {};
        data.forEach(f => { 
            if (f.barangays?.length > 0) dbBarangays[f.name] = f.barangays; 
        });
        combinedFacilities = [...new Set([...combinedFacilities, ...dbNames])];
        combinedBarangays = { ...combinedBarangays, ...dbBarangays };
      }
      setFacilities(combinedFacilities);
      setFacilityBarangays(combinedBarangays);
    } catch (err) { console.error("Error loading facilities", err); }
  };

  const user = useMemo(() => {
    if (!session) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.facility_name || 'Unknown Facility',
      fullName: session.user.user_metadata?.full_name, 
      role: session.user.user_metadata?.role || 'user'
    };
  }, [session]);

  const logout = () => supabase.auth.signOut();

  const value = {
    session,
    user,
    loading,
    facilities,
    setFacilities,
    facilityBarangays,
    setFacilityBarangays,
    globalSettings,
    setGlobalSettings,
    userProfile,
    setUserProfile,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// 3. Export the Custom Hook (This is what AdminDashboard is missing)
export function useApp() {
  return useContext(AppContext);
}