import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_FACILITIES, INITIAL_FACILITY_BARANGAYS } from '../lib/constants';
import { toast } from 'sonner';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [facilityBarangays, setFacilityBarangays] = useState(INITIAL_FACILITY_BARANGAYS);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Use a ref to track the current access token to prevent unnecessary updates
  const lastTokenRef = useRef(null);

  // Auth & Session Logic
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (session?.access_token !== lastTokenRef.current) {
            lastTokenRef.current = session?.access_token;
            setSession(session); 
        }
        setLoading(false); 
    });
    
    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // FIX: Only update state if the token actually changed (prevents Alt-Tab re-renders)
      if (session?.access_token !== lastTokenRef.current || event === 'SIGNED_OUT') {
        lastTokenRef.current = session?.access_token;
        setSession(session);
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('abtc_login_time');
        lastTokenRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Metadata (Facilities, Settings, Profile)
  useEffect(() => {
    if (session) {
      supabase.from('settings').select('*').single().then(({data}) => { if(data) setGlobalSettings(data); });
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => { if(data) setUserProfile(data); });
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

  const logout = () => {
    lastTokenRef.current = null;
    supabase.auth.signOut();
  };

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

export function useApp() {
  return useContext(AppContext);
}