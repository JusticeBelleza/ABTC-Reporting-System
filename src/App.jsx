import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Save, Download, AlertCircle, FileText, Calendar, 
  LogOut, CheckCircle, XCircle, Clock, Shield, MapPin, Plus, 
  Building, List, Layers, UserPlus, Filter, Loader2, PlusCircle,
  Trash2, MessageSquare, Bell, Check, KeyRound, ArrowLeft, Lock,
  User, Edit, UserCog, Phone, Briefcase, Settings, Printer, 
  Image as ImageIcon, FileDown, X
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// --- Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Main Client
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Initialize Admin Helper (Isolated Storage)
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
  "Tineg", "Tubo", "Villaviciosa"
];

const INITIAL_FACILITY_BARANGAYS = {
  "Bangued RHU": ["Agtangao", "Angad", "Banacao", "Bangbangar", "Cabuloan", "Calaba", "Cosili East (Proper)", "Cosili West (Buaya)", "Dangdangla", "Lingtan", "Lipcan", "Lubong", "Macarcarmay", "Macray", "Malita", "Maoay", "Palao", "Patucannay", "Sagap", "San Antonio", "Santa Rosa", "Sao-atan", "Sappaac", "Tablac (Calot)", "Zone 1 Poblacion (Nalasin)", "Zone 2 Poblacion (Consiliman)", "Zone 3 Poblacion (Lalaud)", "Zone 4 Poblacion (Town Proper)", "Zone 5 Poblacion (Bo. Barikir)", "Zone 6 Poblacion (Sinapangan)", "Zone 7 Poblacion (Baliling)"],
  "Tayum RHU": ["Bagalay", "Basbasa", "Budac", "Bumagcat", "Cabaroan", "Deet", "Gaddani", "Patucannay", "Pias", "Poblacion", "Velasco"],
  "Manabo RHU": ["Ayyeng (Poblacion)", "Catacdegan Nuevo", "Catacdegan Viejo", "Luzong", "San Jose Norte", "San Jose Sur", "San Juan Norte", "San Juan Sur", "San Ramon East", "San Ramon West", "Santo Tomas"],
  "Luba RHU": ["Ampalioc", "Barit", "Gayaman", "Lul-luno", "Luzong", "Nagbukel", "Poblacion", "Sabnangan"],
  "Tubo RHU": ["Alangtin", "Amtuagan", "Dilong", "Kili", "Poblacion (Mayabo)", "Supo", "Tiempo", "Tubtuba", "Wayangan"],
  "Dolores RHU": ["Bayaan", "Cabaroan", "Calumbaya", "Cardona", "Isit", "Kimmalaba", "Libtec", "Lub-lubba", "Mudiit", "Namit-ingang", "Pacac", "Poblacion", "Salucag", "Talogtog", "Taping"],
  "Lagangilang RHU": ["Aguet", "Bacooc", "Balais", "Cayapa", "Dalaguisen", "Laang", "Lagben", "Laguiben", "Nagtupacan", "Paganao", "Pawa", "Poblacion", "Presentar", "San Isidro", "Tagodtod", "Taping", "Villacarta"],
  "La Paz RHU": ["Benben", "Bulbulala", "Buli", "Canan", "Liguis", "Malabbaga", "Mudeng", "Pidipid", "Poblacion", "San Gregorio", "Toon", "Udangan"]
};

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

