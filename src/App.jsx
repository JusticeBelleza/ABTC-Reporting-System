import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Save, AlertCircle, FileText, 
  LogOut, CheckCircle, XCircle, Shield, Plus, 
  Building, List, Layers, UserPlus, Filter, Loader2, PlusCircle,
  Trash2, MessageSquare, Bell, User, Edit, UserCog, Phone, Briefcase, 
  Settings, Printer, Image as ImageIcon, FileDown, X, Lock, ArrowLeft,
  Github, AlertTriangle 
} from 'lucide-react';
import {Toaster, toast} from 'sonner';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const adminHelperClient = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false, 
        detectSessionInUrl: false,
        storageKey: 'admin-helper-storage-unique-key' 
      }
    })
  : null;

// --- Constants ---
const DEFAULT_FACILITIES = [
  "Bangued RHU", "Tayum RHU", "Dolores RHU", "Tubo RHU", "Luba RHU", 
  "Manabo RHU", "Lagangilang RHU", "La Paz RHU", "AMDC", "APH"
];

const MUNICIPALITIES = [
  "Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", 
  "Dolores", "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", 
  "Licuan-Baay", "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", 
  "Pilar", "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum", 
  "Tineg", "Tubo", "Villaviciosa", "Non-Abra" 
];

const INITIAL_FACILITY_BARANGAYS = {
  "Bangued RHU": ["Agtangao", "Angad", "Banacao", "Bangbangar", "Cabuloan", "Calaba", "Cosili East (Proper)", "Cosili West (Buaya)", "Dangdangla", "Lingtan", "Lipcan", "Lubong", "Macarcarmay", "Macray", "Malita", "Maoay", "Palao", "Patucannay", "Sagap", "San Antonio", "Santa Rosa", "Sao-atan", "Sappaac", "Tablac (Calot)", "Zone 1 Poblacion (Nalasin)", "Zone 2 Poblacion (Consiliman)", "Zone 3 Poblacion (Lalaud)", "Zone 4 Poblacion (Town Proper)", "Zone 5 Poblacion (Bo. Barikir)", "Zone 6 Poblacion (Sinapangan)", "Zone 7 Poblacion (Baliling)"],
  "Tayum RHU": ["Bagalay", "Basbasa", "Budac", "Bumagcat", "Cabaroan", "Deet", "Gaddani", "Patucannay", "Pias", "Poblacion", "Velasco"],
  "Manabo RHU": ["Ayyeng (Poblacion)", "Catacdegan Nuevo", "Catacdegan Viejo", "Luzong", "San Jose Norte", "San Jose Sur", "San Juan Norte", "San Juan Sur", "San Ramon East", "San Ramon West", "Santo Tomas"],
  "Luba RHU": ["Ampalioc", "Barit", "Gayaman", "Lul-luno", "Luzong", "Nagbukel", "Poblacion", "Sabnangan"],
  "Tubo RHU": ["Alangtin", "Amtuagan", "Dilong", "Kili", "Poblacion", "Mayabo", "Supo", "Tiempo", "Tubtuba", "Wayangan"],
  "Dolores RHU": ["Bayaan", "Cabaroan", "Calumbaya", "Cardona", "Isit", "Kimmalaba", "Libtec", "Lub-lubba", "Mudiit", "Namit-ingang", "Pacac", "Poblacion", "Salucag", "Talogtog", "Taping"],
  "Lagangilang RHU": ["Aguet", "Bacooc", "Balais", "Cayapa", "Dalaguisen", "Laang", "Lagben", "Laguiben", "Nagtupacan", "Paganao", "Pawa", "Poblacion", "Presentar", "San Isidro", "Tagodtod", "Taping", "Villacarta"],
  "La Paz RHU": ["Benben", "Bulbulala", "Buli", "Canan", "Liguis", "Malabbaga", "Mudeng", "Pidipid", "Poblacion", "San Gregorio", "Toon", "Udangan"]
};

// MAIN REPORT INITIAL STATE
const INITIAL_ROW_STATE = { 
  male: '', female: '', ageLt15: '', ageGt15: '', 
  cat1: '', cat2: '', cat3: '', 
  totalPatients: '', abCount: '', hrCount: '', 
  pvrv: '', pcecv: '', hrig: '', erig: '', 
  dog: '', cat: '', othersCount: '', othersSpec: '', 
  washed: '', remarks: '' 
};

