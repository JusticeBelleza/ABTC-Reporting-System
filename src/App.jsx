import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Save, Download, AlertCircle, FileText, Calendar, 
  LogOut, CheckCircle, XCircle, Clock, Shield, MapPin, Plus, 
  Building, List, Layers, UserPlus, Filter, Loader2, PlusCircle 
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Client (Safe Mode)
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Secondary Client (for Admin user creation)
const adminHelperClient = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  : null;

// --- Constants ---
const DEFAULT_FACILITIES = ["Bangued RHU", "Tayum RHU", "Dolores RHU", "Tubo RHU", "Luba RHU", "Manabo RHU", "Lagangilang RHU", "La Paz RHU", "AMDC", "APH"];
const MUNICIPALITIES = ["Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", "Dolores", "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", "Licuan-Baay", "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", "Pilar", "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum", "Tineg", "Tubo", "Villaviciosa"];
const INITIAL_FACILITY_BARANGAYS = {
  "Bangued RHU": ["Agtangao", "Angad", "Banacao", "Bangbangar", "Cabuloan", "Calaba", "Cosili East", "Cosili West", "Dangdangla", "Lingtan", "Lipcan", "Lubong", "Macarcarmay", "Maoay", "Macray", "Malita", "Palao", "Patucannay", "Sagap", "San Antonio", "Santa Rosa", "Sao-atan", "Sappaac", "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7"],
  "Manabo RHU": ["Ayyeng (Poblacion)", "Catacdegan Nuevo", "Catacdegan Viejo", "Luzong", "San Jose Norte", "San Jose Sur", "San Juan Norte", "San Juan Sur", "San Ramon East", "San Ramon West", "Santo Tomas"],
  "Luba RHU": ["Ampalioc", "Barit", "Gayaman", "Lul-luno", "Luzong", "Nagbukel", "Poblacion", "Sabnangan"],
  "Tubo RHU": ["Alangtin", "Amtuagan", "Dilong", "Kili", "Poblacion (Mayabo)", "Supo", "Tiempo", "Tubtuba", "Wayangan"],
  "Dolores RHU": ["Bayaan", "Cabaroan", "Calumbaya", "Cardona", "Isit", "Kimmalaba", "Libtec", "Lub-lubba", "Mudiit", "Namit-ingang", "Pacac", "Poblacion", "Salucag", "Talogtog", "Taping"],
  "Tayum RHU": ["Bagalay", "Basbasa", "Budac", "Bumpag", "Cabaroan", "Deet", "Gaddani", "Patucannay", "Pias", "Poblacion", "Velasco"],
  "Lagangilang RHU": ["Aguet", "Bacooc", "Balais", "Cayapa", "Dalaguisen", "Laang", "Lagben", "Laguiben", "Nagtupacan", "Paganao", "Pawa", "Poblacion", "Presentar", "San Isidro", "Tagodtod", "Taping", "Villacarta"],
  "La Paz RHU": ["Benben", "Bulbulala", "Buli", "Canan", "Liguis", "Malabbaga", "Mudeng", "Pidipid", "Poblacion", "San Gregorio", "Toon", "Udangan"]
};

