import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js'; // Uncomment this in production
import { 
  Users, Save, Download, AlertCircle, FileText, Calendar, 
  LogOut, CheckCircle, XCircle, Clock, Shield, MapPin, Plus, Building, List, Layers 
} from 'lucide-react';

// --- Configuration ---
// TODO: Replace these with your actual Supabase Project URL and Anon Key if not using .env
// We wrap the import.meta check to prevent crashes in environments where it's not supported
const getEnv = (key, fallback) => {
  try {
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

const SUPABASE_URL = getEnv("VITE_SUPABASE_URL", "YOUR_SUPABASE_URL_HERE");
const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY", "YOUR_SUPABASE_ANON_KEY_HERE");

// Initialize client
// const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE")
//   ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
//   : null;
const supabase = null; // Set to null for preview without crashing

// --- Constants ---
const DEFAULT_FACILITIES = [
  "Bangued RHU", "Tayum RHU", "Dolores RHU", "Tubo RHU", "Luba RHU", 
  "Manabo RHU", "Lagangilang RHU", "La Paz RHU", "AMDC", "APH"
];

const MUNICIPALITIES = [
  "Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", "Dolores", 
  "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", "Licuan-Baay", 
  "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", "Pilar", "Sallapadan", 
  "San Isidro", "San Juan", "San Quintin", "Tayum", "Tineg", "Tubo", "Villaviciosa"
];

// Specific Barangays based on the provided CSV files
const INITIAL_FACILITY_BARANGAYS = {
  "Bangued RHU": [
    "Agtangao", "Angad", "Banacao", "Bangbangar", "Cabuloan", "Calaba", "Cosili East", "Cosili West", 
    "Dangdangla", "Lingtan", "Lipcan", "Lubong", "Macarcarmay", "Maoay", "Macray", "Malita", 
    "Palao", "Patucannay", "Sagap", "San Antonio", "Santa Rosa", "Sao-atan", "Sappaac", 
    "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7"
  ],
  "Manabo RHU": [
    "Ayyeng (Poblacion)", "Catacdegan Nuevo", "Catacdegan Viejo", "Luzong", 
    "San Jose Norte", "San Jose Sur", "San Juan Norte", "San Juan Sur", 
    "San Ramon East", "San Ramon West", "Santo Tomas"
  ],
  "Luba RHU": [
    "Ampalioc", "Barit", "Gayaman", "Lul-luno", "Luzong", "Nagbukel", "Poblacion", "Sabnangan"
  ],
  "Tubo RHU": [
    "Alangtin", "Amtuagan", "Dilong", "Kili", "Poblacion (Mayabo)", "Supo", "Tiempo", "Tubtuba", "Wayangan"
  ],
  "Dolores RHU": [
    "Bayaan", "Cabaroan", "Calumbaya", "Cardona", "Isit", "Kimmalaba", "Libtec", "Lub-lubba", 
    "Mudiit", "Namit-ingang", "Pacac", "Poblacion", "Salucag", "Talogtog", "Taping"
  ],
  "Tayum RHU": [
    "Bagalay", "Basbasa", "Budac", "Bumpag", "Cabaroan", "Deet", "Gaddani", "Patucannay", 
    "Pias", "Poblacion", "Velasco"
  ],
  "Lagangilang RHU": [
    "Aguet", "Bacooc", "Balais", "Cayapa", "Dalaguisen", "Laang", "Lagben", "Laguiben", 
    "Nagtupacan", "Paganao", "Pawa", "Poblacion", "Presentar", "San Isidro", "Tagodtod", "Taping", "Villacarta"
  ],
  "La Paz RHU": [
    "Benben", "Bulbulala", "Buli", "Canan", "Liguis", "Malabbaga", "Mudeng", "Pidipid", 
    "Poblacion", "San Gregorio", "Toon", "Udangan"
  ]
};

const INITIAL_ROW_STATE = {
  male: 0, female: 0, ageLt15: 0, ageGt15: 0,
  cat1: 0, cat2: 0, cat3: 0,
  totalPatients: 0, abCount: 0, hrCount: 0,
  pvrv: 0, pcecv: 0, hrig: 0, erig: 0,
  dog: 0, cat: 0, othersCount: 0, othersSpec: '',
  washed: 0, remarks: ''
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// --- Helper Functions ---

const mapDbToRow = (record) => ({
  male: record.male || 0,
  female: record.female || 0,
  ageLt15: record.age_lt_15 || 0,
  ageGt15: record.age_gt_15 || 0,
  cat1: record.cat_1 || 0,
  cat2: record.cat_2 || 0,
  cat3: record.cat_3 || 0,
  totalPatients: record.total_patients || 0,
  abCount: record.ab_count || 0,
  hrCount: record.hr_count || 0,
  pvrv: record.pvrv || 0,
  pcecv: record.pcecv || 0,
  hrig: record.hrig || 0,
  erig: record.erig || 0,
  dog: record.dog || 0,
  cat: record.cat || 0,
  othersCount: record.others_count || 0,
  othersSpec: record.others_spec || '',
  washed: record.washed || 0,
  remarks: record.remarks || ''
});

const mapRowToDb = (row) => ({
  male: row.male,
  female: row.female,
  age_lt_15: row.ageLt15,
  age_gt_15: row.ageGt15,
  cat_1: row.cat1,
  cat_2: row.cat2,
  cat_3: row.cat3,
  total_patients: row.totalPatients,
  ab_count: row.abCount,
  hr_count: row.hrCount,
  pvrv: row.pvrv,
  pcecv: row.pcecv,
  hrig: row.hrig,
  erig: row.erig,
  dog: row.dog,
  cat: row.cat,
  others_count: row.othersCount,
  others_spec: row.othersSpec,
  washed: row.washed,
  remarks: row.remarks
});

const StatusBadge = ({ status }) => {
  const styles = {
    'Draft': 'bg-gray-200 text-gray-700',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${styles[status] || styles['Draft']}`}>
      {status || 'Draft'}
    </span>
  );
};

export default function App() {
  const [user, setUser] = useState(null); 
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [facilityBarangays, setFacilityBarangays] = useState(INITIAL_FACILITY_BARANGAYS);
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6 text-blue-900">
            <Shield size={48} />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">ABTC Reporting System</h1>
          <p className="text-center text-gray-500 mb-8">Provincial Health Office</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setUser({ name: 'PHO', role: 'admin' })}
              className="w-full bg-blue-900 text-white p-3 rounded hover:bg-blue-800 transition flex items-center justify-center gap-2"
            >
              <Users size={18} /> Login as PHO (Admin)
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">OR SELECT FACILITY</span></div>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {facilities.map(f => (
                <button 
                  key={f}
                  onClick={() => setUser({ name: f, role: 'user' })}
                  className="w-full border border-gray-300 p-2 rounded hover:bg-gray-50 text-left px-4 text-gray-700"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dashboard 
      user={user} 
      facilities={facilities}
      setFacilities={setFacilities}
      facilityBarangays={facilityBarangays}
      setFacilityBarangays={setFacilityBarangays}
      year={year} 
      month={month} 
      setYear={setYear} 
      setMonth={setMonth} 
      onLogout={() => setUser(null)} 
    />
  );
}

function Dashboard({ 
  user, facilities, setFacilities, 
  facilityBarangays, setFacilityBarangays,
  year, month, setYear, setMonth, onLogout 
}) {
  const [data, setData] = useState({});
  const [reportStatus, setReportStatus] = useState('Draft');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Add Facility State
  const [isAddingFacility, setIsAddingFacility] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newFacilityType, setNewFacilityType] = useState('Hospital'); // 'Hospital' or 'RHU'
  const [newBarangayList, setNewBarangayList] = useState('');
  
  const [adminViewMode, setAdminViewMode] = useState('dashboard'); // 'dashboard', 'review', 'consolidated'
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityStatuses, setFacilityStatuses] = useState({});

  const isConsolidatedView = adminViewMode === 'consolidated';

  // --- Dynamic Row Generation ---
  const getRowKeysForFacility = (facilityName, consolidated = false) => {
    // Consolidated View always shows Municipalities only
    if (consolidated) return MUNICIPALITIES;

    // If Hospital (AMDC/APH) or undefined or has NO barangays defined, show all Municipalities
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) {
      return MUNICIPALITIES;
    }
    
    // If RHU: Host Municipality -> Barangays -> Others -> Other Municipalities
    const barangays = facilityBarangays[facilityName] || [];
    
    // Find the host municipality name (e.g. "Manabo" from "Manabo RHU")
    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));

    if (barangays.length > 0 && hostMunicipality) {
      // Return: Host (Top) -> Barangays -> Separator -> Remaining Municipalities
      const otherMunicipalities = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      return [hostMunicipality, ...barangays, "Others:", ...otherMunicipalities];
    }
    
    // Fallback if no matching host found
    if (barangays.length > 0) {
        return [...barangays, "Others:", ...MUNICIPALITIES];
    }
    
    return MUNICIPALITIES;
  };

  const activeFacilityName = user.role === 'admin' ? (isConsolidatedView ? 'PHO Consolidated' : selectedFacility) : user.name;
  const currentRows = useMemo(() => {
    return getRowKeysForFacility(activeFacilityName, isConsolidatedView);
  }, [activeFacilityName, isConsolidatedView, facilityBarangays]);

  // Identify the Host Municipality for the current view (if any)
  const currentHostMunicipality = useMemo(() => {
    if (isConsolidatedView) return null;
    if (activeFacilityName === "AMDC" || activeFacilityName === "APH") return null;
    return MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null;
  }, [activeFacilityName, isConsolidatedView]);

  // Initialize Data
  const initData = (rowKeys) => {
    const d = {};
    rowKeys.forEach(k => {
      if (k !== "Others:") {
        d[k] = { ...INITIAL_ROW_STATE };
      }
    });
    return d;
  };

  // --- Effects ---
  useEffect(() => {
    if (user.role === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      if (adminViewMode === 'consolidated') fetchConsolidatedData();
    } else {
      fetchReport(user.name);
    }
  }, [user, year, month, adminViewMode]);

  // --- Actions ---

  const handleAddFacility = () => {
    const name = newFacilityName.trim();
    if (name && !facilities.includes(name)) {
      setFacilities([...facilities, name]);
      
      // If it's an RHU and has barangays, save them to the config state
      if (newFacilityType === 'RHU' && newBarangayList.trim()) {
        const bList = newBarangayList.split(',').map(b => b.trim()).filter(b => b.length > 0);
        setFacilityBarangays(prev => ({
          ...prev,
          [name]: bList
        }));
      }

      setNewFacilityName('');
      setNewBarangayList('');
      setIsAddingFacility(false);
    }
  };

  const fetchFacilityStatuses = async () => {
    if (!supabase) {
      // Demo logic
      const demoStatuses = {};
      facilities.forEach(f => demoStatuses[f] = Math.random() > 0.7 ? 'Pending' : (Math.random() > 0.5 ? 'Approved' : 'Draft'));
      setFacilityStatuses(demoStatuses);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('abtc_reports').select('facility, status').eq('year', year).eq('month', month);
      if (error) throw error;
      const statuses = {};
      facilities.forEach(f => statuses[f] = 'Draft');
      if (data) data.forEach(r => statuses[r.facility] = r.status);
      setFacilityStatuses(statuses);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchConsolidatedData = async () => {
    setLoading(true);
    setMsg('Consolidating data from all facilities...');
    
    // Init empty consolidated structure for all municipalities
    const consolidated = {};
    MUNICIPALITIES.forEach(m => consolidated[m] = { ...INITIAL_ROW_STATE });

    if (!supabase) {
      // DEMO: Generate random consolidated data
      MUNICIPALITIES.forEach(m => {
        consolidated[m] = {
          ...INITIAL_ROW_STATE,
          male: Math.floor(Math.random() * 50),
          female: Math.floor(Math.random() * 50),
          dog: Math.floor(Math.random() * 80),
          totalPatients: Math.floor(Math.random() * 100)
        };
      });
      setData(consolidated);
      setLoading(false);
      setMsg('');
      return;
    }

    try {
      // Fetch ALL reports for this month/year regardless of facility
      const { data: records, error } = await supabase
        .from('abtc_reports')
        .select('*')
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;

      if (records) {
        records.forEach(record => {
          const m = record.municipality;
          // Only consolidate valid municipalities (ignore internal barangay breakdowns for the main report)
          if (consolidated[m]) {
             // Sum numeric fields
             consolidated[m].male += (record.male || 0);
             consolidated[m].female += (record.female || 0);
             consolidated[m].ageLt15 += (record.age_lt_15 || 0);
             consolidated[m].ageGt15 += (record.age_gt_15 || 0);
             consolidated[m].cat1 += (record.cat_1 || 0);
             consolidated[m].cat2 += (record.cat_2 || 0);
             consolidated[m].cat3 += (record.cat_3 || 0);
             consolidated[m].totalPatients += (record.total_patients || 0);
             consolidated[m].abCount += (record.ab_count || 0);
             consolidated[m].hrCount += (record.hr_count || 0);
             consolidated[m].pvrv += (record.pvrv || 0);
             consolidated[m].pcecv += (record.pcecv || 0);
             consolidated[m].hrig += (record.hrig || 0);
             consolidated[m].erig += (record.erig || 0);
             consolidated[m].dog += (record.dog || 0);
             consolidated[m].cat += (record.cat || 0);
             consolidated[m].othersCount += (record.others_count || 0);
             consolidated[m].washed += (record.washed || 0);
             // Note: Remarks and OthersSpec are not concatenated to avoid clutter
          }
        });
      }
      setData(consolidated);
    } catch (err) {
      console.error(err);
      setMsg('Error consolidating data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (facilityName) => {
    setLoading(true);
    setMsg('');
    const rows = getRowKeysForFacility(facilityName);
    
    if (!supabase) {
      setData(initData(rows)); 
      setReportStatus('Draft');
      setLoading(false);
      return;
    }

    try {
      const { data: records, error } = await supabase
        .from('abtc_reports')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .eq('facility', facilityName);

      if (error) throw error;

      if (records && records.length > 0) {
        const newData = initData(rows);
        records.forEach(r => {
          // Map snake_case (DB) to camelCase (App)
          if (newData[r.municipality]) newData[r.municipality] = mapDbToRow(r);
        });
        setData(newData);
        setReportStatus(records[0].status || 'Draft');
      } else {
        setData(initData(rows));
        setReportStatus('Draft');
      }
    } catch (err) {
      console.error(err);
      setMsg('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newStatus) => {
    const targetFacility = user.role === 'admin' ? selectedFacility : user.name;
    if (!supabase) {
      setReportStatus(newStatus);
      alert(`Demo: Report for ${targetFacility} ${newStatus === 'Pending' ? 'submitted' : 'saved'}!`);
      if (user.role === 'admin' && (newStatus === 'Approved' || newStatus === 'Rejected')) {
        setAdminViewMode('dashboard');
      }
      return;
    }

    setLoading(true);
    
    // Convert App State (camelCase) to DB Columns (snake_case)
    const payload = Object.entries(data).map(([municipality, row]) => ({
      ...mapRowToDb(row),
      year,
      month,
      municipality,
      facility: targetFacility,
      status: newStatus
    }));

    try {
      await supabase.from('abtc_reports').delete().eq('year', year).eq('month', month).eq('facility', targetFacility);
      const { error } = await supabase.from('abtc_reports').insert(payload);
      if (error) throw error;

      setReportStatus(newStatus);
      setMsg(newStatus === 'Pending' ? 'Report submitted to PHO!' : 'Draft saved.');
      
      if (user.role === 'admin') {
        fetchFacilityStatuses();
        if (newStatus === 'Approved' || newStatus === 'Rejected') setAdminViewMode('dashboard');
      }
    } catch (err) { setMsg(`Error: ${err.message}`); } finally { setLoading(false); }
  };

  const handleChange = (municipality, field, value) => {
    if (user.role !== 'admin' && reportStatus !== 'Draft' && reportStatus !== 'Rejected') return;
    
    // Prevent manual editing of the Host Municipality (it should be auto-computed)
    if (municipality === currentHostMunicipality) return;

    setData(prev => {
      const newData = { ...prev };
      
      // 1. Update the specific row
      newData[municipality] = {
        ...newData[municipality],
        [field]: field === 'othersSpec' || field === 'remarks' ? value : Number(value)
      };

      // 2. Auto-compute Host Municipality Total
      // Check if the modified row is a barangay of the current facility
      const barangays = facilityBarangays[activeFacilityName] || [];
      
      if (currentHostMunicipality && barangays.includes(municipality)) {
          const totalRow = { ...INITIAL_ROW_STATE };
          const numericFields = [
            'male', 'female', 'ageLt15', 'ageGt15', 
            'cat1', 'cat2', 'cat3', 
            'totalPatients', 'abCount', 'hrCount', 
            'pvrv', 'pcecv', 'hrig', 'erig', 
            'dog', 'cat', 'othersCount', 'washed'
          ];
          
          barangays.forEach(b => {
             const bRow = newData[b] || INITIAL_ROW_STATE;
             numericFields.forEach(f => {
               totalRow[f] += (bRow[f] || 0);
             });
          });
          
          newData[currentHostMunicipality] = {
             ...newData[currentHostMunicipality],
             ...totalRow,
             remarks: 'Auto-computed from Barangays' // Optional marker
          };
      }

      return newData;
    });
  };

  const getComputations = (row) => {
    if (!row) return INITIAL_ROW_STATE;
    const sexTotal = (row.male || 0) + (row.female || 0);
    const ageTotal = (row.ageLt15 || 0) + (row.ageGt15 || 0);
    const cat23 = (row.cat2 || 0) + (row.cat3 || 0);
    const catTotal = (row.cat1 || 0) + cat23;
    const animalTotal = (row.dog || 0) + (row.cat || 0) + (row.othersCount || 0);
    const percent = animalTotal > 0 ? ((row.washed || 0) / animalTotal * 100).toFixed(0) + '%' : '0%';
    const sexMismatch = sexTotal !== ageTotal;
    return { sexTotal, ageTotal, cat23, catTotal, animalTotal, percent, sexMismatch };
  };

  const grandTotals = useMemo(() => {
    const totals = { ...INITIAL_ROW_STATE, sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0 };
    Object.values(data).forEach(row => {
      const c = getComputations(row);
      totals.male += row.male || 0;
      totals.female += row.female || 0;
      totals.sexTotal += c.sexTotal;
      totals.ageLt15 += row.ageLt15 || 0;
      totals.ageGt15 += row.ageGt15 || 0;
      totals.ageTotal += c.ageTotal;
      totals.cat1 += row.cat1 || 0;
      totals.cat2 += row.cat2 || 0;
      totals.cat3 += row.cat3 || 0;
      totals.cat23 += c.cat23;
      totals.catTotal += c.catTotal;
      totals.totalPatients += row.totalPatients || 0;
      totals.abCount += row.abCount || 0;
      totals.hrCount += row.hrCount || 0;
      totals.pvrv += row.pvrv || 0;
      totals.pcecv += row.pcecv || 0;
      totals.hrig += row.hrig || 0;
      totals.erig += row.erig || 0;
      totals.dog += row.dog || 0;
      totals.cat += row.cat || 0;
      totals.othersCount += row.othersCount || 0;
      totals.animalTotal += c.animalTotal;
      totals.washed += row.washed || 0;
    });
    return totals;
  }, [data]);

  // --- Render ---
  const renderTable = (readOnly) => (
    <div className="overflow-x-auto shadow-lg rounded-lg bg-white border border-gray-300">
      <table className="w-full border-collapse">
        <thead>
          <tr className={`${isConsolidatedView ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-700'} uppercase text-xs text-center`}>
            <th rowSpan={3} className={`py-2 px-3 border border-gray-300 sticky left-0 z-20 min-w-[200px] ${isConsolidatedView ? 'bg-purple-900' : 'bg-gray-200'}`}>
              {isConsolidatedView ? "Municipality" : (facilityBarangays[activeFacilityName] ? "Barangay / Municipality" : "Municipality")}
            </th>
            <th colSpan={3} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-700' : 'bg-blue-50'}`}>Human Cases (Sex)</th>
            <th colSpan={3} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-700' : 'bg-blue-50'}`}>Human Cases (Age)</th>
            <th colSpan={5} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-800' : 'bg-green-50'}`}>AB Category</th>
            <th colSpan={2} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-700' : 'bg-purple-50'}`}>Status</th>
            <th colSpan={4} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-800' : 'bg-orange-50'}`}>PEP</th>
            <th colSpan={5} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-700' : 'bg-red-50'}`}>Biting Animals</th>
            <th colSpan={2} className={`border border-gray-300 ${isConsolidatedView ? 'bg-purple-800' : 'bg-yellow-50'}`}>Washing</th>
            <th rowSpan={3} className={`border border-gray-300 min-w-[150px] ${isConsolidatedView ? 'bg-purple-900' : ''}`}>Remarks</th>
          </tr>
          <tr className={`${isConsolidatedView ? 'bg-purple-100 text-purple-900' : 'bg-gray-50 text-gray-600'} text-[10px] font-bold text-center`}>
            <th className="border border-gray-300">M</th><th className="border border-gray-300">F</th><th className="border border-gray-300 bg-opacity-20 bg-gray-500">Total</th>
            <th className="border border-gray-300">&lt;15</th><th className="border border-gray-300">&gt;15</th><th className="border border-gray-300 bg-opacity-20 bg-gray-500">Total</th>
            <th className="border border-gray-300">I</th><th className="border border-gray-300">II</th><th className="border border-gray-300">III</th><th className="border border-gray-300 bg-opacity-20 bg-gray-500">II+III</th><th className="border border-gray-300 bg-opacity-20 bg-gray-500">Tot</th>
            <th className="border border-gray-300">Tot</th><th className="border border-gray-300">AB</th>
            <th className="border border-gray-300">PVRV</th><th className="border border-gray-300">PCECV</th><th className="border border-gray-300">HRIG</th><th className="border border-gray-300">ERIG</th>
            <th className="border border-gray-300">Dog</th><th className="border border-gray-300">Cat</th><th className="border border-gray-300">Oth</th><th className="border border-gray-300">Spec</th><th className="border border-gray-300 bg-opacity-20 bg-gray-500">Tot</th>
            <th className="border border-gray-300">No.</th><th className="border border-gray-300 bg-opacity-20 bg-gray-500">%</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 text-xs">
          {currentRows.map((key, idx) => {
            if (key === "Others:") {
              return (
                <tr key="others-separator" className="bg-gray-200 font-bold">
                  <td colSpan={26} className="py-2 px-3 border border-gray-400 text-left sticky left-0 z-10 bg-gray-200">
                    Others (Municipalities)
                  </td>
                </tr>
              );
            }

            const row = data[key] || INITIAL_ROW_STATE;
            const c = getComputations(row);
            const isMunicipalityRow = MUNICIPALITIES.includes(key);
            const isHostRow = key === currentHostMunicipality;
            const isRowReadOnly = readOnly || isHostRow || isConsolidatedView; 
            
            return (
              <tr key={key} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 ${isHostRow ? 'bg-blue-100 font-bold' : ''}`}>
                <td className={`py-1 px-2 border font-medium sticky left-0 z-10 bg-inherit whitespace-nowrap ${isMunicipalityRow ? 'text-blue-800' : 'text-gray-800 pl-4'} ${isHostRow ? 'bg-blue-100' : ''}`}>
                  {key} {isHostRow && "(Total)"}
                </td>
                {['male', 'female'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row[f]||''} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-blue-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                <td className="p-1 border text-center font-bold bg-gray-100">{c.sexTotal}</td>
                {['ageLt15', 'ageGt15'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row[f]||''} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-blue-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                <td className={`p-1 border text-center font-bold bg-gray-100 ${c.sexMismatch?'text-red-500':''}`}>{c.ageTotal}</td>
                {['cat1', 'cat2', 'cat3'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row[f]||''} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-green-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                <td className="p-1 border text-center bg-gray-100">{c.cat23}</td>
                <td className="p-1 border text-center font-bold bg-gray-100">{c.catTotal}</td>
                {['totalPatients', 'abCount'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row[f]||''} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-purple-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                {['pvrv', 'pcecv', 'hrig', 'erig'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row[f]||''} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-orange-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                {['dog', 'cat', 'othersCount'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row[f]||''} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-red-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                <td className="p-0 border"><input disabled={isRowReadOnly} type="text" value={row.othersSpec} onChange={e=>handleChange(key, 'othersSpec', e.target.value)} className={`w-full h-full p-1 bg-transparent focus:bg-red-100 outline-none text-[10px] ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>
                <td className="p-1 border text-center font-bold bg-gray-100">{c.animalTotal}</td>
                <td className="p-0 border"><input disabled={isRowReadOnly} type="number" value={row.washed||''} onChange={e=>handleChange(key, 'washed', e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-yellow-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>
                <td className="p-1 border text-center bg-gray-100 text-[10px]">{c.percent}</td>
                <td className="p-0 border"><input disabled={isRowReadOnly} type="text" value={row.remarks} onChange={e=>handleChange(key, 'remarks', e.target.value)} className={`w-full h-full p-1 bg-transparent focus:bg-gray-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>
              </tr>
            );
          })}
          {/* Grand Total */}
          <tr className="bg-gray-800 text-white font-bold text-xs sticky bottom-0 z-20">
            <td className="py-2 px-2 border border-gray-600 sticky left-0 bg-gray-800">
              {isConsolidatedView ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}
            </td>
            <td className="text-center border border-gray-600">{grandTotals.male}</td>
            <td className="text-center border border-gray-600">{grandTotals.female}</td>
            <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.sexTotal}</td>
            <td className="text-center border border-gray-600">{grandTotals.ageLt15}</td>
            <td className="text-center border border-gray-600">{grandTotals.ageGt15}</td>
            <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.ageTotal}</td>
            <td className="text-center border border-gray-600">{grandTotals.cat1}</td>
            <td className="text-center border border-gray-600">{grandTotals.cat2}</td>
            <td className="text-center border border-gray-600">{grandTotals.cat3}</td>
            <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.cat23}</td>
            <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.catTotal}</td>
            <td className="text-center border border-gray-600">{grandTotals.totalPatients}</td>
            <td className="text-center border border-gray-600">{grandTotals.abCount}</td>
            <td className="text-center border border-gray-600">{grandTotals.pvrv}</td>
            <td className="text-center border border-gray-600">{grandTotals.pcecv}</td>
            <td className="text-center border border-gray-600">{grandTotals.hrig}</td>
            <td className="text-center border border-gray-600">{grandTotals.erig}</td>
            <td className="text-center border border-gray-600">{grandTotals.dog}</td>
            <td className="text-center border border-gray-600">{grandTotals.cat}</td>
            <td className="text-center border border-gray-600">{grandTotals.othersCount}</td>
            <td className="text-center border border-gray-600 bg-gray-700"></td>
            <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.animalTotal}</td>
            <td className="text-center border border-gray-600">{grandTotals.washed}</td>
            <td className="text-center border border-gray-600 bg-gray-700"></td>
            <td className="text-center border border-gray-600 bg-gray-700"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}