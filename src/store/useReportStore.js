import { create } from 'zustand';

export const useReportStore = create((set, get) => ({
  v2Data: {},
  formRowKeys: [],
  otherRowKeys: [],
  formPopulations: {},
  masterPopulations: {},
  availableLocationsToAdd: [],
  selectedLocationToAdd: "",

  // 1. Bulk populate the table after database fetch
  setInitialData: (data) => set({ ...data }),

  // 2. Control the Add Location Dropdown
  setSelectedLocationToAdd: (location) => set({ selectedLocationToAdd: location }),

  // 3. Lightning fast cell updates (No dashboard re-renders!)
  updateCell: (location, field, value) => set((state) => ({
    v2Data: {
      ...state.v2Data,
      [location]: { ...(state.v2Data[location] || {}), [field]: value }
    }
  })),

  // 4. Handle Adding "Other Municipalities"
  addOtherRow: () => {
    const state = get();
    const loc = state.selectedLocationToAdd;
    if (!loc) return null;

    const updatedOtherKeys = [...state.otherRowKeys, loc].sort((a, b) => 
      (a === "Non-Abra") ? 1 : (b === "Non-Abra") ? -1 : a.localeCompare(b)
    );

    set({
      otherRowKeys: updatedOtherKeys,
      formPopulations: { ...state.formPopulations, [loc]: 0 }, // Safely set pop to 0
      availableLocationsToAdd: state.availableLocationsToAdd.filter(l => l !== loc),
      selectedLocationToAdd: ""
    });

    return loc;
  },

  // 5. Handle Removing "Other Municipalities"
  deleteOtherRow: (loc) => {
    const state = get();
    const nextData = { ...state.v2Data };
    delete nextData[loc];

    const nextPops = { ...state.formPopulations };
    delete nextPops[loc];

    const nextAvailable = [...state.availableLocationsToAdd, loc].sort((a, b) => 
      (a === "Non-Abra") ? 1 : (b === "Non-Abra") ? -1 : a.localeCompare(b)
    );

    set({
      otherRowKeys: state.otherRowKeys.filter(k => k !== loc),
      v2Data: nextData,
      formPopulations: nextPops,
      availableLocationsToAdd: nextAvailable
    });
  },

  // 6. Safety cleanup when switching facilities
  reset: () => set({
    v2Data: {},
    formRowKeys: [],
    otherRowKeys: [],
    formPopulations: {},
    masterPopulations: {},
    availableLocationsToAdd: [],
    selectedLocationToAdd: ""
  })
}));