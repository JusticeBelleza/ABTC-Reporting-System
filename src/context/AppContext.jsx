import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); 
  const [facilities, setFacilities] = useState([]); 
  const [facilityBarangays, setFacilityBarangays] = useState({}); 
  const [facilityDetails, setFacilityDetails] = useState({}); 
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const lastTokenRef = useRef(null);

  useEffect(() => {
    if (!supabase) { 
        setLoading(false); 
        setProfileLoading(false);
        return; 
    }
    
    supabase.auth.getSession().then(({ data: { session }, error }) => { 
        if (error) console.warn("Auth session error (likely offline):", error.message);
        if (session?.access_token !== lastTokenRef.current) {
            lastTokenRef.current = session?.access_token;
            setSession(session); 
        }
        if (!session) setProfileLoading(false);
        setLoading(false); 
    }).catch(() => {
        // Fallback for hard network failure during init
        setLoading(false);
        setProfileLoading(false);
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
      
      const fetchUserData = async () => {
          // 1. Fetch Settings Gracefully
          try {
              const { data, error } = await supabase.from('settings').select('*').single();
              if (data) setGlobalSettings(data);
          } catch (err) {
              console.warn("Could not fetch settings. App is likely offline.");
          }

          // 2. Fetch Profile Gracefully
          try {
              const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              if (data) setUserProfile(data);
              if (error && error.code !== 'PGRST116') { // Ignore typical "no rows" error
                  console.warn("Database error fetching profile:", error.message);
              }
          } catch (err) {
              console.warn("Could not fetch profile. App is likely offline.");
          } finally {
              // ALWAYS set to false, even if offline, so the app doesn't hang!
              setProfileLoading(false); 
          }
      };

      fetchUserData();
      fetchFacilitiesList();
    }
  }, [session]);

  const fetchFacilitiesList = async () => {
    try {
      const { data, error } = await supabase.from('facilities').select('*');
      if (error) throw error;

      const dbFacilities = [];
      const dbBarangays = {};
      const dbDetails = {}; 
      
      if (data && data.length > 0) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        data.forEach(f => { 
            dbFacilities.push(f.name);
            
            dbDetails[f.name] = { type: f.type, ownership: f.ownership, municipality: f.municipality }; 

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
      setFacilityDetails(dbDetails); 
    } catch (err) { 
      console.warn("Could not load facilities list. App is likely offline."); 
    }
  };

  // SECURE USER OBJECT: Strictly relies on database profiles, not client metadata
  const user = useMemo(() => {
    if (!session) return null;
    if (profileLoading) return null; // Wait until DB profile is fetched (or fails gracefully)
    
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
    facilityDetails, 
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