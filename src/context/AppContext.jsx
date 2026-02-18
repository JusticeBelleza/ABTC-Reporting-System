import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_FACILITIES, INITIAL_FACILITY_BARANGAYS } from '../lib/constants';
import { toast } from 'sonner';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [facilityBarangays, setFacilityBarangays] = useState({});
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const lastTokenRef = useRef(null);

  // Auth & Session Logic
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (session?.access_token !== lastTokenRef.current) {
            lastTokenRef.current = session?.access_token;
            setSession(session); 
        }
        setLoading(false); 
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  // Fetch Metadata
  useEffect(() => {
    if (session) {
      supabase.from('settings').select('*').single().then(({data}) => { if(data) setGlobalSettings(data); });
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => { if(data) setUserProfile(data); });
      fetchFacilitiesList();
    }
  }, [session]);

  const fetchFacilitiesList = async () => {
    try {
      // 1. Fetch ALL facilities (Active and Disabled) so reports work for everyone
      const { data } = await supabase
        .from('facilities')
        .select('*')
        .order('name');
      
      let dbNames = [];
      let dbBarangays = {};

      if (data && data.length > 0) {
        // 2. Map the DB data to the App Context structure
        data.forEach(f => {
           // Add to the list (names)
           dbNames.push(f.name);
           
           // Add to the Catchment Area map
           // We support both 'catchment_area' (new) and 'barangays' (old/backup) columns
           const areas = f.catchment_area || f.barangays;
           if (areas && areas.length > 0) {
              dbBarangays[f.name] = areas;
           }
        });
      }

      setFacilities(dbNames);
      setFacilityBarangays(dbBarangays);
      
    } catch (err) { 
      console.error("Error loading facilities", err); 
      // Fallback to constants if DB fails, though currently empty
      setFacilities(DEFAULT_FACILITIES);
      setFacilityBarangays(INITIAL_FACILITY_BARANGAYS);
    }
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
    logout,
    refreshFacilities: fetchFacilitiesList // Exposed so AdminDashboard can trigger updates
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}