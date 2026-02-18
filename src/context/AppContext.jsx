import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
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
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      const dbFacilities = [];
      const dbBarangays = {};
      
      if (data && data.length > 0) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        data.forEach(f => { 
            dbFacilities.push(f.name);
            let bList = [];
            if (Array.isArray(f.barangays)) {
                bList = f.barangays;
            } else if (typeof f.barangays === 'string' && f.barangays.trim().length > 0) {
                bList = f.barangays.split(',').map(b => b.trim());
            }
            if (bList.length > 0) {
                dbBarangays[f.name] = bList;
            }
        });
      }
      setFacilities(dbFacilities);
      setFacilityBarangays(dbBarangays);
    } catch (err) { console.error("Error loading facilities", err); }
  };

  // UPDATED: This memo now relies on userProfile to ensure facility is not undefined
  const user = useMemo(() => {
    if (!session) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      // Source data from userProfile (database) first, then fallback to metadata
      name: userProfile?.facility_name || session.user.user_metadata?.facility_name || 'Unknown Facility',
      fullName: userProfile?.full_name || session.user.user_metadata?.full_name, 
      role: userProfile?.role || session.user.user_metadata?.role || 'user',
      facility: userProfile?.facility_name || session.user.user_metadata?.facility_name
    };
  }, [session, userProfile]); // userProfile added as a dependency

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