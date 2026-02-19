import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // Added profile loading state
  const [facilities, setFacilities] = useState([]); 
  const [facilityBarangays, setFacilityBarangays] = useState({}); 
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const lastTokenRef = useRef(null);

  useEffect(() => {
    if (!supabase) { 
        setLoading(false); 
        setProfileLoading(false);
        return; 
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (session?.access_token !== lastTokenRef.current) {
            lastTokenRef.current = session?.access_token;
            setSession(session); 
        }
        if (!session) setProfileLoading(false);
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
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      setProfileLoading(true);
      supabase.from('settings').select('*').single().then(({data}) => { if(data) setGlobalSettings(data); });
      
      // Fetch the secure profile from the DB
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data, error}) => { 
          if(data) setUserProfile(data); 
          if(error) console.error("Error fetching profile:", error);
          setProfileLoading(false); // Mark profile as loaded
      });
      
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

  // SECURE USER OBJECT: Strictly relies on database profiles, not client metadata
  const user = useMemo(() => {
    if (!session) return null;
    if (profileLoading) return null; // Wait until DB profile is fetched
    
    return {
      id: session.user.id,
      email: session.user.email,
      name: userProfile?.facility_name || 'Unknown Facility',
      fullName: userProfile?.full_name || session.user.email, 
      role: userProfile?.role || 'user', // Defaults to 'user' safely
      facility: userProfile?.facility_name || null
    };
  }, [session, userProfile, profileLoading]);

  const logout = () => {
    lastTokenRef.current = null;
    supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading: loading || profileLoading, // App waits for both session and DB profile
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