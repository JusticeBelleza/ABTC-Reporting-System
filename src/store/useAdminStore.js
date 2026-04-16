import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAdminStore = create((set, get) => ({
  facilityMeta: [],
  facilityOwners: {},
  yearlyStats: { main: [] },
  facilityStatuses: {},
  showArchived: false,
  cardPage: 1,
  modalPage: 1,

  // UI Modals State
  confirmModal: { isOpen: false, action: null, facility: null },
  statusModal: { isOpen: false, status: null },
  leaderboardModal: { isOpen: false, filter: null },

  // Basic Setters
  setShowArchived: (val) => set({ showArchived: val, cardPage: 1 }),
  setCardPage: (val) => set({ cardPage: val }),
  setModalPage: (val) => set({ modalPage: val }),
  
  setConfirmModal: (modal) => set((state) => ({ confirmModal: { ...state.confirmModal, ...modal } })),
  setStatusModal: (modal) => set((state) => ({ statusModal: { ...state.statusModal, ...modal } })),
  setLeaderboardModal: (modal) => set((state) => ({ leaderboardModal: { ...state.leaderboardModal, ...modal } })),

  // Async Fetchers (Data Engine)
  fetchFacilityMeta: async () => {
    try {
      const { data } = await supabase.from('facilities').select('name, status, type, ownership');
      if (data) set({ facilityMeta: data });
    } catch (err) { console.error("Error fetching facility meta", err); }
  },

  fetchFacilityOwners: async () => {
    try {
      const { data } = await supabase.from('profiles').select('facility_name, full_name, email');
      if (data) {
        const mapping = {};
        data.forEach(u => { 
          if (u.facility_name) {
            const displayName = u.full_name || u.email || 'User Assigned (No Name)';
            if (mapping[u.facility_name]) {
                mapping[u.facility_name] += `, ${displayName}`;
            } else {
                mapping[u.facility_name] = displayName;
            }
          } 
        });
        set({ facilityOwners: mapping });
      }
    } catch (error) { console.error("Error fetching facility owners:", error); }
  },

  fetchV2StatsAndStatuses: async (year, month, quarter, periodType) => {
    if (!year) return;
    try {
        const { data: v2Data } = await supabase.from('abtc_reports_v2').select('facility, month, status').eq('year', year);
        
        const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
        const { data: currentPeriodData } = await supabase.from('abtc_reports_v2')
            .select('facility, status, created_at')
            .eq('year', year)
            .eq('month', currentPeriod);
        
        const currentStatusMap = {};
        if (currentPeriodData) {
            currentPeriodData.forEach(row => {
                const fac = row.facility;
                if (!currentStatusMap[fac]) currentStatusMap[fac] = { status: 'Draft', lastUpdated: row.created_at };
                
                if (new Date(row.created_at) > new Date(currentStatusMap[fac].lastUpdated)) {
                    currentStatusMap[fac].lastUpdated = row.created_at;
                }

                if (row.status === 'Approved') currentStatusMap[fac].status = 'Approved';
                else if (row.status === 'Pending' && currentStatusMap[fac].status !== 'Approved') currentStatusMap[fac].status = 'Pending';
                else if (row.status === 'Rejected' && currentStatusMap[fac].status === 'Draft') currentStatusMap[fac].status = 'Rejected';
            });
        }
        set({ yearlyStats: { main: v2Data || [] }, facilityStatuses: currentStatusMap });
    } catch (error) { console.error("Error fetching V2 stats:", error); }
  }
}));