// --- PDF SAFE STYLES (Inline CSS) ---
const PDF_STYLES = {
  container: { backgroundColor: '#ffffff', color: '#000000', padding: '20px', fontFamily: 'Arial, sans-serif' },
  header: { backgroundColor: '#bfdbfe', color: '#1e3a8a', fontWeight: 'bold' }, // Light Blue Header
  subHeader: { backgroundColor: '#f3f4f6', color: '#374151' },
  cell: { border: '1px solid #9ca3af', padding: '4px', textAlign: 'center', fontSize: '10px' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#f9fafb' },
  hostRow: { backgroundColor: '#dbeafe', fontWeight: 'bold' },
  border: { borderColor: '#9ca3af', borderWidth: '1px', borderStyle: 'solid' },
  
  // Columns
  colHuman: { backgroundColor: '#eff6ff' },
  colAB: { backgroundColor: '#dcfce7' },
  colStatus: { backgroundColor: '#f3e8ff' },
  colPEP: { backgroundColor: '#ffedd5' },
  colAnimals: { backgroundColor: '#fee2e2' },
  colWashing: { backgroundColor: '#fef9c3' },
  
  input: { width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '10px' },
  inputText: { width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '10px' }
};

// --- Helper Functions ---
const mapDbToRow = (r) => ({ ...INITIAL_ROW_STATE, ...r, male: r.male ?? '', female: r.female ?? '', ageLt15: r.age_lt_15 ?? '', ageGt15: r.age_gt_15 ?? '', cat1: r.cat_1 ?? '', cat2: r.cat_2 ?? '', cat3: r.cat_3 ?? '', totalPatients: r.total_patients ?? '', abCount: r.ab_count ?? '', hrCount: r.hr_count ?? '', pvrv: r.pvrv ?? '', pcecv: r.pcecv ?? '', hrig: r.hrig ?? '', erig: r.erig ?? '', dog: r.dog ?? '', cat: r.cat ?? '', othersCount: r.others_count ?? '', othersSpec: r.others_spec ?? '', washed: r.washed ?? '', remarks: r.remarks ?? '' });
const toInt = (val) => val === '' ? 0 : Number(val);
const mapRowToDb = (r) => ({ male: toInt(r.male), female: toInt(r.female), age_lt_15: toInt(r.ageLt15), age_gt_15: toInt(r.ageGt15), cat_1: toInt(r.cat1), cat_2: toInt(r.cat2), cat_3: toInt(r.cat3), total_patients: toInt(r.totalPatients), ab_count: toInt(r.abCount), hr_count: toInt(r.hrCount), pvrv: toInt(r.pvrv), pcecv: toInt(r.pcecv), hrig: toInt(r.hrig), erig: toInt(r.erig), dog: toInt(r.dog), cat: toInt(r.cat), others_count: toInt(r.others_count), others_spec: r.othersSpec, washed: toInt(r.washed), remarks: r.remarks });
const getQuarterMonths = (q) => { if (q === "1st Quarter") return ["January", "February", "March"]; if (q === "2nd Quarter") return ["April", "May", "June"]; if (q === "3rd Quarter") return ["July", "August", "September"]; if (q === "4th Quarter") return ["October", "November", "December"]; return []; };
const StatusBadge = ({ status }) => { const styles = { 'Draft': 'bg-gray-200 text-gray-700', 'Pending': 'bg-yellow-100 text-yellow-800', 'Approved': 'bg-green-100 text-green-800', 'Rejected': 'bg-red-100 text-red-800' }; return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || styles['Draft']}`}>{status || 'Draft'}</span>; };

// --- PDF DOWNLOAD HELPER ---
const downloadPDF = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if(!element) { toast.error("Nothing to print!"); return; }

  // Load script if not present
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
    // 1. Hide unwanted UI elements
    const noPrints = document.querySelectorAll('.no-print');
    noPrints.forEach(el => el.style.display = 'none');

    // 2. Show Header and Footer explicitly for the PDF capture
    const pdfHeader = document.getElementById('pdf-header');
    const pdfFooter = document.getElementById('pdf-footer');
    if(pdfHeader) pdfHeader.style.display = 'flex';
    if(pdfFooter) pdfFooter.style.display = 'flex';

    const opt = { 
      margin: 0.2, 
      filename: filename, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true, logging: false }, 
      jsPDF: { unit: 'in', format: [13, 8.5], orientation: 'landscape' } // 13x8.5 (Long/Folio Landscape)
    };
    
    try {
      await window.html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("PDF Error: " + (err.message || "Unknown error"));
    } finally {
      // 3. Restore UI state
      noPrints.forEach(el => el.style.display = '');
      if(pdfHeader) pdfHeader.style.display = 'none';
      if(pdfFooter) pdfFooter.style.display = 'none';
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
      setResetMessage('Password reset link sent! Check your email.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6 text-blue-900"><Shield size={48} /></div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">ABTC Reporting System</h1>
        <p className="text-center text-gray-500 mb-8">Provincial Health Office</p>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
        {resetMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm flex items-center gap-2"><CheckCircle size={16}/> {resetMessage}</div>}

        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white p-3 rounded hover:bg-blue-800 transition font-bold flex items-center justify-center gap-2">{loading && <Loader2 size={18} className="animate-spin"/>}{loading ? 'Signing in...' : 'Sign In'}</button>
            <div className="text-center mt-4"><button type="button" onClick={() => { setIsResetMode(true); setError(''); setResetMessage(''); }} className="text-sm text-blue-600 hover:underline">Forgot Password?</button></div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-4"><h3 className="font-bold text-lg text-gray-700">Reset Password</h3><p className="text-xs text-gray-500">Enter your email to receive a reset link.</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2">{loading && <Loader2 size={18} className="animate-spin"/>}{loading ? 'Sending...' : 'Send Reset Link'}</button>
            <div className="text-center mt-4"><button type="button" onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }} className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"><ArrowLeft size={14}/> Back to Login</button></div>
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
    if (error) toast.error("Failed to update password: " + error.message);
    else { toast.success("Password updated successfully!"); onComplete(); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in">
        <div className="flex justify-center mb-4 text-green-600"><Lock size={48} /></div>
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Set New Password</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Please enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" required className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
           <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition font-bold flex items-center justify-center gap-2">{loading && <Loader2 size={18} className="animate-spin"/>} Update Password</button>
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

  if (!supabase) return <div className="min-h-screen flex items-center justify-center">Configuration Missing</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (showPasswordUpdate) return <UpdatePasswordForm onComplete={() => setShowPasswordUpdate(false)} />;
  if (!session) return <Login />;

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.facility_name || 'Unknown Facility', 
    role: session.user.user_metadata?.role || 'user'
  };

  return (
    <>
      <Toaster position="top-right" richColors closeButton expand={true} />
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
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')); 
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
         audioRef.current.play().catch(e => {}); 
         if (payload.new.type === 'error') toast.error(payload.new.title, { description: payload.new.message });
         else toast.success(payload.new.title, { description: payload.new.message });
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
      <button onClick={() => { if(!isOpen) markAsRead(); setIsOpen(!isOpen); }} className="relative p-2 text-blue-200 hover:text-white transition">
        <Bell size={24} />
        {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-blue-900 shadow-sm animate-pulse">{notifications.filter(n => !n.is_read).length}</span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-gray-800 animate-in fade-in zoom-in duration-200">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-sm text-gray-700">Notifications</h3><span className="text-xs text-gray-500">Auto-delete after 30 days</span></div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No new notifications</div> : notifications.map((n) => (
              <div key={n.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 text-sm ${!n.is_read ? 'bg-blue-50' : ''}`}>
                <div className="flex justify-between items-start"><div className="font-bold text-gray-800">{n.title}</div><div className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{new Date(n.created_at).toLocaleDateString()}</div></div>
                <div className="text-gray-600 mt-1 text-xs leading-relaxed">{n.message}</div>
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

  const addSignatory = () => setSignatories([...signatories, { name: '', title: '', signature_base64: '' }]);
  const removeSignatory = (index) => setSignatories(signatories.filter((_, i) => i !== index));
  const updateSignatory = (index, field, value) => { const n = [...signatories]; n[index][field] = value; setSignatories(n); };
  const handleSigFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => { const n = [...signatories]; n[index].signature_base64 = r.result; setSignatories(n); }; r.readAsDataURL(file); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAdmin && activeTab === 'logo') {
        const { data: existing } = await supabase.from('settings').select('id').single();
        if(existing) await supabase.from('settings').update({ logo_base64: logoForm.logo_base64 }).eq('id', existing.id);
        else await supabase.from('settings').insert({ logo_base64: logoForm.logo_base64 });
        onSaveGlobal(logoForm);
        toast.success("Logo saved.");
      }
      if (activeTab === 'signatories') {
        const { error } = await supabase.from('profiles').update({ signatories }).eq('id', userProfile.id);
        if(error) throw error;
        onSaveProfile({ ...userProfile, signatories });
        toast.success("Signatories saved.");
      }
      onClose();
    } catch(err) { toast.error("Error: " + err.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Settings size={24} className="text-gray-700"/> Settings</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button></div>
        <div className="flex border-b mb-4">
          {isAdmin && <button onClick={() => setActiveTab('logo')} className={`px-4 py-2 font-bold text-sm ${activeTab==='logo'?'border-b-2 border-blue-600 text-blue-600':'text-gray-500'}`}>System Logo</button>}
          <button onClick={() => setActiveTab('signatories')} className={`px-4 py-2 font-bold text-sm ${activeTab==='signatories'?'border-b-2 border-blue-600 text-blue-600':'text-gray-500'}`}>Signatories (My Report)</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'logo' && (
            <div className="border p-4 rounded bg-gray-50">
              <h3 className="font-bold text-sm mb-2 text-blue-900">Header Logo (Global)</h3>
              <div className="flex items-center gap-4">{logoForm.logo_base64 && <img src={logoForm.logo_base64} alt="Logo" className="h-16 w-16 object-contain border bg-white" />}<input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500" /></div>
            </div>
          )}
          {activeTab === 'signatories' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="font-bold text-sm text-blue-900">Manage Signatories</h3><button type="button" onClick={addSignatory} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1"><Plus size={12}/> Add Row</button></div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {signatories.map((sig, idx) => (
                  <div key={idx} className="flex gap-2 items-start border p-2 rounded bg-gray-50 relative group">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Name (e.g. Dr. Juan)" value={sig.name} onChange={e=>updateSignatory(idx, 'name', e.target.value)} className="text-sm p-1 border rounded w-full"/><input type="text" placeholder="Title (e.g. MHO)" value={sig.title} onChange={e=>updateSignatory(idx, 'title', e.target.value)} className="text-sm p-1 border rounded w-full"/></div>
                      <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-500">E-Sig:</span><input type="file" accept="image/*" onChange={(e)=>handleSigFileChange(e, idx)} className="text-xs text-gray-500 w-full"/>{sig.signature_base64 && <img src={sig.signature_base64} className="h-8 w-auto border bg-white" alt="Sig" />}</div>
                    </div>
                    <button type="button" onClick={() => removeSignatory(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={16}/></button>
                  </div>
                ))}
                {signatories.length === 0 && <p className="text-xs text-gray-400 italic text-center">No signatories added.</p>}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t"><button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2">{loading && <Loader2 size={16} className="animate-spin"/>} Save Changes</button></div>
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

    if (error) toast.error("Failed to save profile.");
    else { toast.success("Profile saved!"); onClose(); }
    setSaving(false);
  };

  if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-white">Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><UserCog size={24} className="text-blue-600"/> {isSelf ? "Edit Profile" : "Edit User"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20}/></button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="bg-gray-50 p-3 rounded mb-2 text-sm text-gray-600">
            <div className="flex items-center gap-2 font-bold text-gray-800"><Building size={14}/> {profile.facility_name || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-1"><MessageSquare size={14}/> {profile.email}</div>
          </div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label><div className="flex items-center border rounded px-2"><User size={16} className="text-gray-400 mr-2"/><input type="text" className="w-full p-2 outline-none text-sm" value={profile.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="e.g. Juan Dela Cruz" /></div></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Designation</label><div className="flex items-center border rounded px-2"><Briefcase size={16} className="text-gray-400 mr-2"/><input type="text" className="w-full p-2 outline-none text-sm" value={profile.designation || ''} onChange={e => setProfile({...profile, designation: e.target.value})} placeholder="e.g. Nurse II" /></div></div>
          <div><label className="block text-xs font-bold text-gray-700 mb-1">Contact Number</label><div className="flex items-center border rounded px-2"><Phone size={16} className="text-gray-400 mr-2"/><input type="text" className="w-full p-2 outline-none text-sm" value={profile.contact_number || ''} onChange={e => setProfile({...profile, contact_number: e.target.value})} placeholder="e.g. 0917..." /></div></div>
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold mt-4 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Changes</button>
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
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: userId });
      if (error) throw error;
      toast.success("User deleted.");
      fetchUsers();
    } catch(err) { toast.error("Error deleting user: " + err.message); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {editingUserId && <ProfileModal userId={editingUserId} onClose={() => { setEditingUserId(null); fetchUsers(); }} />}
      
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col animate-in fade-in zoom-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users size={24} className="text-blue-900"/> User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
        </div>

        <div className="flex gap-4 border-b mb-4">
          <button onClick={() => setActiveTab('list')} className={`pb-2 font-bold ${activeTab==='list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>User List</button>
          <button onClick={() => setActiveTab('create')} className={`pb-2 font-bold ${activeTab==='create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Create New User</button>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'list' ? (
            loading ? <div className="text-center p-10"><Loader2 className="animate-spin inline"/> Loading users...</div> : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold">
                  <tr><th className="p-3">Facility / Role</th><th className="p-3">Name & Contact</th><th className="p-3">Email</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-3"><div className="font-bold text-blue-900">{u.facility_name}</div><div className="text-xs uppercase bg-gray-200 inline-block px-1 rounded text-gray-600">{u.role}</div></td>
                      <td className="p-3"><div>{u.full_name || '-'}</div><div className="text-xs text-gray-500">{u.contact_number}</div><div className="text-xs text-gray-400 italic">{u.designation}</div></td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setEditingUserId(u.id)} className="text-blue-600 hover:bg-blue-100 p-1 rounded mr-2" title="Edit Info"><Edit size={16}/></button>
                        {u.role !== 'admin' && <button onClick={() => handleDelete(u.id, u.facility_name)} className="text-red-600 hover:bg-red-100 p-1 rounded" title="Delete User"><Trash2 size={16}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="max-w-md mx-auto mt-4">
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
  
  const [year, setYear] = useState(currentRealYear);
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[currentRealMonth]);
  const [quarter, setQuarter] = useState("1st Quarter");
  const availableMonths = useMemo(() => (year === currentRealYear ? MONTHS.slice(0, currentRealMonth + 1) : MONTHS), [year, currentRealYear, currentRealMonth]);

  const [data, setData] = useState({});
  const [reportStatus, setReportStatus] = useState('Draft');
  const [loading, setLoading] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityStatuses, setFacilityStatuses] = useState({});
  const lastNotificationRef = useRef(0);

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
      toast.success(`${type} "${name}" added!`);
      setShowAddFacilityModal(false);
    } catch (err) { toast.error(`Failed: ${err.message}`); }
  };

  const handleDeleteFacility = async (facilityName) => {
    const confirmation = window.prompt(`Type "delete" to confirm deleting "${facilityName}":`);
    if (confirmation === "delete") {
      try {
        const { error } = await supabase.from('facilities').delete().eq('name', facilityName);
        if (error) throw error;
        setFacilities(prev => prev.filter(f => f !== facilityName));
        setFacilityBarangays(prev => { const next = { ...prev }; delete next[facilityName]; return next; });
        toast.success(`Deleted "${facilityName}"`);
      } catch (err) { toast.error(`Error: ${err.message}`); }
    } else if (confirmation !== null) toast.error("Incorrect confirmation.");
  };

  const createDbNotification = async (recipient, title, message, type='info') => {
    try { await supabase.from('notifications').insert({ recipient, title, message, type }); } catch(err) { console.error(err); }
  };

  const getRowKeysForFacility = (facilityName, consolidated = false) => {
    if (!facilityName) return []; 
    if (consolidated) return MUNICIPALITIES;
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) return MUNICIPALITIES;
    const barangays = facilityBarangays[facilityName] || [];
    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));
    if (barangays.length > 0 && hostMunicipality) {
      const other = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      return [hostMunicipality, ...barangays, "Others:", ...other];
    }
    return barangays.length > 0 ? [...barangays, "Others:", ...MUNICIPALITIES] : MUNICIPALITIES;
  };

  const activeFacilityName = user.role === 'admin' ? (isConsolidatedView ? 'PHO Consolidated' : selectedFacility) : user.name;
  const currentRows = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode]);
  const currentHostMunicipality = useMemo(() => (!activeFacilityName || isConsolidatedView || activeFacilityName==="AMDC" || activeFacilityName==="APH") ? null : MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null, [activeFacilityName, isConsolidatedView]);
  const initData = (rowKeys) => { const d = {}; rowKeys.forEach(k => { if (k !== "Others:") d[k] = { ...INITIAL_ROW_STATE }; }); return d; };

  useEffect(() => {
    if (user.role === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      else if (adminViewMode === 'consolidated' || (adminViewMode === 'review' && selectedFacility)) fetchData();
    } else fetchData();
  }, [user, year, month, quarter, periodType, adminViewMode, selectedFacility]);

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
    const rows = getRowKeysForFacility(target || 'PHO Consolidated', isConsolidatedView);
    const newData = initData(rows);
    let query = supabase.from('abtc_reports').select('*').eq('year', year);
    if (periodType === 'Monthly') query = query.eq('month', month);
    else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter));
    if (isConsolidatedView) query = query.eq('status', 'Approved'); else if (target) query = query.eq('facility', target);
    
    const { data: records } = await query;
    if (records && records.length > 0) {
      records.forEach(record => {
        const m = record.municipality;
        if (newData[m]) {
           const r = mapDbToRow(record);
           const c = newData[m];
           const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
           keys.forEach(k => { c[k] = (toInt(c[k]) + toInt(r[k])) || ''; if(c[k] === 0) c[k] = ''; });
        }
      });
      setData(newData);
      if (periodType === 'Monthly' && !isConsolidatedView) setReportStatus(records[0].status || 'Draft');
      else setReportStatus(isConsolidatedView ? 'View Only' : 'Draft');
    } else { setData(newData); setReportStatus('Draft'); }
    setLoading(false);
  };

  const confirmRejection = async () => { if (!rejectionReason.trim()) { toast.error("Reason required"); return; } setShowRejectModal(false); await handleSave('Rejected', rejectionReason); };
  const handleSave = async (newStatus, reason = null) => {
    if (periodType !== 'Monthly') { toast.error("Monthly only"); return; }
    if (newStatus === 'Rejected' && reason === null && user.role === 'admin') { setRejectionReason(''); setShowRejectModal(true); return; }
    const target = user.role === 'admin' ? selectedFacility : user.name;
    setLoading(true);
    const targetKey = currentHostMunicipality || Object.keys(data)[0];
    const payload = Object.entries(data).map(([m, row]) => {
      let rem = row.remarks;
      if (newStatus === 'Rejected' && reason && m === targetKey) rem = `REJECTED: ${reason}`;
      return { ...mapRowToDb(row), year, month, municipality: m, facility: target, status: newStatus, remarks: rem };
    });
    try {
      await supabase.from('abtc_reports').delete().eq('year', year).eq('month', month).eq('facility', target);
      await supabase.from('abtc_reports').insert(payload);
      setReportStatus(newStatus);
      if (newStatus === 'Pending') { await createDbNotification('PHO Admin', 'New Submission', `${target} report ${month}.`, 'info'); toast.success('Submitted!'); }
      else if (newStatus === 'Approved') { await createDbNotification(target, 'Approved', `Report ${month} approved.`, 'success'); toast.success('Approved'); }
      else if (newStatus === 'Rejected') { await createDbNotification(target, 'Rejected', `Report ${month} rejected.`, 'error'); toast.success('Rejected'); }
      else toast.success('Saved');
      if (user.role === 'admin' && (newStatus === 'Approved' || newStatus === 'Rejected')) { setAdminViewMode('dashboard'); setSelectedFacility(null); fetchFacilityStatuses(); }
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const handleChange = (m, f, v) => {
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
      // FIX: Only sum up rows that are actual MUNICIPALITIES to prevent double counting barangay vs municipality total
      if (MUNICIPALITIES.includes(key)) {
        const c = getComputations(row);
        numericKeys.forEach(k => t[k] += toInt(row[k]));
        t.sexTotal += c.sexTotal; t.ageTotal += c.ageTotal; t.cat23 += c.cat23; t.catTotal += c.catTotal; t.animalTotal += c.animalTotal;
      }
    });
    return t;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <style>{`
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } .no-spinner { -moz-appearance: textfield; }
        @media print { .no-print { display: none !important; } }
      `}</style>
      
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3"><Shield className="text-yellow-400" size={28} /><div><h1 className="text-lg font-bold tracking-tight">ABTC Reporting</h1></div></div>
        <div className="flex items-center gap-4">
          <NotificationBell user={user} />
          <button onClick={() => setShowSettingsModal(true)} className="text-blue-200 hover:text-white p-2 rounded-full hover:bg-blue-800 transition" title="Settings"><Settings size={22} /></button>
          <div className="text-right hidden sm:block cursor-pointer" onClick={() => setShowProfileModal(true)}><div className="text-sm font-semibold flex items-center gap-1 hover:text-blue-200"><User size={14}/> {user.name}</div><div className="text-xs text-blue-300 uppercase">{user.role}</div></div>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 p-2 rounded text-xs flex items-center gap-1 transition"><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto" id="report-content">
        {user.role === 'admin' && adminViewMode === 'dashboard' && (
          <div className="max-w-6xl mx-auto no-print">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Building size={24}/> Facility Reports Status</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddFacilityModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"><PlusCircle size={18} /> Add Facility</button>
                  <button onClick={() => setShowManageUsers(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2"><UserPlus size={18} /> Manage Users</button>
                  <button onClick={() => setAdminViewMode('consolidated')} className="bg-purple-700 text-white px-4 py-2 rounded shadow hover:bg-purple-800 flex items-center gap-2"><Layers size={18} /> View Consolidated</button>
                </div>
             </div>
             
             <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-center flex-wrap">
                <label className="font-bold text-gray-700">Period:</label>
                <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="border p-2 rounded font-bold text-blue-900"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} className="border p-2 rounded font-semibold text-gray-700">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} className="border p-2 rounded font-semibold text-gray-700">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="border p-2 rounded font-semibold text-gray-700">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                <button onClick={fetchFacilityStatuses} className="text-blue-600 hover:underline text-sm ml-auto">Refresh Status</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {facilities.map(f => (
                 <div key={f} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition relative group">
                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-blue-900">{f}</h3><div className="flex items-center gap-2"><StatusBadge status={facilityStatuses[f]} />{user.role === 'admin' && <button onClick={(e) => { e.stopPropagation(); handleDeleteFacility(f); }} className="text-gray-400 hover:text-red-600 transition p-1"><Trash2 size={16} /></button>}</div></div>
                    <p className="text-sm text-gray-500 mb-4">{periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                    <button onClick={() => { setSelectedFacility(f); setAdminViewMode('review'); }} className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded text-sm hover:bg-blue-100 font-semibold">{periodType === 'Monthly' ? 'Review Report' : 'View Aggregate'}</button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {(user.role !== 'admin' || (user.role === 'admin' && (adminViewMode === 'review' || adminViewMode === 'consolidated'))) && (
          <div className="max-w-[95vw] mx-auto">
             <div className="bg-white p-4 rounded-lg shadow mb-4 flex flex-wrap gap-4 items-center justify-between no-print">
                <div className="flex items-center gap-4">{user.role === 'admin' && <button onClick={() => { setAdminViewMode('dashboard'); setSelectedFacility(null); }} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-bold">&larr; Back to Dashboard</button>}<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-blue-600" />{isConsolidatedView ? 'Consolidated Report' : `${activeFacilityName} Report`}</h2></div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                      <Filter size={16} className="text-gray-500"/>
                      <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent font-bold text-sm outline-none text-blue-900 border-r border-gray-300 pr-2 mr-2"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                      {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-transparent font-semibold text-sm outline-none">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                      {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-transparent font-semibold text-sm outline-none">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                      <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-transparent font-semibold text-sm outline-none">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                   </div>
                   <button onClick={() => downloadPDF('report-content', `ABTC_Report_${activeFacilityName}_${year}.pdf`)} className="bg-gray-800 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-black flex items-center gap-2"><FileDown size={16}/> Download PDF</button>
                   {!isConsolidatedView && !isAggregationMode && (<><StatusBadge status={reportStatus} />{user.role === 'admin' ? (<><button onClick={() => handleSave('Approved')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 flex items-center gap-1">{loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve</button><button onClick={() => handleSave('Rejected')} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 flex items-center gap-1">{loading ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject</button></>) : (<><button onClick={() => handleSave('Draft')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-bold hover:bg-gray-300 flex items-center gap-1 disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Draft</button><button onClick={() => handleSave('Pending')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Submit</button></>)}</>)}
                </div>
             </div>
             
             {/* PRINT HEADER - NOW USING INLINE STYLES FOR PDF SAFETY */}
             <div className="hidden print:flex mb-6 items-center justify-center gap-6 pt-4" style={{ display: 'none', ...PDF_STYLES.container }} id="pdf-header">
                {globalSettings?.logo_base64 && <img src={globalSettings.logo_base64} alt="Logo" className="h-24 w-24 object-contain" />}
                <div className="text-center">
                   <h1 style={{fontSize:'16pt', fontWeight:'bold', textTransform:'uppercase'}}>National Rabies Prevention and Control Program</h1>
                   <h2 style={{fontSize:'14pt', fontWeight:'bold', textTransform:'uppercase'}}>National Rabies and Bite Victims Report</h2>
                   <p style={{fontSize:'12pt', fontWeight:'bold', marginTop:'5px'}}>
                     {periodType === 'Monthly' ? `${month} ${year}` : (periodType === 'Quarterly' ? `${quarter} ${year}` : `Annual ${year}`)}
                   </p>
                </div>
             </div>

             <div className="overflow-x-auto shadow-lg rounded-lg bg-white border border-gray-300 print:shadow-none print:border-none" style={{...PDF_STYLES.container, ...PDF_STYLES.border}}>
               <table className="w-full border-collapse" style={{ borderColor: PDF_STYLES.border.borderColor }}>
                <thead>
                  <tr className="uppercase text-xs text-center" style={isConsolidatedView ? PDF_STYLES.header : PDF_STYLES.subHeader}>
                    <th rowSpan={3} className="py-2 px-3 border sticky left-0 z-20 min-w-[200px]" style={PDF_STYLES.border}>{isConsolidatedView ? "Municipality" : (facilityBarangays[activeFacilityName] ? "Barangay / Municipality" : "Municipality")}</th>
                    <th colSpan={3} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colHuman}}>Human Cases (Sex)</th>
                    <th colSpan={3} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colHuman}}>Human Cases (Age)</th>
                    <th colSpan={5} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colAB}}>AB Category</th>
                    <th colSpan={2} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colStatus}}>Status</th>
                    <th colSpan={4} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colPEP}}>PEP</th>
                    <th colSpan={5} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colAnimals}}>Biting Animals</th>
                    <th colSpan={2} className="border" style={{...PDF_STYLES.border, ...PDF_STYLES.colWashing}}>Washing</th>
                    <th rowSpan={3} className="border min-w-[150px]" style={PDF_STYLES.border}>Remarks</th>
                  </tr>
                  <tr className="text-[10px] font-bold text-center" style={PDF_STYLES.subHeader}>
                    <th className="border" style={PDF_STYLES.border}>M</th><th className="border" style={PDF_STYLES.border}>F</th><th className="border" style={{...PDF_STYLES.border, backgroundColor: '#f0f0f0'}}>Total</th>
                    <th className="border" style={PDF_STYLES.border}>&lt;15</th><th className="border" style={PDF_STYLES.border}>&gt;15</th><th className="border" style={{...PDF_STYLES.border, backgroundColor: '#f0f0f0'}}>Total</th>
                    <th className="border" style={PDF_STYLES.border}>I</th><th className="border" style={PDF_STYLES.border}>II</th><th className="border" style={PDF_STYLES.border}>III</th><th className="border" style={{...PDF_STYLES.border, backgroundColor: '#f0f0f0'}}>II+III</th><th className="border" style={{...PDF_STYLES.border, backgroundColor: '#f0f0f0'}}>Tot</th>
                    <th className="border" style={PDF_STYLES.border}>Tot</th><th className="border" style={PDF_STYLES.border}>AB</th>
                    <th className="border" style={PDF_STYLES.border}>PVRV</th><th className="border" style={PDF_STYLES.border}>PCECV</th><th className="border" style={PDF_STYLES.border}>HRIG</th><th className="border" style={PDF_STYLES.border}>ERIG</th>
                    <th className="border" style={PDF_STYLES.border}>Dog</th><th className="border" style={PDF_STYLES.border}>Cat</th><th className="border" style={PDF_STYLES.border}>Oth</th><th className="border" style={PDF_STYLES.border}>Spec</th><th className="border" style={{...PDF_STYLES.border, backgroundColor: '#f0f0f0'}}>Tot</th>
                    <th className="border" style={PDF_STYLES.border}>No.</th><th className="border" style={{...PDF_STYLES.border, backgroundColor: '#f0f0f0'}}>%</th>
                  </tr>
                </thead>
                <tbody className="text-xs" style={{ color: '#000000' }}>
                  {currentRows.map((key, idx) => {
                    if (key === "Others:") return <tr key="others-separator" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}><td colSpan={26} className="py-2 px-3 border text-left sticky left-0 z-10" style={PDF_STYLES.border}>Others (Municipalities)</td></tr>;
                    const row = data[key] || INITIAL_ROW_STATE;
                    const c = getComputations(row);
                    const isRowReadOnly = user.role === 'admin' || key === currentHostMunicipality || isConsolidatedView || isAggregationMode || (reportStatus !== 'Draft' && reportStatus !== 'Rejected'); 
                    const rowBg = key === currentHostMunicipality ? PDF_STYLES.hostRow.backgroundColor : (idx % 2 === 0 ? PDF_STYLES.rowEven.backgroundColor : PDF_STYLES.rowOdd.backgroundColor);
                    const rowFontWeight = key === currentHostMunicipality ? 'bold' : 'normal';

                    return (
                      <tr key={key} style={{ backgroundColor: rowBg, fontWeight: rowFontWeight }}>
                        <td className="py-1 px-2 border font-medium sticky left-0 z-10 whitespace-nowrap" style={{...PDF_STYLES.border, backgroundColor: rowBg, fontWeight: rowFontWeight, color: MUNICIPALITIES.includes(key) ? '#1e40af' : '#1f2937', paddingLeft: MUNICIPALITIES.includes(key) ? '0.5rem' : '1rem'}}>{key} {key === currentHostMunicipality && "(Total)"}</td>
                        {['male','female'].map(f => <td key={f} className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td className="p-1 border text-center font-bold" style={{...PDF_STYLES.border, backgroundColor: '#f3f4f6'}}>{c.sexTotal}</td>
                        {['ageLt15','ageGt15'].map(f => <td key={f} className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td className="p-1 border text-center font-bold" style={{...PDF_STYLES.border, backgroundColor: '#f3f4f6', color: c.sexMismatch ? '#ef4444' : 'inherit'}}>{c.ageTotal}</td>
                        {['cat1','cat2','cat3'].map(f => <td key={f} className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td className="p-1 border text-center" style={{...PDF_STYLES.border, backgroundColor: '#f3f4f6'}}>{c.cat23}</td>
                        <td className="p-1 border text-center font-bold" style={{...PDF_STYLES.border, backgroundColor: '#f3f4f6'}}>{c.catTotal}</td>
                        {['totalPatients','abCount'].map(f => <td key={f} className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        {['pvrv','pcecv','hrig','erig'].map(f => <td key={f} className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        {['dog','cat','othersCount'].map(f => <td key={f} className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
                        <td className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="text" value={row.othersSpec} onChange={e=>handleChange(key, 'othersSpec', e.target.value)} style={PDF_STYLES.inputText} /></td>
                        <td className="p-1 border text-center font-bold" style={{...PDF_STYLES.border, backgroundColor: '#f3f4f6'}}>{c.animalTotal}</td>
                        <td className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="number" min="0" value={row.washed} onChange={e=>handleChange(key, 'washed', e.target.value)} style={PDF_STYLES.input} /></td>
                        <td className="p-1 border text-center" style={{...PDF_STYLES.border, backgroundColor: '#f3f4f6', fontSize: '10px'}}>{c.percent}</td>
                        <td className="p-0 border" style={PDF_STYLES.border}><input disabled={isRowReadOnly} type="text" value={row.remarks} onChange={e=>handleChange(key, 'remarks', e.target.value)} style={{...PDF_STYLES.inputText, textAlign: 'left', paddingLeft: '4px'}} /></td>
                      </tr>
                    );
                  })}
                  {/* Grand Total */}
                  <tr className="font-bold text-xs sticky bottom-0 z-20" style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>
                    <td className="py-2 px-2 border sticky left-0" style={{...PDF_STYLES.border, backgroundColor: '#1f2937'}}>{isConsolidatedView ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}</td>
                    {['male','female'].map(k=><td key={k} className="text-center border" style={PDF_STYLES.border}>{grandTotals[k]}</td>)}
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}>{grandTotals.sexTotal}</td>
                    {['ageLt15','ageGt15'].map(k=><td key={k} className="text-center border" style={PDF_STYLES.border}>{grandTotals[k]}</td>)}
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}>{grandTotals.ageTotal}</td>
                    {['cat1','cat2','cat3'].map(k=><td key={k} className="text-center border" style={PDF_STYLES.border}>{grandTotals[k]}</td>)}
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}>{grandTotals.cat23}</td>
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}>{grandTotals.catTotal}</td>
                    {['totalPatients','abCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount'].map(k=><td key={k} className="text-center border" style={PDF_STYLES.border}>{grandTotals[k]}</td>)}
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}></td>
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}>{grandTotals.animalTotal}</td>
                    <td className="text-center border" style={PDF_STYLES.border}>{grandTotals.washed}</td>
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}></td>
                    <td className="text-center border" style={{...PDF_STYLES.border, backgroundColor: '#374151'}}></td>
                  </tr>
                </tbody>
               </table>
             </div>

             {/* PRINT FOOTER (SIGNATORIES) - USING INLINE STYLES */}
             <div className="hidden print:flex justify-around mt-12 text-center text-sm" style={{ display: 'none', justifyContent:'space-around', marginTop:'3rem', textAlign:'center', fontSize:'0.875rem' }} id="pdf-footer">
                {userProfile?.signatories?.length > 0 ? userProfile.signatories.map((sig, idx) => (
                  <div key={idx} className="flex flex-col items-center" style={{ minWidth: '150px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div className="h-16 flex items-end justify-center w-full relative" style={{height:'4rem', display:'flex', alignItems:'flex-end', justifyContent:'center', width:'100%', position:'relative'}}>
                      {sig.signature_base64 && <img src={sig.signature_base64} alt="Signature" style={{height:'3rem', width:'auto', objectFit:'contain', marginBottom:'-10px', position:'relative', zIndex:'10'}} />}
                    </div>
                    <p style={{fontWeight:'bold', textTransform:'uppercase', borderTop:'1px solid black', padding:'0.25rem 2rem', marginTop:'0.25rem', width:'100%'}}>{sig.name}</p>
                    <p style={{fontSize:'0.75rem'}}>{sig.title}</p>
                  </div>
                )) : <p style={{fontStyle:'italic', color:'#9ca3af'}}>No signatories set. Configure in Settings.</p>}
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
        {showAddFacilityModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle size={20}/> Add New Facility</h2><button onClick={() => setShowAddFacilityModal(false)} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button></div><AddFacilityForm onAdd={handleAddFacility} /></div></div>)}
        {showRejectModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-red-700 flex items-center gap-2"><MessageSquare size={20}/> Reject Report</h2><button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button></div><p className="text-gray-600 text-sm mb-4">Reason for rejection:</p><textarea className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-red-200 outline-none" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} autoFocus></textarea><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-semibold">Cancel</button><button onClick={confirmRejection} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded text-sm font-semibold">Confirm</button></div></div></div>)}
      </main>
    </div>
  );
}

// Form for Adding Facility
function AddFacilityForm({ onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Hospital'); 
  const [barangays, setBarangays] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (name.trim()) onAdd(name.trim(), type, barangays); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-bold text-gray-700 mb-1">Facility Name</label><input type="text" required placeholder="e.g. San Juan RHU" className="w-full border p-2 rounded text-sm" value={name} onChange={e => setName(e.target.value)} /></div>
      <div><label className="block text-sm font-bold text-gray-700 mb-1">Facility Type</label><div className="flex gap-4"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="ftype" checked={type === 'Hospital'} onChange={() => setType('Hospital')} /> Hospital/Clinic</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="ftype" checked={type === 'RHU'} onChange={() => setType('RHU')} /> RHU</label></div></div>
      {type === 'RHU' && (<div><label className="block text-sm font-bold text-gray-700 mb-1">Catchment Barangays</label><textarea className="w-full border p-2 rounded text-sm h-24" placeholder="Enter barangay names separated by commas" value={barangays} onChange={e => setBarangays(e.target.value)} /><p className="text-xs text-gray-500 mt-1">If blank, only 'Others' will be shown.</p></div>)}
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">Add Facility</button>
    </form>
  );
}

// Extracted User Register Form (with new fields)
function RegisterUserForm({ facilities, client, onSuccess }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [facilityName, setFacilityName] = useState(facilities[0] || ''); const [role, setRole] = useState('user');
  const [fullName, setFullName] = useState(''); const [designation, setDesignation] = useState(''); const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState({ type: '', text: '' });

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setMsg({ type: '', text: '' });
    if (!client) { setMsg({ type: 'error', text: 'Admin Client not initialized.' }); setLoading(false); return; }
    try {
      const { data, error } = await client.auth.signUp({ 
        email, password, 
        options: { data: { facility_name: facilityName, role, full_name: fullName, designation, contact_number: contactNumber } } 
      });
      if (error) throw error;
      if (data.user) { 
        toast.success(`User created for ${facilityName}`);
        setEmail(''); setPassword(''); setFullName(''); setDesignation(''); setContactNumber('');
        if(onSuccess) onSuccess();
      }
    } catch (err) { setMsg({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-3">
      {msg.text && <div className={`p-2 rounded mb-4 text-sm ${msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{msg.text}</div>}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-xs font-bold text-gray-700 mb-1">Email</label><input type="email" required className="w-full border p-2 rounded text-sm" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className="block text-xs font-bold text-gray-700 mb-1">Password</label><input type="password" required className="w-full border p-2 rounded text-sm" value={password} onChange={e => setPassword(e.target.value)} /></div>
      </div>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">Role</label><select className="w-full border p-2 rounded text-sm" value={role} onChange={e => setRole(e.target.value)}><option value="user">Facility User (Reporter)</option><option value="admin">PHO Admin (Viewer)</option></select></div>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">Assign Facility</label>{role === 'admin' ? <input type="text" disabled value="PHO Admin" className="w-full border p-2 rounded text-sm bg-gray-100 text-gray-500" /> : <select className="w-full border p-2 rounded text-sm" value={facilityName} onChange={e => setFacilityName(e.target.value)}>{facilities.map(f => <option key={f} value={f}>{f}</option>)}</select>}</div>
      <div className="pt-2 border-t mt-2"><h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Profile Info</h3></div>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label><input type="text" className="w-full border p-2 rounded text-sm" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Juan Dela Cruz" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-xs font-bold text-gray-700 mb-1">Designation</label><input type="text" className="w-full border p-2 rounded text-sm" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Nurse II" /></div>
        <div><label className="block text-xs font-bold text-gray-700 mb-1">Contact No.</label><input type="text" className="w-full border p-2 rounded text-sm" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="0917..." /></div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition font-bold mt-4 flex items-center justify-center gap-2">{loading && <Loader2 size={16} className="animate-spin"/>}{loading ? 'Creating...' : 'Create Account'}</button>
    </form>
  );
}