// COHORT REPORT INITIAL STATE
const INITIAL_COHORT_ROW = {
  // Category II
  cat2_registered: '', cat2_rig: '', cat2_complete: '', cat2_incomplete: '', cat2_booster: '', cat2_none: '', cat2_died: '', cat2_remarks: '',
  // Category III
  cat3_registered: '', cat3_rig: '', cat3_complete: '', cat3_incomplete: '', cat3_booster: '', cat3_none: '', cat3_died: '', cat3_remarks: ''
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const QUARTERS = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

// --- PDF SAFE STYLES ---
const PDF_STYLES = {
  container: { backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' },
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%', backgroundColor: '#ffffff' },
  logoBox: { width: '150px', display: 'flex', justifyContent: 'center' },
  centerText: { textAlign: 'center', flex: 1, color: '#000000' },
  header: { backgroundColor: '#f4f4f5', color: '#18181b', fontWeight: 'bold', borderBottom: '2px solid #d4d4d8' }, 
  subHeader: { backgroundColor: '#fafafa', color: '#52525b', fontWeight: 'bold' },
  cell: { border: '1px solid #e4e4e7', padding: '6px', textAlign: 'center', fontSize: '10px', color: '#000000', verticalAlign: 'middle' },
  rowEven: { backgroundColor: '#ffffff', color: '#000000' },
  rowOdd: { backgroundColor: '#ffffff', color: '#000000' },
  hostRow: { backgroundColor: '#f4f4f5', fontWeight: 'bold', color: '#000000' },
  border: { borderColor: '#e4e4e7', borderWidth: '1px', borderStyle: 'solid' },
  input: { width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '10px', color: '#000000' },
  inputText: { width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '10px', color: '#000000' },
  textDark: { color: '#000000' },
  textGray: { color: '#52525b' },
  textLightGray: { color: '#a1a1aa' },
  bgGray: { backgroundColor: '#f4f4f5' },
  bgDark: { backgroundColor: '#18181b', color: '#ffffff' }
};

// --- Helper Functions ---
const mapDbToRow = (r) => ({ ...INITIAL_ROW_STATE, ...r, male: r.male ?? '', female: r.female ?? '', ageLt15: r.age_lt_15 ?? '', ageGt15: r.age_gt_15 ?? '', cat1: r.cat_1 ?? '', cat2: r.cat_2 ?? '', cat3: r.cat_3 ?? '', totalPatients: r.total_patients ?? '', abCount: r.ab_count ?? '', hrCount: r.hr_count ?? '', pvrv: r.pvrv ?? '', pcecv: r.pcecv ?? '', hrig: r.hrig ?? '', erig: r.erig ?? '', dog: r.dog ?? '', cat: r.cat ?? '', othersCount: r.others_count ?? '', othersSpec: r.others_spec ?? '', washed: r.washed ?? '', remarks: r.remarks ?? '' });
const mapCohortDbToRow = (r) => {
  const safe = (v) => (v === 0 || v === null) ? '' : v;
  return {
    cat2_registered: safe(r.cat2_registered), cat2_rig: safe(r.cat2_rig), cat2_complete: safe(r.cat2_complete), cat2_incomplete: safe(r.cat2_incomplete), cat2_booster: safe(r.cat2_booster), cat2_none: safe(r.cat2_none), cat2_died: safe(r.cat2_died), cat2_remarks: r.cat2_remarks || '',
    cat3_registered: safe(r.cat3_registered), cat3_rig: safe(r.cat3_rig), cat3_complete: safe(r.cat3_complete), cat3_incomplete: safe(r.cat3_incomplete), cat3_booster: safe(r.cat3_booster), cat3_none: safe(r.cat3_none), cat3_died: safe(r.cat3_died), cat3_remarks: r.cat3_remarks || ''
  };
};

const toInt = (val) => val === '' ? 0 : Number(val);
const mapRowToDb = (r) => ({ male: toInt(r.male), female: toInt(r.female), age_lt_15: toInt(r.ageLt15), age_gt_15: toInt(r.ageGt15), cat_1: toInt(r.cat1), cat_2: toInt(r.cat2), cat_3: toInt(r.cat3), total_patients: toInt(r.totalPatients), ab_count: toInt(r.abCount), hr_count: toInt(r.hrCount), pvrv: toInt(r.pvrv), pcecv: toInt(r.pcecv), hrig: toInt(r.hrig), erig: toInt(r.erig), dog: toInt(r.dog), cat: toInt(r.cat), others_count: toInt(r.others_count), others_spec: r.othersSpec, washed: toInt(r.washed), remarks: r.remarks });
const mapCohortRowToDb = (r) => ({
  cat2_registered: toInt(r.cat2_registered), cat2_rig: toInt(r.cat2_rig), cat2_complete: toInt(r.cat2_complete), cat2_incomplete: toInt(r.cat2_incomplete), cat2_booster: toInt(r.cat2_booster), cat2_none: toInt(r.cat2_none), cat2_died: toInt(r.cat2_died), cat2_remarks: r.cat2_remarks,
  cat3_registered: toInt(r.cat3_registered), cat3_rig: toInt(r.cat3_rig), cat3_complete: toInt(r.cat3_complete), cat3_incomplete: toInt(r.cat3_incomplete), cat3_booster: toInt(r.cat3_booster), cat3_none: toInt(r.cat3_none), cat3_died: toInt(r.cat3_died), cat3_remarks: r.cat3_remarks
});

const getQuarterMonths = (q) => { if (q === "1st Quarter") return ["January", "February", "March"]; if (q === "2nd Quarter") return ["April", "May", "June"]; if (q === "3rd Quarter") return ["July", "August", "September"]; if (q === "4th Quarter") return ["October", "November", "December"]; return []; };

const StatusBadge = ({ status }) => { 
  const styles = { 
    'Draft': 'bg-gray-100 text-gray-600 border border-gray-200', 
    'Pending': 'bg-amber-50 text-amber-700 border border-amber-200', 
    'Approved': 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
    'Rejected': 'bg-rose-50 text-rose-700 border border-rose-200' 
  }; 
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${styles[status] || styles['Draft']}`}>{status || 'Draft'}</span>; 
};

const hasData = (row) => {
  if (!row) return false;
  const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
  return keys.some(k => Number(row[k]) > 0) || (row.remarks && row.remarks.trim() !== '');
};

const hasCohortData = (row, category) => {
  if(!row) return false;
  if (category === 'cat2') {
    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died'];
    return keys.some(k => Number(row[k]) > 0) || (row.cat2_remarks && row.cat2_remarks.trim() !== '');
  } else if (category === 'cat3') {
    const keys = ['cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
    return keys.some(k => Number(row[k]) > 0) || (row.cat3_remarks && row.cat3_remarks.trim() !== '');
  }
  return false;
};

// --- PDF DOWNLOAD HELPER ---
const downloadPDF = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if(!element) { toast.error("Nothing to print!"); return; }

  const style = document.createElement('style');
  // FORCE OVERRIDE ALL COLORS TO HEX FOR PDF TO FIX OKLCH ERROR AND FIX ALIGNMENT
  style.innerHTML = `
    .pdf-hide-empty { display: none !important; }
    .pdf-show-flex { display: flex !important; }
    .no-print { display: none !important; }
    .pdf-visible { display: block !important; } 
    #${elementId}, #${elementId} * {
      background-color: #ffffff !important;
      color: #000000 !important;
      border-color: #e5e7eb !important;
    }
    #${elementId} input {
      color: #000000 !important;
    }
    /* Explicitly set header heights for PDF to avoid cutting off text in merged cells */
    #${elementId} th[rowspan="2"] {
      height: 60px !important; 
      vertical-align: middle !important;
    }
  `;
  document.head.appendChild(style);

  // Temporarily reveal all cohort tables for the PDF snapshot
  const hiddenCohortTables = document.querySelectorAll('.cohort-table-hidden');
  hiddenCohortTables.forEach(el => el.classList.add('pdf-visible'));

  if (!window.html2pdf) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
    script.crossOrigin = "anonymous"; 
    document.head.appendChild(script);
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => { toast.error("Failed to load PDF engine."); reject(); };
    });
  }

  if (window.html2pdf) {
    const pdfHeader = document.getElementById('pdf-header');
    const pdfFooter = document.getElementById('pdf-footer');
    if(pdfHeader) pdfHeader.style.display = 'flex';
    if(pdfFooter) pdfFooter.style.display = 'flex';

    const opt = { 
      margin: 0.2, 
      filename: filename, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true, logging: false }, 
      jsPDF: { unit: 'in', format: [13, 8.5], orientation: 'landscape' } 
    };
    
    try {
      await window.html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("PDF Error: " + err.message);
    } finally {
      if(pdfHeader) pdfHeader.style.display = 'none';
      if(pdfFooter) pdfFooter.style.display = 'none';
      hiddenCohortTables.forEach(el => el.classList.remove('pdf-visible'));
      document.head.removeChild(style);
    }
  }
};

// --- LOGIN COMPONENT ---
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResetMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setResetMessage('Reset link sent.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gray-50 text-zinc-900 mb-4 ring-1 ring-gray-200">
            <Shield size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">ABTC Reporting</h1>
          <p className="text-sm text-gray-500 mt-1">Provincial Health Office</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-xs mb-6 border border-red-100 flex gap-2"><AlertCircle size={14}/> {error}</div>}
        {resetMessage && <div className="bg-green-50 text-green-600 p-3 rounded text-xs mb-6 border border-green-100 flex gap-2"><CheckCircle size={14}/> {resetMessage}</div>}

        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all placeholder:text-gray-300" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all placeholder:text-gray-300" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin"/> : 'Sign In'}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setIsResetMode(true); setError(''); setResetMessage(''); }} className="text-xs text-gray-500 hover:text-zinc-900 transition-colors">Forgot password?</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
             <div className="text-center mb-6">
               <h3 className="font-medium text-zinc-900">Reset Password</h3>
               <p className="text-xs text-gray-500 mt-1">We'll send you a link to reset it.</p>
             </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin"/> : 'Send Link'}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }} className="text-xs text-gray-500 hover:text-zinc-900 flex items-center justify-center gap-1"><ArrowLeft size={12}/> Back to Login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// --- UPDATE PASSWORD FORM ---
function UpdatePasswordForm({ onComplete }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success("Password updated."); onComplete(); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in">
        <div className="flex justify-center mb-6 text-zinc-900"><Lock size={32} strokeWidth={1.5} /></div>
        <h2 className="text-lg font-semibold text-center mb-2 text-zinc-900">Set New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
           <div><label className="block text-xs font-medium text-gray-700 mb-1">New Password</label><input type="password" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none text-sm" minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
           <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition font-medium text-sm flex items-center justify-center gap-2">{loading && <Loader2 size={16} className="animate-spin"/>} Update</button>
        </form>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [facilityBarangays, setFacilityBarangays] = useState(INITIAL_FACILITY_BARANGAYS);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  
  const [globalSettings, setGlobalSettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setShowPasswordUpdate(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if(supabase && session) {
      supabase.from('settings').select('*').single().then(({data}) => { if(data) setGlobalSettings(data); });
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => { if(data) setUserProfile(data); });
    }
  }, [session]);

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

  if (!supabase) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Configuration Missing</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-900" size={20} /></div>;
  if (showPasswordUpdate) return <UpdatePasswordForm onComplete={() => setShowPasswordUpdate(false)} />;
  if (!session) return <Login />;

  return (
    <>
      <Toaster position="bottom-right" theme="light" closeButton />
      <Dashboard 
        user={user} 
        facilities={facilities} 
        setFacilities={setFacilities} 
        facilityBarangays={facilityBarangays} 
        setFacilityBarangays={setFacilityBarangays} 
        onLogout={() => supabase.auth.signOut()} 
        globalSettings={globalSettings}
        setGlobalSettings={setGlobalSettings}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
    </>
  );
}

// --- NOTIFICATION BELL ---
function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapperRef = useRef(null);
  const recipientName = user.role === 'admin' ? 'PHO Admin' : user.name;

  const fetchNotifications = async () => {
    try {
      const dateOffset = (24*60*60*1000) * 30; 
      const myDate = new Date(); myDate.setTime(myDate.getTime() - dateOffset);
      await supabase.from('notifications').delete().lt('created_at', myDate.toISOString());
    } catch(e) {}
    const { data } = await supabase.from('notifications').select('*').eq('recipient', recipientName).order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const sub = supabase.channel('db-notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient=eq.${recipientName}` }, (payload) => {
         setNotifications(prev => [payload.new, ...prev]);
         toast(payload.new.title, { description: payload.new.message });
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [recipientName]);

  const markAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button onClick={() => { if(!isOpen) markAsRead(); setIsOpen(!isOpen); }} className="relative p-2 text-gray-500 hover:text-zinc-900 transition-colors">
        <Bell size={20} strokeWidth={1.5} />
        {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white"><h3 className="font-medium text-sm text-zinc-900">Notifications</h3></div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs">No notifications</div> : notifications.map((n) => (
              <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex justify-between items-start mb-1"><div className="font-medium text-sm text-zinc-900">{n.title}</div><div className="text-[10px] text-gray-400 ml-2">{new Date(n.created_at).toLocaleDateString()}</div></div>
                <div className="text-gray-500 text-xs leading-relaxed">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SETTINGS MODAL ---
function SettingsModal({ onClose, globalSettings, onSaveGlobal, userProfile, onSaveProfile, isAdmin }) {
  const [logoForm, setLogoForm] = useState(globalSettings || { logo_base64: '' });
  const [signatories, setSignatories] = useState(userProfile?.signatories || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'logo' : 'signatories');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => setLogoForm({ ...logoForm, logo_base64: r.result }); r.readAsDataURL(file); }
  };

  const handleFacilityLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => { onSaveProfile({ ...userProfile, facility_logo: r.result }); }; r.readAsDataURL(file); }
  };

  const addSignatory = () => setSignatories([...signatories, { label: '', name: '', title: '' }]);
  const removeSignatory = (index) => setSignatories(signatories.filter((_, i) => i !== index));
  const updateSignatory = (index, field, value) => { const n = [...signatories]; n[index][field] = value; setSignatories(n); };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAdmin && activeTab === 'logo') {
        const { data: existing } = await supabase.from('settings').select('id').single();
        if(existing) await supabase.from('settings').update({ logo_base64: logoForm.logo_base64 }).eq('id', existing.id);
        else await supabase.from('settings').insert({ logo_base64: logoForm.logo_base64 });
        onSaveGlobal(logoForm);
        toast.success("Saved");
      }
      if (activeTab === 'signatories') {
        const { error } = await supabase.from('profiles').update({ signatories: signatories, facility_logo: userProfile.facility_logo }).eq('id', userProfile.id);
        if(error) throw error;
        onSaveProfile({ ...userProfile, signatories });
        toast.success("Saved");
      }
      onClose();
    } catch(err) { toast.error(err.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-100 shadow-xl rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><Settings size={20}/> Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>
        <div className="flex px-6 border-b border-gray-50">
          {isAdmin && <button onClick={() => setActiveTab('logo')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='logo'?'border-zinc-900 text-zinc-900':'border-transparent text-gray-500 hover:text-zinc-700'}`}>System Logo</button>}
          <button onClick={() => setActiveTab('signatories')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='signatories'?'border-zinc-900 text-zinc-900':'border-transparent text-gray-500 hover:text-zinc-700'}`}>Signatories & Logo</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-auto">
          {activeTab === 'logo' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">System Header Logo</label>
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                 {logoForm.logo_base64 ? <img src={logoForm.logo_base64} alt="Logo" className="h-16 w-16 object-contain" /> : <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-300"><ImageIcon size={24}/></div>}
                 <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer" />
              </div>
            </div>
          )}
          {activeTab === 'signatories' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Facility Logo</label>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                  {userProfile?.facility_logo ? <img src={userProfile.facility_logo} alt="Facility Logo" className="h-16 w-16 object-contain" /> : <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-300"><ImageIcon size={24}/></div>}
                  <input type="file" accept="image/*" onChange={handleFacilityLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-medium text-sm text-gray-900">Signatories</h3><button type="button" onClick={addSignatory} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1"><Plus size={12}/> Add</button></div>
                <div className="space-y-3">
                  {signatories.map((sig, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group">
                      <div className="flex-1 space-y-3">
                        <input type="text" placeholder="Label (e.g. Prepared By)" value={sig.label || ''} onChange={e=>updateSignatory(idx, 'label', e.target.value)} className="block w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300"/>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Name" value={sig.name} onChange={e=>updateSignatory(idx, 'name', e.target.value)} className="text-sm border-b border-gray-200 py-1 focus:border-zinc-900 outline-none placeholder:text-gray-300"/>
                          <input type="text" placeholder="Title" value={sig.title} onChange={e=>updateSignatory(idx, 'title', e.target.value)} className="text-sm border-b border-gray-200 py-1 focus:border-zinc-900 outline-none placeholder:text-gray-300"/>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeSignatory(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><X size={16}/></button>
                    </div>
                  ))}
                  {signatories.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No signatories added.</p>}
                </div>
              </div>
            </div>
          )}
          <div className="pt-6 border-t border-gray-50 flex justify-end"><button type="submit" disabled={loading} className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition shadow-sm flex items-center gap-2">{loading && <Loader2 size={16} className="animate-spin"/>} Save Changes</button></div>
        </form>
      </div>
    </div>
  );
}

// --- PROFILE MODAL (EDIT USER) ---
function ProfileModal({ userId, onClose, isSelf = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', designation: '', contact_number: '', email: '', facility_name: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      designation: profile.designation,
      contact_number: profile.contact_number
    }).eq('id', userId);

    if (error) toast.error("Failed");
    else { toast.success("Saved"); onClose(); }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-100 shadow-xl rounded-xl w-full max-w-md animate-in fade-in zoom-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><UserCog size={20}/> {isSelf ? "Edit Profile" : "Edit User"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2 font-medium text-zinc-900"><Building size={14}/> {profile.facility_name || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-2 text-gray-500"><MessageSquare size={14}/> {profile.email}</div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label><input type="text" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={profile.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="e.g. Juan Dela Cruz" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1.5">Designation</label><input type="text" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={profile.designation || ''} onChange={e => setProfile({...profile, designation: e.target.value})} placeholder="e.g. Nurse II" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Number</label><input type="text" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={profile.contact_number || ''} onChange={e => setProfile({...profile, contact_number: e.target.value})} placeholder="e.g. 0917..." /></div>
          <button type="submit" disabled={saving} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition font-medium mt-4 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin"/> : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}

// --- USER MANAGEMENT MODAL (ADMIN) ---
function UserManagementModal({ onClose, facilities, client }) {
  const [activeTab, setActiveTab] = useState('list'); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: userId });
      if (error) throw error;
      toast.success("User deleted");
      fetchUsers();
    } catch(err) { toast.error("Error: " + err.message); }
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {editingUserId && <ProfileModal userId={editingUserId} onClose={() => { setEditingUserId(null); fetchUsers(); }} />}
      
      <div className="bg-white border border-gray-100 shadow-xl rounded-xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><Users size={20}/> User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>

        <div className="flex px-6 border-b border-gray-50">
          <button onClick={() => setActiveTab('list')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='list' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-500 hover:text-zinc-700'}`}>User List</button>
          <button onClick={() => setActiveTab('create')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='create' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-500 hover:text-zinc-700'}`}>Create New User</button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'list' ? (
            loading ? <div className="text-center p-10"><Loader2 className="animate-spin inline mr-2" size={16}/> Loading...</div> : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                  <tr><th className="p-3 rounded-l-lg">Facility / Role</th><th className="p-3">Name & Contact</th><th className="p-3">Email</th><th className="p-3 rounded-r-lg text-right"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-zinc-900">{u.facility_name}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wide text-gray-400 mt-0.5">{u.role}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900">{u.full_name || '-'}</div>
                        <div className="text-xs text-gray-500">{u.contact_number}</div>
                        <div className="text-xs text-gray-400 italic">{u.designation}</div>
                      </td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button onClick={() => setEditingUserId(u.id)} className="text-zinc-600 hover:text-zinc-900 p-1.5 hover:bg-gray-100 rounded mr-1 transition"><Edit size={16}/></button>
                        {u.role !== 'admin' && <button onClick={() => handleDelete(u.id, u.facility_name)} className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition"><Trash2 size={16}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="max-w-lg mx-auto mt-4">
              <RegisterUserForm facilities={facilities} client={client} onSuccess={() => { setActiveTab('list'); fetchUsers(); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, facilities, setFacilities, facilityBarangays, setFacilityBarangays, onLogout, globalSettings, setGlobalSettings, userProfile, setUserProfile }) {
  const currentDate = new Date();
  const currentRealYear = currentDate.getFullYear();
  const currentRealMonth = currentDate.getMonth();
  const availableYears = useMemo(() => { const years = []; for (let y = 2024; y <= currentRealYear; y++) years.push(y); return years; }, [currentRealYear]);
  
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'cohort'
  const [cohortSubTab, setCohortSubTab] = useState('cat2'); // 'cat2' or 'cat3'
  const [year, setYear] = useState(currentRealYear);
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[currentRealMonth]);
  const [quarter, setQuarter] = useState("1st Quarter");
  const availableMonths = useMemo(() => (year === currentRealYear ? MONTHS.slice(0, currentRealMonth + 1) : MONTHS), [year, currentRealYear, currentRealMonth]);

  const [data, setData] = useState({});
  const [cohortData, setCohortData] = useState({});
  const [reportStatus, setReportStatus] = useState('Draft');
  const [loading, setLoading] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityStatuses, setFacilityStatuses] = useState({});
  
  // Row visibility states
  const [visibleOtherMunicipalities, setVisibleOtherMunicipalities] = useState([]);
  const [visibleCat2, setVisibleCat2] = useState([]);
  const [visibleCat3, setVisibleCat3] = useState([]);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, rowKey: null });
  
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  const fetchFacilitiesList = async () => {
    try {
      const { data } = await supabase.from('facilities').select('*');
      let combinedFacilities = [...DEFAULT_FACILITIES];
      let combinedBarangays = { ...INITIAL_FACILITY_BARANGAYS };
      if (data && data.length > 0) {
        const dbNames = data.map(f => f.name);
        const dbBarangays = {};
        data.forEach(f => { if (f.barangays?.length > 0) dbBarangays[f.name] = f.barangays; });
        combinedFacilities = [...new Set([...combinedFacilities, ...dbNames])];
        combinedBarangays = { ...combinedBarangays, ...dbBarangays };
      }
      setFacilities(combinedFacilities);
      setFacilityBarangays(combinedBarangays);
    } catch (err) {}
  };
  useEffect(() => { fetchFacilitiesList(); }, []);

  const handleAddFacility = async (name, type, barangaysList) => {
    if (facilities.includes(name)) { toast.error('Name exists'); return; }
    try {
      let bArray = type === 'RHU' && barangaysList ? barangaysList.split(',').map(b => b.trim()).filter(b => b) : null;
      const { error } = await supabase.from('facilities').insert({ name, type, barangays: bArray });
      if (error) throw error;
      setFacilities(prev => [...prev, name]);
      if (bArray) setFacilityBarangays(prev => ({ ...prev, [name]: bArray }));
      toast.success("Facility added");
      setShowAddFacilityModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteFacility = async (facilityName) => {
    const confirmation = window.prompt(`Type "delete" to confirm:`);
    if (confirmation === "delete") {
      try {
        const { error } = await supabase.from('facilities').delete().eq('name', facilityName);
        if (error) throw error;
        setFacilities(prev => prev.filter(f => f !== facilityName));
        setFacilityBarangays(prev => { const next = { ...prev }; delete next[facilityName]; return next; });
        toast.success("Deleted");
      } catch (err) { toast.error(err.message); }
    }
  };

  const handleDeleteRow = (key) => {
    setDeleteConfirmation({ isOpen: true, rowKey: key });
  };

  const confirmDeleteRow = () => {
    const key = deleteConfirmation.rowKey;
    if (key) {
      if (activeTab === 'main') {
        setData(prev => ({...prev, [key]: {...INITIAL_ROW_STATE}}));
        setVisibleOtherMunicipalities(prev => prev.filter(m => m !== key));
      } else {
        setCohortData(prev => {
            const currentRow = prev[key] || { ...INITIAL_COHORT_ROW };
            let updatedRow = { ...currentRow };
            
            // Explicit separation: Clear only the current category's fields and update only current visibility
            if (cohortSubTab === 'cat2') {
                updatedRow = {
                    ...updatedRow,
                    cat2_registered: '', cat2_rig: '', cat2_complete: '', cat2_incomplete: '', cat2_booster: '', cat2_none: '', cat2_died: '', cat2_remarks: ''
                };
                setVisibleCat2(prevVis => prevVis.filter(m => m !== key));
            } else {
                updatedRow = {
                    ...updatedRow,
                    cat3_registered: '', cat3_rig: '', cat3_complete: '', cat3_incomplete: '', cat3_booster: '', cat3_none: '', cat3_died: '', cat3_remarks: ''
                };
                setVisibleCat3(prevVis => prevVis.filter(m => m !== key));
            }
            return { ...prev, [key]: updatedRow };
        });
      }
      toast.success(`Row for ${key} removed`);
    }
    setDeleteConfirmation({ isOpen: false, rowKey: null });
  };

  const createDbNotification = async (recipient, title, message, type='info') => {
    try { await supabase.from('notifications').insert({ recipient, title, message, type }); } catch(err) { console.error(err); }
  };

  // Helper to get visible rows based on context
  const getRowKeysForFacility = (facilityName, consolidated = false, returnAll = false, forCohort = false, specificVisible = null) => {
    if (!facilityName) return []; 
    if (consolidated) return MUNICIPALITIES;
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) return MUNICIPALITIES;
    
    const barangays = facilityBarangays[facilityName] || [];
    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));
    
    if (barangays.length > 0 && hostMunicipality) {
      const other = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      if (returnAll) return [hostMunicipality, ...barangays, "Others:", ...other];
      
      // Select correct visibility array
      let visible = [];
      if (specificVisible) {
          visible = specificVisible;
      } else if (!forCohort) {
          visible = visibleOtherMunicipalities;
      }
      // If forCohort is true but specificVisible is null, it means we are initializing or missing context, default to empty to be safe
      
      const visibleOther = other.filter(m => visible.includes(m));
      
      return [hostMunicipality, ...barangays, "Others:", ...visibleOther];
    }
    return barangays.length > 0 ? [...barangays, "Others:", ...MUNICIPALITIES] : MUNICIPALITIES;
  };

  const activeFacilityName = user.role === 'admin' ? (isConsolidatedView ? 'PHO Consolidated' : selectedFacility) : user.name;
  
  const currentRows = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, false, visibleOtherMunicipalities), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode, visibleOtherMunicipalities]);
  
  // Independent memoized rows for Cat 2 and Cat 3
  const cohortRowsCat2 = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, true, visibleCat2), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode, visibleCat2]);
  const cohortRowsCat3 = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, true, visibleCat3), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode, visibleCat3]);
  
  const currentHostMunicipality = useMemo(() => (!activeFacilityName || isConsolidatedView || activeFacilityName==="AMDC" || activeFacilityName==="APH") ? null : MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null, [activeFacilityName, isConsolidatedView]);
  
  const initData = (rowKeys, isCohort=false) => { 
    const d = {}; 
    rowKeys.forEach(k => { 
      if (k !== "Others:") d[k] = isCohort ? { ...INITIAL_COHORT_ROW } : { ...INITIAL_ROW_STATE }; 
    }); 
    return d; 
  };

  useEffect(() => {
    if (user.role === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      else if (adminViewMode === 'consolidated' || (adminViewMode === 'review' && selectedFacility)) fetchData();
    } else fetchData();
  }, [user, year, month, quarter, periodType, adminViewMode, selectedFacility, activeTab]);

  const fetchFacilityStatuses = async () => {
    if (periodType !== 'Monthly') return; 
    setLoading(true);
    const { data } = await supabase.from('abtc_reports').select('facility, status').eq('year', year).eq('month', month);
    const statuses = {}; facilities.forEach(f => statuses[f] = 'Draft');
    if (data) data.forEach(r => statuses[r.facility] = r.status);
    setFacilityStatuses(statuses);
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    const target = user.role === 'admin' ? (isConsolidatedView ? null : selectedFacility) : user.name;
    const fullRowKeys = getRowKeysForFacility(target || 'PHO Consolidated', isConsolidatedView, true, false);
    
    // --- MAIN REPORT FETCH ---
    if (activeTab === 'main') {
        const newData = initData(fullRowKeys, false);
        let query = supabase.from('abtc_reports').select('*').eq('year', year);
        if (periodType === 'Monthly') query = query.eq('month', month);
        else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter));
        if (isConsolidatedView) query = query.eq('status', 'Approved'); else if (target) query = query.eq('facility', target);
        
        const { data: records } = await query;
        const newVisibleOthers = new Set();

        if (records && records.length > 0) {
          records.forEach(record => {
            const m = record.municipality;
            if (newData[m]) {
               const r = mapDbToRow(record);
               const c = newData[m];
               const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
               keys.forEach(k => { c[k] = (toInt(c[k]) + toInt(r[k])) || ''; if(c[k] === 0) c[k] = ''; });

               const isBarangay = facilityBarangays[target]?.includes(m);
               const host = MUNICIPALITIES.find(mun => target?.includes(mun));
               const isMainKey = m === host;
               if (!isBarangay && !isMainKey && hasData(r)) { newVisibleOthers.add(m); }
            }
          });
          setData(newData);
          if (periodType === 'Monthly' && !isConsolidatedView) setReportStatus(records[0].status || 'Draft');
          else setReportStatus(isConsolidatedView ? 'View Only' : 'Draft');
        } else { setData(newData); setReportStatus('Draft'); }
        setVisibleOtherMunicipalities(Array.from(newVisibleOthers));
    }
    
    // --- COHORT FETCH ---
    if (activeTab === 'cohort') {
        const newCohort = initData(fullRowKeys, true);
        let query = supabase.from('abtc_cohort_reports').select('*').eq('year', year);
        if (periodType === 'Monthly') query = query.eq('month', month);
        else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter)); 
        
        if (isConsolidatedView) query = query.eq('status', 'Approved'); else if (target) query = query.eq('facility', target);

        const { data: records } = await query;
        const newVisibleCat2 = new Set();
        const newVisibleCat3 = new Set();

        if (records && records.length > 0) {
            records.forEach(record => {
                const m = record.municipality;
                if(newCohort[m]) {
                    const r = mapCohortDbToRow(record);
                    const c = newCohort[m];
                    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died',
                                  'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                    keys.forEach(k => { c[k] = (toInt(c[k]) + toInt(r[k])) || ''; if(c[k] === 0) c[k] = ''; });
                    c.cat2_remarks = r.cat2_remarks || '';
                    c.cat3_remarks = r.cat3_remarks || '';

                    const isBarangay = facilityBarangays[target]?.includes(m);
                    const host = MUNICIPALITIES.find(mun => target?.includes(mun));
                    const isMainKey = m === host;
                    
                    if (!isBarangay && !isMainKey) {
                        if (hasCohortData(r, 'cat2')) newVisibleCat2.add(m);
                        if (hasCohortData(r, 'cat3')) newVisibleCat3.add(m);
                    }
                }
            });
            setCohortData(newCohort);
            if (periodType === 'Monthly' && !isConsolidatedView) setReportStatus(records[0].status || 'Draft');
            else setReportStatus(isConsolidatedView ? 'View Only' : 'Draft');
        } else { 
            setCohortData(newCohort); 
            setReportStatus('Draft');
        }
        setVisibleCat2(Array.from(newVisibleCat2));
        setVisibleCat3(Array.from(newVisibleCat3));
    }

    setLoading(false);
  };

  const confirmRejection = async () => { if (!rejectionReason.trim()) { toast.error("Reason required"); return; } setShowRejectModal(false); await handleSave('Rejected', rejectionReason); };
  
  const handleSave = async (newStatus, reason = null) => {
    if (periodType !== 'Monthly' && activeTab === 'main') { toast.error("Monthly only for Main Report"); return; }
    
    if (newStatus === 'Rejected' && reason === null && user.role === 'admin') { setRejectionReason(''); setShowRejectModal(true); return; }
    const target = user.role === 'admin' ? selectedFacility : user.name;
    setLoading(true);
    
    const targetKey = currentHostMunicipality || MUNICIPALITIES[0]; // fallback

    try {
        if (activeTab === 'main') {
            const payload = Object.entries(data).map(([m, row]) => {
                if (!hasData(row) && !getRowKeysForFacility(target, false, false, false, visibleOtherMunicipalities).includes(m)) return null;
                let rem = row.remarks;
                if (newStatus === 'Rejected' && reason && m === targetKey) rem = `REJECTED: ${reason}`;
                return { ...mapRowToDb(row), year, month, municipality: m, facility: target, status: newStatus, remarks: rem };
            }).filter(x => x !== null);

            await supabase.from('abtc_reports').delete().eq('year', year).eq('month', month).eq('facility', target);
            if(payload.length > 0) await supabase.from('abtc_reports').insert(payload);
            setReportStatus(newStatus);
        } else {
            // Cohort Save
            // Check both categories for visible rows to determine what to save
            const payload = Object.entries(cohortData).map(([m, row]) => {
                // If it has no data AND isn't in any visible list, skip it
                if (!hasCohortData(row, 'cat2') && !hasCohortData(row, 'cat3') && 
                    !getRowKeysForFacility(target, false, false, true, visibleCat2).includes(m) && 
                    !getRowKeysForFacility(target, false, false, true, visibleCat3).includes(m)) return null;
                
                return { ...mapCohortRowToDb(row), year, month: periodType === 'Monthly' ? month : quarter, municipality: m, facility: target, status: newStatus };
            }).filter(x => x !== null);

            await supabase.from('abtc_cohort_reports').delete().eq('year', year).eq('month', periodType === 'Monthly' ? month : quarter).eq('facility', target);
            if(payload.length > 0) await supabase.from('abtc_cohort_reports').insert(payload);
            setReportStatus(newStatus);
        }

        if (newStatus === 'Pending') { await createDbNotification('PHO Admin', 'New Submission', `${target} report.`, 'info'); toast.success('Submitted'); }
        else if (newStatus === 'Approved') { await createDbNotification(target, 'Approved', `Report approved.`, 'success'); toast.success('Approved'); }
        else if (newStatus === 'Rejected') { await createDbNotification(target, 'Rejected', `Report rejected.`, 'error'); toast.success('Rejected'); }
        else toast.success('Saved');
        
        if (user.role === 'admin' && (newStatus === 'Approved' || newStatus === 'Rejected')) { setAdminViewMode('dashboard'); setSelectedFacility(null); fetchFacilityStatuses(); }

    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const handleChange = (m, f, v) => {
    if (activeTab === 'main') {
        if (periodType !== 'Monthly' || user.role === 'admin' || (reportStatus !== 'Draft' && reportStatus !== 'Rejected') || m === currentHostMunicipality || (f !== 'othersSpec' && f !== 'remarks' && v !== '' && Number(v) < 0)) return;
        setData(prev => {
            const n = { ...prev }; n[m] = { ...n[m], [f]: v };
            if (currentHostMunicipality && facilityBarangays[activeFacilityName]?.includes(m)) {
                const tot = { ...INITIAL_ROW_STATE };
                const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
                facilityBarangays[activeFacilityName].forEach(b => { const r = n[b] || INITIAL_ROW_STATE; keys.forEach(k => tot[k] = toInt(tot[k]) + toInt(r[k])); });
                keys.forEach(k => { if(tot[k] === 0) tot[k] = ''; });
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot, remarks: 'Auto-computed' };
            }
            return n;
        });
    } else {
        // Cohort Change
        if (user.role === 'admin' || m === currentHostMunicipality) return;
        setCohortData(prev => {
            const n = { ...prev }; n[m] = { ...n[m], [f]: v };
            // Auto compute host municipality total
            if (currentHostMunicipality && facilityBarangays[activeFacilityName]?.includes(m)) {
                const tot = { ...INITIAL_COHORT_ROW };
                const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                facilityBarangays[activeFacilityName].forEach(b => { const r = n[b] || INITIAL_COHORT_ROW; keys.forEach(k => tot[k] = toInt(tot[k]) + toInt(r[k])); });
                keys.forEach(k => { if(tot[k] === 0) tot[k] = ''; });
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot };
            }
            return n;
        });
    }
  };

  const getComputations = (row) => {
    if (!row) return INITIAL_ROW_STATE;
    const sexTotal = toInt(row.male) + toInt(row.female);
    const ageTotal = toInt(row.ageLt15) + toInt(row.ageGt15);
    const cat23 = toInt(row.cat2) + toInt(row.cat3);
    const catTotal = toInt(row.cat1) + cat23;
    const animalTotal = toInt(row.dog) + toInt(row.cat) + toInt(row.othersCount);
    const percent = animalTotal > 0 ? (toInt(row.washed) / animalTotal * 100).toFixed(0) + '%' : '0%';
    return { sexTotal, ageTotal, cat23, catTotal, animalTotal, percent, sexMismatch: sexTotal !== ageTotal };
  };

  const grandTotals = useMemo(() => {
    const t = { ...INITIAL_ROW_STATE, sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0 };
    const numericKeys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
    numericKeys.forEach(k => t[k] = 0);
    Object.entries(data).forEach(([key, row]) => {
      if (MUNICIPALITIES.includes(key)) {
        const c = getComputations(row);
        numericKeys.forEach(k => t[k] += toInt(row[k]));
        t.sexTotal += c.sexTotal; t.ageTotal += c.ageTotal; t.cat23 += c.cat23; t.catTotal += c.catTotal; t.animalTotal += c.animalTotal;
      }
    });
    t.percent = t.animalTotal > 0 ? (t.washed / t.animalTotal * 100).toFixed(0) + '%' : '0%';
    return t;
  }, [data]);

  const cohortTotals = useMemo(() => {
    const t = { ...INITIAL_COHORT_ROW };
    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died',
                  'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
    keys.forEach(k => t[k] = 0);
    Object.entries(cohortData).forEach(([key, row]) => {
        if(MUNICIPALITIES.includes(key)) {
            keys.forEach(k => t[k] += toInt(row[k]));
        }
    });
    return t;
  }, [cohortData]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-zinc-900">
      {/* --- Minimalist Header --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-zinc-900 text-white p-1.5 rounded-lg"><Shield size={18} strokeWidth={2}/></div>
             <span className="font-semibold tracking-tight text-lg">ABTC Reporting</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell user={user} />
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition" onClick={() => setShowProfileModal(true)}>
              <div className="text-right">
                <div className="text-sm font-medium leading-none">{userProfile?.full_name || user.fullName || user.name}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">{user.role}</div>
              </div>
              <div className="bg-gray-100 p-2 rounded-full text-gray-600"><User size={16}/></div>
            </div>
            <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-zinc-900 p-2 transition"><Settings size={20} strokeWidth={1.5} /></button>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-600 p-2 transition ml-2"><LogOut size={20} strokeWidth={1.5} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8" id="report-content">
        {user.role === 'admin' && adminViewMode === 'dashboard' && (
          <div className="max-w-6xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
                  <p className="text-gray-500 text-sm mt-1">Overview of facility submissions and statuses</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddFacilityModal(true)} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition"><Plus size={16} /> Add Facility</button>
                  <button onClick={() => setShowManageUsers(true)} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition"><Users size={16} /> Users</button>
                  <button onClick={() => setAdminViewMode('consolidated')} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 transition"><Layers size={16} /> Consolidated</button>
                </div>
             </div>
             
             <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 inline-flex items-center gap-2">
                <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-900 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                <div className="w-px h-4 bg-gray-200"></div>
                {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                <button onClick={fetchFacilityStatuses} className="ml-2 p-2 text-gray-400 hover:text-zinc-900 transition"><ArrowLeft size={14} className="rotate-180"/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {facilities.map(f => (
                 <div key={f} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => { setSelectedFacility(f); setAdminViewMode('review'); }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors"><Building size={20}/></div>
                      <StatusBadge status={facilityStatuses[f]} />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-1">{f}</h3>
                    <p className="text-xs text-gray-500 mb-4">Report for {periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                       <span className="text-xs font-medium text-blue-600 group-hover:underline">View Report</span>
                       {user.role === 'admin' && <button onClick={(e) => { e.stopPropagation(); handleDeleteFacility(f); }} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={14} /></button>}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {(user.role !== 'admin' || (user.role === 'admin' && (adminViewMode === 'review' || adminViewMode === 'consolidated'))) && (
          <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in duration-300">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
                <div className="flex items-center gap-4">
                  {user.role === 'admin' && <button onClick={() => { setAdminViewMode('dashboard'); setSelectedFacility(null); }} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"><ArrowLeft size={18}/></button>}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                      {isConsolidatedView ? 'Consolidated Report' : `${activeFacilityName}`}
                      {!isConsolidatedView && !isAggregationMode && <StatusBadge status={reportStatus} />}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{periodType}</span> &bull; <span>{periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                   {/* TAB SWITCHER */}
                   <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm mr-4">
                      <button onClick={() => setActiveTab('main')} className={`px-4 py-1.5 text-sm font-medium rounded transition ${activeTab==='main'?'bg-zinc-900 text-white shadow':'text-gray-600 hover:bg-gray-50'}`}>ABTC Reporting</button>
                      <button onClick={() => setActiveTab('cohort')} className={`px-4 py-1.5 text-sm font-medium rounded transition ${activeTab==='cohort'?'bg-zinc-900 text-white shadow':'text-gray-600 hover:bg-gray-50'}`}>Cohort</button>
                   </div>

                   {/* Filters */}
                   <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center shadow-sm">
                      <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-900 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                      <div className="w-px h-4 bg-gray-200"></div>
                      {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                      {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                      <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                   </div>

                   <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

                   {/* Actions */}
                   <button onClick={() => downloadPDF('report-content', `Report_${activeFacilityName}_${year}.pdf`)} className="bg-white border border-gray-200 text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition"><FileDown size={16}/> PDF</button>
                   
                   {!isConsolidatedView && !isAggregationMode && (
                     <>
                        {user.role === 'admin' ? (
                          <>
                            <button onClick={() => handleSave('Approved')} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve</button>
                            <button onClick={() => handleSave('Rejected')} className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 shadow-sm flex items-center gap-2 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleSave('Draft')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save</button>
                            <button onClick={() => handleSave('Pending')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : 'Submit'}</button>
                          </>
                        )}
                     </>
                   )}
                </div>
             </div>
             
             {/* PRINT HEADER */}
             <div className="hidden print:flex mb-6 items-center justify-between gap-6 pt-4 px-8" style={{ ...PDF_STYLES.headerContainer, display: 'none' }} id="pdf-header">
                <div style={PDF_STYLES.logoBox}>{globalSettings?.logo_base64 && <img src={globalSettings.logo_base64} alt="Logo" style={{height:'60px', width:'auto', objectFit:'contain'}} />}</div>
                <div style={PDF_STYLES.centerText}>
                   <h1 style={{fontSize:'12px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px', color:'#000'}}>National Rabies Prevention and Control Program</h1>
                   <h2 style={{fontSize:'14px', fontWeight:'bold', textTransform:'uppercase', margin:'4px 0', color:'#000'}}>
                     {activeTab === 'main' ? 'National Rabies and Bite Victims Report' : 'Consolidated Cohort Report'}
                   </h2>
                   <p style={{fontSize:'11px', fontWeight:'bold', color:'#000'}}>{periodType === 'Monthly' ? `${month} ${year}` : (periodType === 'Quarterly' ? `${quarter} ${year}` : `Annual ${year}`)}</p>
                </div>
                <div style={PDF_STYLES.logoBox}>{userProfile?.facility_logo && <img src={userProfile.facility_logo} alt="Facility Logo" style={{height:'60px', width:'auto', objectFit:'contain'}} />}</div>
             </div>

             <div className="overflow-x-auto shadow-sm rounded-xl bg-white border border-gray-200 print:shadow-none print:border-none" style={{...PDF_STYLES.container, ...PDF_STYLES.border}}>
               
               {activeTab === 'main' ? (
               <table className="w-full border-collapse" style={{ borderColor: PDF_STYLES.border.borderColor }}>
                <thead>
                  <tr style={isConsolidatedView ? PDF_STYLES.header : PDF_STYLES.subHeader}>
                    <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, textAlign:'left', fontWeight:'bold', width: '200px', minWidth: '200px'}}>{isConsolidatedView ? "Municipality" : (facilityBarangays[activeFacilityName] ? "Barangay / Municipality" : "Municipality")}</th>
                    <th colSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Human Cases (Sex)</th>
                    <th colSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Human Cases (Age)</th>
                    <th colSpan={5} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Category</th>
                    <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Status</th>
                    <th colSpan={4} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>PEP</th>
                    <th colSpan={5} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Biting Animals</th>
                    <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Washing</th>
                    <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500', width: '150px', minWidth: '150px'}}>Remarks</th>
                  </tr>
                  <tr style={PDF_STYLES.subHeader}>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>M</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>F</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>&lt;15</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>&gt;15</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>I</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>II</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>III</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>II+III</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Tot</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>AB</th>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>PVRV</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>PCECV</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>HRIG</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>ERIG</th>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Dog</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Cat</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Oth</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Spec</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
                    <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>No.</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((key, idx) => {
                    const isEmpty = !hasData(data[key]);
                    const hideClass = isEmpty ? 'pdf-hide-empty' : '';

                    if (key === "Others:") {
                      const host = currentHostMunicipality;
                      const availableOptions = MUNICIPALITIES.filter(m => m !== host && !visibleOtherMunicipalities.includes(m)).sort();
                      const showAddControls = user.role !== 'admin' && !isConsolidatedView && !isAggregationMode && (reportStatus === 'Draft' || reportStatus === 'Rejected');
                      return (
                        <tr key="others-separator" className={hideClass} style={{ ...PDF_STYLES.rowEven, ...PDF_STYLES.bgGray }}>
                          <td colSpan={26} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', ...PDF_STYLES.bgGray, padding:'8px'}}>
                             <div className="flex justify-between items-center">
                               <span className="font-bold text-gray-500">Other Municipalities</span>
                               {showAddControls && (
                                 <div className="flex items-center gap-2 no-print">
                                   <select id="other-mun-select" className="bg-white border border-gray-300 text-xs rounded p-1 outline-none">
                                      <option value="">Select Municipality...</option>
                                      {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                   </select>
                                   <button type="button" onClick={() => { const select = document.getElementById('other-mun-select'); const val = select.value; if(val) { setVisibleOtherMunicipalities(prev => [...prev, val]); select.value = ""; } }} className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-zinc-800 transition">+ Add Row</button>
                                 </div>
                               )}
                             </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    const row = data[key] || INITIAL_ROW_STATE;
                    const c = getComputations(row);
                    const isRowReadOnly = user.role === 'admin' || key === currentHostMunicipality || isConsolidatedView || isAggregationMode || (reportStatus !== 'Draft' && reportStatus !== 'Rejected'); 
                    const rowStyle = key === currentHostMunicipality ? PDF_STYLES.hostRow : PDF_STYLES.rowEven;
                    const isOtherRow = visibleOtherMunicipalities.includes(key);

                    return (
                      <tr key={key} className={hideClass} style={rowStyle}>
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...rowStyle, textAlign:'left', whiteSpace:'nowrap', color: MUNICIPALITIES.includes(key) ? '#111827' : '#4b5563', paddingLeft: MUNICIPALITIES.includes(key) ? '0.75rem' : '1.5rem', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal'}}>
                          <div className="flex justify-between items-center group/row">
                             <span>{key} {key === currentHostMunicipality && <span style={{fontSize:'10px', color:'#9ca3af', fontWeight:'normal'}}>(Total)</span>}</span>
                             {isOtherRow && !isRowReadOnly && (
                               <button 
                                  onClick={() => handleDeleteRow(key)} 
                                  className="text-gray-400 hover:text-red-600 transition px-2 no-print" 
                                  title="Remove row"
                               >
                                 <XCircle size={14} />
                               </button>
                             )}
                          </div>
                        </td>
                        {['male','female'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.sexTotal}</td>
                        {['ageLt15','ageGt15'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold', color: c.sexMismatch ? '#ef4444' : 'inherit'}}>{c.ageTotal}</td>
                        {['cat1','cat2','cat3'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, color:'#6b7280'}}>{c.cat23}</td>
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.catTotal}</td>
                        {['totalPatients','abCount'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        {['pvrv','pcecv','hrig','erig'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        {['dog','cat','othersCount'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row.othersSpec} onChange={e=>handleChange(key, 'othersSpec', e.target.value)} style={PDF_STYLES.inputText} /></td>
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.animalTotal}</td>
                        <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row.washed} onChange={e=>handleChange(key, 'washed', e.target.value)} style={PDF_STYLES.input} /></td>
                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontSize:'10px', color:'#6b7280'}}>{c.percent}</td>
                        <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row.remarks} onChange={e=>handleChange(key, 'remarks', e.target.value)} style={{...PDF_STYLES.inputText, paddingLeft:'4px'}} /></td>
                      </tr>
                    );
                  })}
                  {/* Grand Total */}
                  <tr style={{ ...PDF_STYLES.bgDark, fontWeight:'bold', fontSize:'11px' }}>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46', textAlign:'left', paddingLeft:'0.75rem'}}>{isConsolidatedView ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}</td>
                    {['male','female'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.sexTotal}</td>
                    {['ageLt15','ageGt15'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.ageTotal}</td>
                    {['cat1','cat2','cat3'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.cat23}</td>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.catTotal}</td>
                    {['totalPatients','abCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}></td>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.animalTotal}</td>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals.washed}</td>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.percent}</td>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}></td>
                  </tr>
                </tbody>
               </table>
               ) : (
               // --- COHORT TABLE ---
               <div className="p-4">
                 {/* Cohort Category Switcher */}
                 <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2 no-print">
                    <button onClick={() => setCohortSubTab('cat2')} className={`text-sm font-semibold pb-1 border-b-2 transition ${cohortSubTab==='cat2' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Category II</button>
                    <button onClick={() => setCohortSubTab('cat3')} className={`text-sm font-semibold pb-1 border-b-2 transition ${cohortSubTab==='cat3' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Category III</button>
                 </div>

                 {/* Category II Table */}
                 <div className={`cohort-table-hidden ${cohortSubTab === 'cat2' ? 'block' : 'hidden'}`}>
                     <div className="bg-gray-50/50 p-2 font-bold text-center border border-gray-100 rounded-t-lg text-sm text-gray-600 mb-1">CATEGORY II - EXPOSURES</div>
                     <table className="w-full border-collapse mb-8" style={{ borderColor: PDF_STYLES.border.borderColor }}>
                        <thead>
                            <tr style={PDF_STYLES.subHeader}>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, textAlign:'left', verticalAlign:'middle', width: '200px', minWidth: '200px'}}>Municipality</th>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle', width: '80px', minWidth: '80px'}}>Registered Exposures</th>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle', width: '80px', minWidth: '80px'}}>Patients w/ RIG</th>
                                <th colSpan={5} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle'}}>Outcome of PEP</th>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle', width:'150px', minWidth: '150px'}}>Remarks</th>
                            </tr>
                            <tr style={PDF_STYLES.subHeader}>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Complete</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Incomplete</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Booster</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>None</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Died</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cohortRowsCat2.map((key, idx) => {
                                const isEmpty = !hasCohortData(cohortData[key], 'cat2');
                                const hideClass = isEmpty ? 'pdf-hide-empty' : '';
                                const row = cohortData[key] || INITIAL_COHORT_ROW;
                                const isRowReadOnly = user.role === 'admin' || key === currentHostMunicipality;
                                const isOtherRow = visibleCat2.includes(key);

                                if (key === "Others:") {
                                    const host = currentHostMunicipality;
                                    const availableOptions = MUNICIPALITIES.filter(m => m !== host && !visibleCat2.includes(m)).sort();
                                    const showAddControls = user.role !== 'admin' && !isConsolidatedView;
                                    return (
                                        <tr key="cohort-others-sep" className={hideClass} style={{ ...PDF_STYLES.rowEven, ...PDF_STYLES.bgGray }}>
                                            <td colSpan={9} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', ...PDF_STYLES.bgGray, padding:'8px'}}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-gray-500">Other Municipalities</span>
                                                    {showAddControls && (
                                                        <div className="flex items-center gap-2 no-print">
                                                            <select id="cohort-other-select-2" className="bg-white border border-gray-300 text-xs rounded p-1 outline-none">
                                                                <option value="">Select...</option>
                                                                {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                            <button type="button" onClick={() => { const select = document.getElementById('cohort-other-select-2'); const val = select.value; if(val) { setVisibleCat2(prev => [...prev, val]); select.value = ""; } }} className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-zinc-800 transition">+ Add Row</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={key} className={hideClass} style={PDF_STYLES.rowEven}>
                                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal'}}>
                                            <div className="flex justify-between items-center group/row">
                                                <span>{key}</span>
                                                {isOtherRow && !isRowReadOnly && (
                                                    <button onClick={() => handleDeleteRow(key)} className="text-gray-400 hover:text-red-600 transition px-2 no-print"><XCircle size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                        {['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died'].map(f => (
                                            <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e => handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>
                                        ))}
                                        <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row.cat2_remarks} onChange={e => handleChange(key, 'cat2_remarks', e.target.value)} style={PDF_STYLES.inputText} /></td>
                                    </tr>
                                );
                            })}
                            <tr style={{ ...PDF_STYLES.bgDark, fontWeight:'bold', fontSize:'11px' }}>
                                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}>TOTAL</td>
                                {['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died'].map(k => (
                                    <td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}>{cohortTotals[k]}</td>
                                ))}
                                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}></td>
                            </tr>
                        </tbody>
                     </table>
                 </div>

                 {/* Category III Table */}
                 <div className={`cohort-table-hidden ${cohortSubTab === 'cat3' ? 'block' : 'hidden'}`}>
                     <div className="bg-gray-50/50 p-2 font-bold text-center border border-gray-100 rounded-t-lg text-sm text-gray-600 mb-1">CATEGORY III - EXPOSURES</div>
                     <table className="w-full border-collapse" style={{ borderColor: PDF_STYLES.border.borderColor }}>
                        <thead>
                            <tr style={PDF_STYLES.subHeader}>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, textAlign:'left', verticalAlign:'middle', width: '200px', minWidth: '200px'}}>Municipality</th>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle', width: '80px', minWidth: '80px'}}>Registered Exposures</th>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle', width: '80px', minWidth: '80px'}}>Patients w/ RIG</th>
                                <th colSpan={5} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle'}}>Outcome of PEP</th>
                                <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, verticalAlign:'middle', width:'150px', minWidth: '150px'}}>Remarks</th>
                            </tr>
                            <tr style={PDF_STYLES.subHeader}>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Complete</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Incomplete</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Booster</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>None</th>
                                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Died</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cohortRowsCat3.map((key, idx) => {
                                const isEmpty = !hasCohortData(cohortData[key], 'cat3');
                                const hideClass = isEmpty ? 'pdf-hide-empty' : '';
                                const row = cohortData[key] || INITIAL_COHORT_ROW;
                                const isRowReadOnly = user.role === 'admin' || key === currentHostMunicipality;
                                const isOtherRow = visibleCat3.includes(key);
                                
                                if (key === "Others:") {
                                    const host = currentHostMunicipality;
                                    const availableOptions = MUNICIPALITIES.filter(m => m !== host && !visibleCat3.includes(m)).sort();
                                    const showAddControls = user.role !== 'admin' && !isConsolidatedView;
                                    return (
                                        <tr key="cohort-others-sep-3" className={hideClass} style={{ ...PDF_STYLES.rowEven, ...PDF_STYLES.bgGray }}>
                                            <td colSpan={9} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', ...PDF_STYLES.bgGray, padding:'8px'}}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-gray-500">Other Municipalities</span>
                                                    {showAddControls && (
                                                        <div className="flex items-center gap-2 no-print">
                                                            <select id="cohort-other-select-3" className="bg-white border border-gray-300 text-xs rounded p-1 outline-none">
                                                                <option value="">Select...</option>
                                                                {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                            <button type="button" onClick={() => { const select = document.getElementById('cohort-other-select-3'); const val = select.value; if(val) { setVisibleCat3(prev => [...prev, val]); select.value = ""; } }} className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-zinc-800 transition">+ Add Row</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={key} className={hideClass} style={PDF_STYLES.rowEven}>
                                        <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal'}}>
                                            <div className="flex justify-between items-center group/row">
                                                <span>{key}</span>
                                                {isOtherRow && !isRowReadOnly && (
                                                    <button onClick={() => handleDeleteRow(key)} className="text-gray-400 hover:text-red-600 transition px-2 no-print"><XCircle size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                        {['cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'].map(f => (
                                            <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e => handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>
                                        ))}
                                        <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row.cat3_remarks} onChange={e => handleChange(key, 'cat3_remarks', e.target.value)} style={PDF_STYLES.inputText} /></td>
                                    </tr>
                                );
                            })}
                            <tr style={{ ...PDF_STYLES.bgDark, fontWeight:'bold', fontSize:'11px' }}>
                                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}>TOTAL</td>
                                {['cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'].map(k => (
                                    <td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}>{cohortTotals[k]}</td>
                                ))}
                                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}></td>
                            </tr>
                        </tbody>
                     </table>
                 </div>
               </div>
               )}
             </div>

             {/* PRINT FOOTER */}
             <div className="hidden print:flex justify-around mt-12 text-center text-sm" style={{ display: 'none', justifyContent:'space-around', marginTop:'3rem', textAlign:'center', fontSize:'11px' }} id="pdf-footer">
                {userProfile?.signatories?.length > 0 ? userProfile.signatories.map((sig, idx) => (
                  <div key={idx} className="flex flex-col items-center" style={{ minWidth: '150px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{marginBottom:'0.5rem', fontWeight:'bold', fontSize:'10px', textTransform:'uppercase', color:'#4b5563'}}>{sig.label}</div>
                    <div style={{height:'3.5rem', width:'100%'}}></div>
                    <p style={{fontWeight:'bold', textTransform:'uppercase', borderTop:'1px solid #000', padding:'0.25rem 2rem', marginTop:'0.25rem', width:'100%', color: '#000'}}>{sig.name}</p>
                    <p style={{fontSize:'10px', color:'#374151'}}>{sig.title}</p>
                  </div>
                )) : null}
             </div>
          </div>
        )}

        {showSettingsModal && (
          <SettingsModal 
            onClose={() => setShowSettingsModal(false)} 
            globalSettings={globalSettings} 
            onSaveGlobal={setGlobalSettings} 
            userProfile={userProfile}
            onSaveProfile={setUserProfile}
            isAdmin={user.role === 'admin'}
          />
        )}

        {showManageUsers && <UserManagementModal onClose={() => setShowManageUsers(false)} facilities={facilities} client={adminHelperClient} />}
        {showProfileModal && <ProfileModal userId={user.id} onClose={() => setShowProfileModal(false)} isSelf={true} />}
        {showAddFacilityModal && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl w-full max-w-md"><div className="flex justify-between items-center mb-6"><h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900"><PlusCircle size={20}/> Add New Facility</h2><button onClick={() => setShowAddFacilityModal(false)} className="text-gray-400 hover:text-zinc-900"><X size={20} /></button></div><AddFacilityForm onAdd={handleAddFacility} /></div></div>)}
        {showRejectModal && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200"><div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-rose-600 flex items-center gap-2"><MessageSquare size={20}/> Reject Report</h2><button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-zinc-900"><X size={20}/></button></div><p className="text-gray-600 text-sm mb-4">Please provide a reason for rejecting this report.</p><textarea className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} autoFocus placeholder="e.g. Incomplete data for..."></textarea><div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition">Cancel</button><button onClick={confirmRejection} className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-sm font-medium transition">Confirm Rejection</button></div></div></div>)}
        
        {/* CUSTOM CONFIRMATION MODAL FOR DELETION */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 p-3 rounded-full mb-4 text-red-600">
                  <AlertTriangle size={24} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Remove Row?</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to remove the row for <span className="font-bold text-gray-800">{deleteConfirmation.rowKey}</span>? All data in this row will be cleared.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteConfirmation({isOpen: false, rowKey: null})} className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition border border-gray-200">Cancel</button>
                  <button onClick={confirmDeleteRow} className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition shadow-sm">Remove</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Abra Provincial Health Office. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Developed by Justice Belleza</span>
            <a href="https://github.com/JusticeBelleza" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-blue-600 transition-colors">
              <Github size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}