// INITIAL ROW STATE
const INITIAL_ROW_STATE = { 
  male: '', female: '', ageLt15: '', ageGt15: '', 
  cat1: '', cat2: '', cat3: '', 
  totalPatients: '', abCount: '', hrCount: '', 
  pvrv: '', pcecv: '', hrig: '', erig: '', 
  dog: '', cat: '', othersCount: '', othersSpec: '', 
  washed: '', remarks: '' 
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const QUARTERS = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

// --- Helper Functions ---
const mapDbToRow = (r) => ({ 
  ...INITIAL_ROW_STATE, 
  ...r,
  male: r.male ?? '', female: r.female ?? '',
  ageLt15: r.age_lt_15 ?? '', ageGt15: r.age_gt_15 ?? '',
  cat1: r.cat_1 ?? '', cat2: r.cat_2 ?? '', cat3: r.cat_3 ?? '',
  totalPatients: r.total_patients ?? '',
  abCount: r.ab_count ?? '', hrCount: r.hr_count ?? '',
  pvrv: r.pvrv ?? '', pcecv: r.pcecv ?? '', hrig: r.hrig ?? '', erig: r.erig ?? '',
  dog: r.dog ?? '', cat: r.cat ?? '',
  othersCount: r.others_count ?? '', othersSpec: r.others_spec ?? '',
  washed: r.washed ?? '', remarks: r.remarks ?? ''
});

const toInt = (val) => val === '' ? 0 : Number(val);

const mapRowToDb = (r) => ({
  male: toInt(r.male), female: toInt(r.female),
  age_lt_15: toInt(r.ageLt15), age_gt_15: toInt(r.ageGt15),
  cat_1: toInt(r.cat1), cat_2: toInt(r.cat2), cat_3: toInt(r.cat3),
  total_patients: toInt(r.totalPatients),
  ab_count: toInt(r.abCount), hr_count: toInt(r.hrCount),
  pvrv: toInt(r.pvrv), pcecv: toInt(r.pcecv), hrig: toInt(r.hrig), erig: toInt(r.erig),
  dog: toInt(r.dog), cat: toInt(r.cat),
  others_count: toInt(r.othersCount), others_spec: r.othersSpec,
  washed: toInt(r.washed), remarks: r.remarks
});

const getQuarterMonths = (q) => {
  if (q === "1st Quarter") return ["January", "February", "March"];
  if (q === "2nd Quarter") return ["April", "May", "June"];
  if (q === "3rd Quarter") return ["July", "August", "September"];
  if (q === "4th Quarter") return ["October", "November", "December"];
  return [];
};

const StatusBadge = ({ status }) => {
  const styles = { 'Draft': 'bg-gray-200 text-gray-700', 'Pending': 'bg-yellow-100 text-yellow-800', 'Approved': 'bg-green-100 text-green-800', 'Rejected': 'bg-red-100 text-red-800' };
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || styles['Draft']}`}>{status || 'Draft'}</span>;
};

// --- LOGIN COMPONENT ---
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6 text-blue-900"><Shield size={48} /></div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">ABTC Reporting System</h1>
        <p className="text-center text-gray-500 mb-8">Provincial Health Office</p>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white p-3 rounded hover:bg-blue-800 transition font-bold flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin"/>}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // App State to hold facilities (so we can add new ones dynamically)
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [facilityBarangays, setFacilityBarangays] = useState(INITIAL_FACILITY_BARANGAYS);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Configuration Missing</h1>
        <p className="text-gray-600 mb-4">Check .env.local file.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-900">
        <Loader2 size={48} className="animate-spin mb-2" />
        <span className="font-bold animate-pulse">Loading System...</span>
      </div>
    );
  }

  if (!session) return <Login />;

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.facility_name || 'Unknown Facility', 
    role: session.user.user_metadata?.role || 'user'
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Dashboard 
        user={user} 
        facilities={facilities}
        setFacilities={setFacilities}
        facilityBarangays={facilityBarangays}
        setFacilityBarangays={setFacilityBarangays}
        onLogout={() => supabase.auth.signOut()} 
      />
    </>
  );
}

function Dashboard({ user, facilities, setFacilities, facilityBarangays, setFacilityBarangays, onLogout }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [quarter, setQuarter] = useState("1st Quarter");

  const [data, setData] = useState({});
  const [reportStatus, setReportStatus] = useState('Draft');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityStatuses, setFacilityStatuses] = useState({});
  
  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  // --- REAL-TIME NOTIFICATIONS ---
  useEffect(() => {
    if (user.role !== 'admin' || !supabase) return;
    const subscription = supabase
      .channel('realtime-reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'abtc_reports' }, (payload) => {
         const newReport = payload.new;
         toast.info("New Report Received", {
           description: `${newReport.facility} submitted a report for ${newReport.month}.`,
           duration: 5000,
         });
         if (adminViewMode === 'dashboard' && periodType === 'Monthly') {
            fetchFacilityStatuses(); 
         }
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [user.role, adminViewMode, periodType]);

  // --- ADD FACILITY LOGIC ---
  const handleAddFacility = (name, type, barangaysList) => {
    // 1. Add to facilities list
    if (!facilities.includes(name)) {
      setFacilities(prev => [...prev, name]);
      
      // 2. If RHU, add barangays
      if (type === 'RHU' && barangaysList) {
        const bArray = barangaysList.split(',').map(b => b.trim()).filter(b => b);
        setFacilityBarangays(prev => ({ ...prev, [name]: bArray }));
      }
      
      toast.success(`${type} "${name}" added successfully!`);
      setShowAddFacilityModal(false);
    } else {
      toast.error('Facility name already exists');
    }
  };

  // --- ROW GENERATION ---
  const getRowKeysForFacility = (facilityName, consolidated = false) => {
    if (!facilityName) return []; 
    if (consolidated) return MUNICIPALITIES;
    
    // Check if it's a Hospital (Standard or Custom added without barangays)
    // If it's NOT in the facilityBarangays map, treat as Hospital/Municipality-based
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) {
      return MUNICIPALITIES;
    }
    
    // It is an RHU (has barangays)
    const barangays = facilityBarangays[facilityName] || [];
    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));
    
    if (barangays.length > 0 && hostMunicipality) {
      const otherMunicipalities = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      return [hostMunicipality, ...barangays, "Others:", ...otherMunicipalities];
    }
    
    if (barangays.length > 0) return [...barangays, "Others:", ...MUNICIPALITIES];
    return MUNICIPALITIES;
  };

  const activeFacilityName = user.role === 'admin' ? (isConsolidatedView ? 'PHO Consolidated' : selectedFacility) : user.name;
  
  const currentRows = useMemo(() => {
    if (user.role === 'admin' && adminViewMode === 'dashboard') return [];
    return getRowKeysForFacility(activeFacilityName, isConsolidatedView);
  }, [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode]);

  const currentHostMunicipality = useMemo(() => {
    if (!activeFacilityName || isConsolidatedView) return null;
    if (activeFacilityName === "AMDC" || activeFacilityName === "APH") return null;
    return MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null;
  }, [activeFacilityName, isConsolidatedView]);

  const initData = (rowKeys) => {
    const d = {};
    rowKeys.forEach(k => { if (k !== "Others:") d[k] = { ...INITIAL_ROW_STATE }; });
    return d;
  };

  useEffect(() => {
    if (user.role === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      if (adminViewMode === 'consolidated') fetchData();
      if (adminViewMode === 'review' && selectedFacility) fetchData();
    } else {
      fetchData();
    }
  }, [user, year, month, quarter, periodType, adminViewMode, selectedFacility]);

  const fetchFacilityStatuses = async () => {
    if (periodType !== 'Monthly') return; 
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

  const fetchData = async () => {
    setLoading(true);
    const targetFacility = user.role === 'admin' ? (isConsolidatedView ? null : selectedFacility) : user.name;
    const rows = getRowKeysForFacility(targetFacility || 'PHO Consolidated', isConsolidatedView);
    const newData = initData(rows);

    try {
      let query = supabase.from('abtc_reports').select('*').eq('year', year);

      if (periodType === 'Monthly') {
        query = query.eq('month', month);
      } else if (periodType === 'Quarterly') {
        const months = getQuarterMonths(quarter);
        query = query.in('month', months);
      } 
      
      if (isConsolidatedView) {
        query = query.eq('status', 'Approved');
      } else if (targetFacility) {
        query = query.eq('facility', targetFacility);
      }

      const { data: records, error } = await query;
      if (error) throw error;

      if (records) {
        records.forEach(record => {
          const m = record.municipality;
          if (newData[m]) {
             const r = mapDbToRow(record);
             const c = newData[m];
             const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
             keys.forEach(k => {
               c[k] = (toInt(c[k]) + toInt(r[k])) || ''; 
               if(c[k] === 0) c[k] = '';
             });
          }
        });
        
        setData(newData);

        if (periodType === 'Monthly' && !isConsolidatedView && records.length > 0) {
           setReportStatus(records[0].status || 'Draft');
        } else {
           setReportStatus('View Only');
        }
      } else {
        setData(newData);
        setReportStatus('Draft');
      }
    } catch (err) { 
      toast.error('Failed to load data'); 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSave = async (newStatus) => {
    if (periodType !== 'Monthly') { toast.error("You can only save data in Monthly view."); return; }
    
    const targetFacility = user.role === 'admin' ? selectedFacility : user.name;
    setLoading(true);
    
    const payload = Object.entries(data).map(([municipality, row]) => ({
      ...mapRowToDb(row), year, month, municipality, facility: targetFacility, status: newStatus
    }));

    try {
      await supabase.from('abtc_reports').delete().eq('year', year).eq('month', month).eq('facility', targetFacility);
      const { error } = await supabase.from('abtc_reports').insert(payload);
      if (error) throw error;
      
      setReportStatus(newStatus);
      toast.success(newStatus === 'Pending' ? 'Report Submitted Successfully!' : 'Draft Saved');

      if (user.role === 'admin' && (newStatus === 'Approved' || newStatus === 'Rejected')) {
        setAdminViewMode('dashboard'); setSelectedFacility(null);
      }
    } catch (err) { 
      toast.error(`Error: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleChange = (municipality, field, value) => {
    if (periodType !== 'Monthly') return; 
    if (user.role !== 'admin' && reportStatus !== 'Draft' && reportStatus !== 'Rejected') return;
    if (municipality === currentHostMunicipality) return;
    if (field !== 'othersSpec' && field !== 'remarks' && value !== '' && Number(value) < 0) return;

    setData(prev => {
      const newData = { ...prev };
      newData[municipality] = { ...newData[municipality], [field]: field === 'othersSpec' || field === 'remarks' ? value : value };
      
      const barangays = facilityBarangays[activeFacilityName] || [];
      if (currentHostMunicipality && barangays.includes(municipality)) {
          const totalRow = { ...INITIAL_ROW_STATE };
          const numericFields = ['male', 'female', 'ageLt15', 'ageGt15', 'cat1', 'cat2', 'cat3', 'totalPatients', 'abCount', 'hrCount', 'pvrv', 'pcecv', 'hrig', 'erig', 'dog', 'cat', 'othersCount', 'washed'];
          barangays.forEach(b => {
             const bRow = newData[b] || INITIAL_ROW_STATE;
             numericFields.forEach(f => {
               const val = toInt(bRow[f]);
               totalRow[f] = (toInt(totalRow[f]) + val);
             });
          });
          numericFields.forEach(f => { if(totalRow[f] === 0) totalRow[f] = ''; });
          newData[currentHostMunicipality] = { ...newData[currentHostMunicipality], ...totalRow, remarks: 'Auto-computed' };
      }
      return newData;
    });
  };

  const getComputations = (row) => {
    if (!row) return INITIAL_ROW_STATE;
    const sexTotal = toInt(row.male) + toInt(row.female);
    const ageTotal = toInt(row.ageLt15) + toInt(row.ageGt15);
    const cat23 = toInt(row.cat2) + toInt(row.cat3);
    const catTotal = toInt(row.cat1) + cat23;
    const animalTotal = toInt(row.dog) + toInt(row.cat) + toInt(row.othersCount);
    const percent = animalTotal > 0 ? (toInt(row.washed) / animalTotal * 100).toFixed(0) + '%' : '0%';
    const sexMismatch = sexTotal !== ageTotal;
    return { sexTotal, ageTotal, cat23, catTotal, animalTotal, percent, sexMismatch };
  };

  const grandTotals = useMemo(() => {
    const totals = { ...INITIAL_ROW_STATE, sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0 };
    ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'].forEach(k => totals[k] = 0);

    Object.values(data).forEach(row => {
      const c = getComputations(row);
      ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'].forEach(k => totals[k] += toInt(row[k]));
      totals.sexTotal += c.sexTotal; totals.ageTotal += c.ageTotal; totals.cat23 += c.cat23; totals.catTotal += c.catTotal; totals.animalTotal += c.animalTotal;
    });
    return totals;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <style>{`
        .no-spinner::-webkit-inner-spin-button, 
        .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
      `}</style>

      <header className="bg-blue-900 text-white shadow-md py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3"><Shield className="text-yellow-400" size={32} /><div><h1 className="text-xl font-bold tracking-tight">ABTC Reporting System</h1><p className="text-xs text-blue-200">Provincial Health Office - Abra</p></div></div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block"><div className="text-sm font-semibold">{user.name}</div><div className="text-xs text-blue-300 uppercase">{user.role}</div></div>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 p-2 rounded text-xs flex items-center gap-1 transition"><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {user.role === 'admin' && adminViewMode === 'dashboard' && (
          <div className="max-w-6xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Building size={24}/> Facility Reports Status</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddFacilityModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"><PlusCircle size={18} /> Add Facility</button>
                  <button onClick={() => setShowRegisterModal(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2"><UserPlus size={18} /> Manage Users</button>
                  <button onClick={() => setAdminViewMode('consolidated')} className="bg-purple-700 text-white px-4 py-2 rounded shadow hover:bg-purple-800 flex items-center gap-2"><Layers size={18} /> View Consolidated</button>
                </div>
             </div>
             
             <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-center flex-wrap">
                <label className="font-bold text-gray-700">Period:</label>
                <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="border p-2 rounded font-bold text-blue-900">
                   <option value="Monthly">Monthly</option>
                   <option value="Quarterly">Quarterly</option>
                   <option value="Annual">Annual</option>
                </select>

                {periodType === 'Monthly' && (
                  <select value={month} onChange={e => setMonth(e.target.value)} className="border p-2 rounded">{MONTHS.map(m => <option key={m}>{m}</option>)}</select>
                )}
                {periodType === 'Quarterly' && (
                  <select value={quarter} onChange={e => setQuarter(e.target.value)} className="border p-2 rounded">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>
                )}

                <select value={year} onChange={e => setYear(Number(e.target.value))} className="border p-2 rounded">{[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}</select>
                <button onClick={fetchFacilityStatuses} className="text-blue-600 hover:underline text-sm ml-auto">Refresh Status</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {facilities.map(facility => (
                 <div key={facility} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-blue-900">{facility}</h3><StatusBadge status={facilityStatuses[facility]} /></div>
                    <p className="text-sm text-gray-500 mb-4">{periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                    <button onClick={() => { setSelectedFacility(facility); setAdminViewMode('review'); }} className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded text-sm hover:bg-blue-100 font-semibold">
                      {periodType === 'Monthly' ? 'Review Report' : 'View Aggregate'}
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* ... Rest of Dashboard (Tables) remains same ... */}
        {(user.role !== 'admin' || (user.role === 'admin' && (adminViewMode === 'review' || adminViewMode === 'consolidated'))) && (
          <div className="max-w-[95vw] mx-auto">
             <div className="bg-white p-4 rounded-lg shadow mb-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  {user.role === 'admin' && <button onClick={() => { setAdminViewMode('dashboard'); setSelectedFacility(null); }} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-bold">&larr; Back to Dashboard</button>}
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-blue-600" />{isConsolidatedView ? 'Consolidated Report' : `${activeFacilityName} Report`}</h2>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                      <Filter size={16} className="text-gray-500"/>
                      <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent font-bold text-sm outline-none text-blue-900 border-r border-gray-300 pr-2 mr-2">
                         <option value="Monthly">Monthly</option>
                         <option value="Quarterly">Quarterly</option>
                         <option value="Annual">Annual</option>
                      </select>

                      {periodType === 'Monthly' && (
                        <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-transparent font-semibold text-sm outline-none">{MONTHS.map(m => <option key={m}>{m}</option>)}</select>
                      )}
                      {periodType === 'Quarterly' && (
                        <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-transparent font-semibold text-sm outline-none">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>
                      )}

                      <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-transparent font-semibold text-sm outline-none">{[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}</select>
                   </div>
                   
                   {!isConsolidatedView && !isAggregationMode && (
                     <>
                        <StatusBadge status={reportStatus} />
                        {user.role === 'admin' ? (
                          <>
                            <button onClick={() => handleSave('Approved')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 flex items-center gap-1">
                              {loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve
                            </button>
                            <button onClick={() => handleSave('Rejected')} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 flex items-center gap-1">
                              {loading ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject
                            </button>
                          </>
                        ) : (
                          <>
                             <button onClick={() => handleSave('Draft')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-bold hover:bg-gray-300 flex items-center gap-1 disabled:opacity-50">
                               {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Draft
                             </button>
                             <button onClick={() => handleSave('Pending')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
                               {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Submit
                             </button>
                          </>
                        )}
                     </>
                   )}
                   {isAggregationMode && <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Aggregated View</span>}
                </div>
             </div>
             
             <div className="overflow-x-auto shadow-lg rounded-lg bg-white border border-gray-300">
               <table className="w-full border-collapse">
                <thead>
                  <tr className={`${isConsolidatedView ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-700'} uppercase text-xs text-center`}>
                    <th rowSpan={3} className={`py-2 px-3 border border-gray-300 sticky left-0 z-20 min-w-[200px] ${isConsolidatedView ? 'bg-purple-900' : 'bg-gray-200'}`}>{isConsolidatedView ? "Municipality" : (facilityBarangays[activeFacilityName] ? "Barangay / Municipality" : "Municipality")}</th>
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
                    if (key === "Others:") return <tr key="others-separator" className="bg-gray-200 font-bold"><td colSpan={26} className="py-2 px-3 border border-gray-400 text-left sticky left-0 z-10 bg-gray-200">Others (Municipalities)</td></tr>;
                    const row = data[key] || INITIAL_ROW_STATE;
                    const c = getComputations(row);
                    const isMunicipalityRow = MUNICIPALITIES.includes(key);
                    const isHostRow = key === currentHostMunicipality;
                    const isRowReadOnly = isHostRow || isConsolidatedView || isAggregationMode || (user.role !== 'admin' && reportStatus !== 'Draft' && reportStatus !== 'Rejected'); 
                    return (
                      <tr key={key} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 ${isHostRow ? 'bg-blue-100 font-bold' : ''}`}>
                        <td className={`py-1 px-2 border font-medium sticky left-0 z-10 bg-inherit whitespace-nowrap ${isMunicipalityRow ? 'text-blue-800' : 'text-gray-800 pl-4'} ${isHostRow ? 'bg-blue-100' : ''}`}>{key} {isHostRow && "(Total)"}</td>
                        {['male','female'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-blue-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                        <td className="p-1 border text-center font-bold bg-gray-100">{c.sexTotal}</td>
                        {['ageLt15','ageGt15'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-blue-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                        <td className={`p-1 border text-center font-bold bg-gray-100 ${c.sexMismatch?'text-red-500':''}`}>{c.ageTotal}</td>
                        {['cat1','cat2','cat3'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-green-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                        <td className="p-1 border text-center bg-gray-100">{c.cat23}</td>
                        <td className="p-1 border text-center font-bold bg-gray-100">{c.catTotal}</td>
                        {['totalPatients','abCount'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-purple-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                        {['pvrv','pcecv','hrig','erig'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-orange-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                        {['dog','cat','othersCount'].map(f => <td key={f} className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-red-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>)}
                        <td className="p-0 border"><input disabled={isRowReadOnly} type="text" value={row.othersSpec} onChange={e=>handleChange(key, 'othersSpec', e.target.value)} className={`w-full h-full p-1 bg-transparent focus:bg-red-100 outline-none text-[10px] ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>
                        <td className="p-1 border text-center font-bold bg-gray-100">{c.animalTotal}</td>
                        <td className="p-0 border"><input disabled={isRowReadOnly} type="number" min="0" value={row.washed} onChange={e=>handleChange(key, 'washed', e.target.value)} className={`w-full h-full p-1 text-center bg-transparent focus:bg-yellow-100 outline-none no-spinner ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>
                        <td className="p-1 border text-center bg-gray-100 text-[10px]">{c.percent}</td>
                        <td className="p-0 border"><input disabled={isRowReadOnly} type="text" value={row.remarks} onChange={e=>handleChange(key, 'remarks', e.target.value)} className={`w-full h-full p-1 bg-transparent focus:bg-gray-100 outline-none ${isHostRow ? 'cursor-not-allowed text-gray-600' : ''}`} /></td>
                      </tr>
                    );
                  })}
                  {/* Grand Total */}
                  <tr className="bg-gray-800 text-white font-bold text-xs sticky bottom-0 z-20">
                    <td className="py-2 px-2 border border-gray-600 sticky left-0 bg-gray-800">{isConsolidatedView ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}</td>
                    {['male','female'].map(k=><td key={k} className="text-center border border-gray-600">{grandTotals[k]}</td>)}
                    <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.sexTotal}</td>
                    {['ageLt15','ageGt15'].map(k=><td key={k} className="text-center border border-gray-600">{grandTotals[k]}</td>)}
                    <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.ageTotal}</td>
                    {['cat1','cat2','cat3'].map(k=><td key={k} className="text-center border border-gray-600">{grandTotals[k]}</td>)}
                    <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.cat23}</td>
                    <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.catTotal}</td>
                    {['totalPatients','abCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount'].map(k=><td key={k} className="text-center border border-gray-600">{grandTotals[k]}</td>)}
                    <td className="text-center border border-gray-600 bg-gray-700"></td>
                    <td className="text-center border border-gray-600 bg-gray-700">{grandTotals.animalTotal}</td>
                    <td className="text-center border border-gray-600">{grandTotals.washed}</td>
                    <td className="text-center border border-gray-600 bg-gray-700"></td>
                    <td className="text-center border border-gray-600 bg-gray-700"></td>
                  </tr>
                </tbody>
               </table>
             </div>
          </div>
        )}

        {/* User Management Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><UserPlus size={20}/> Create New User</h2><button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button></div>
              <RegisterUserForm facilities={facilities} client={adminHelperClient} />
            </div>
          </div>
        )}

        {/* Add Facility Modal */}
        {showAddFacilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle size={20}/> Add New Facility</h2><button onClick={() => setShowAddFacilityModal(false)} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button></div>
              <AddFacilityForm onAdd={handleAddFacility} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Form for Adding Facility
function AddFacilityForm({ onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Hospital'); // Hospital or RHU
  const [barangays, setBarangays] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), type, barangays);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Facility Name</label>
        <input type="text" required placeholder="e.g. San Juan RHU" className="w-full border p-2 rounded text-sm" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Facility Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="ftype" checked={type === 'Hospital'} onChange={() => setType('Hospital')} /> Hospital/Clinic
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="ftype" checked={type === 'RHU'} onChange={() => setType('RHU')} /> RHU
          </label>
        </div>
      </div>
      {type === 'RHU' && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Catchment Barangays</label>
          <textarea 
            className="w-full border p-2 rounded text-sm h-24" 
            placeholder="Enter barangay names separated by commas (e.g. Pobacion, North, South)"
            value={barangays}
            onChange={e => setBarangays(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">If blank, only 'Others' will be shown.</p>
        </div>
      )}
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">Add Facility</button>
    </form>
  );
}

// Extracted User Register Form (Same as before)
function RegisterUserForm({ facilities, client }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [facilityName, setFacilityName] = useState(facilities[0] || ''); const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState({ type: '', text: '' });

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setMsg({ type: '', text: '' });
    if (!client) { setMsg({ type: 'error', text: 'Admin Client not initialized.' }); setLoading(false); return; }
    try {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { facility_name: facilityName, role: role } } });
      if (error) throw error;
      if (data.user) { 
        setMsg({ type: 'success', text: `User created for ${facilityName}!` }); setEmail(''); setPassword(''); 
        toast.success(`User created for ${facilityName}`);
      }
    } catch (err) { setMsg({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-3">
      {msg.text && <div className={`p-2 rounded mb-4 text-sm ${msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{msg.text}</div>}
      <div><label className="block text-xs font-bold text-gray-700 mb-1">Email</label><input type="email" required className="w-full border p-2 rounded text-sm" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">Password</label><input type="password" required className="w-full border p-2 rounded text-sm" value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">Role</label><select className="w-full border p-2 rounded text-sm" value={role} onChange={e => setRole(e.target.value)}><option value="user">Facility User (Reporter)</option><option value="admin">PHO Admin (Viewer)</option></select></div>
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Assign Facility</label>
        {role === 'admin' ? <input type="text" disabled value="PHO Admin" className="w-full border p-2 rounded text-sm bg-gray-100 text-gray-500" /> : <select className="w-full border p-2 rounded text-sm" value={facilityName} onChange={e => setFacilityName(e.target.value)}>{facilities.map(f => <option key={f} value={f}>{f}</option>)}</select>}
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition font-bold mt-4 flex items-center justify-center gap-2">
        {loading && <Loader2 size={16} className="animate-spin"/>}
        {loading ? 'Creating...' : 'Create Account'}
      </button>
    </form>
  );
}