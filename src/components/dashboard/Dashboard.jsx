import React, { useState, useMemo } from 'react';
import { FileText, LogOut, User, Settings, Github, AlertTriangle, X, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase, adminHelperClient } from '../../lib/supabase';
import { MONTHS } from '../../lib/constants';
import { useApp } from '../../context/AppContext';

import AdminDashboard from './AdminDashboard';
import FacilityDashboard from './FacilityDashboard';
import NotificationBell from './NotificationBell';
import AddFacilityForm from './AddFacilityForm';
import PrivacyModal from '../modals/PrivacyModal';
import TermsModal from '../modals/TermsModal';
import SettingsModal from '../modals/SettingsModal';
import ProfileModal from '../modals/ProfileModal';
import UserManagementModal from '../modals/UserManagementModal';
import ErrorBoundary from '../ErrorBoundary';

function DashboardContent() {
  const { user, facilities, setFacilities, setFacilityBarangays, logout, globalSettings, setGlobalSettings, userProfile, setUserProfile } = useApp();

  // Date State
  const currentDate = useMemo(() => new Date(), []);
  const currentRealYear = currentDate.getFullYear();
  const availableYears = useMemo(() => { const years = []; for (let y = 2024; y <= currentRealYear; y++) years.push(y); return years; }, [currentRealYear]);
  
  const [year, setYear] = useState(currentRealYear);
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [quarter, setQuarter] = useState("1st Quarter");
  const availableMonths = useMemo(() => (year === currentRealYear ? MONTHS.slice(0, currentDate.getMonth() + 1) : MONTHS), [year, currentRealYear]);

  // View State
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);

  // Modals
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  
  // Deletion State (Global)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, rowKey: null });
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [deleteFacilityInput, setDeleteFacilityInput] = useState('');
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeletingFacility, setIsDeletingFacility] = useState(false);

  // Admin Actions
  const handleAddFacility = async (name, type, barangaysList) => {
    if (facilities.includes(name)) { toast.error('Name exists'); return; }
    try {
      let bArray = type === 'RHU' && barangaysList ? barangaysList.split(',').map(b => b.trim()).filter(b => b) : null;
      const { error } = await supabase.from('facilities').insert({ name, type, barangays: bArray });
      if (error) throw error;
      setFacilities(prev => [...prev, name]);
      if (bArray) setFacilityBarangays(prev => ({ ...prev, [name]: bArray }));
      toast.success("Facility added"); setShowAddFacilityModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const confirmDeleteFacility = async () => {
    if (deleteFacilityInput !== 'delete') { toast.error('Type "delete"'); return; }
    setIsDeletingFacility(true);
    try {
        await supabase.from('abtc_reports').delete().eq('facility', facilityToDelete);
        await supabase.from('abtc_cohort_reports').delete().eq('facility', facilityToDelete);
        await supabase.from('facilities').delete().eq('name', facilityToDelete);
        setFacilities(prev => prev.filter(f => f !== facilityToDelete));
        toast.success("Deleted"); setFacilityToDelete(null);
    } catch (err) { toast.error(err.message); }
    setIsDeletingFacility(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-zinc-900">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-zinc-900 text-white p-1.5 rounded-lg"><FileText size={18} strokeWidth={2}/></div>
             <span className="font-semibold tracking-tight text-sm md:text-lg">ABTC-Reporting System</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell user={user} />
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-zinc-100 transition" onClick={() => setShowProfileModal(true)}>
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium leading-none">{userProfile?.full_name || user.fullName || user.name}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">{user.role}</div>
              </div>
              <div className="bg-gray-100 p-2 rounded-full text-gray-600"><User size={16}/></div>
            </div>
            <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition"><Settings size={20} /></button>
            <button onClick={logout} className="text-gray-500 hover:text-red-600 p-2 transition ml-2"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto p-4 md:p-8" id="report-content">
        {user.role === 'admin' && adminViewMode === 'dashboard' ? (
          <AdminDashboard 
            onViewConsolidated={() => setAdminViewMode('consolidated')}
            onSelectFacility={(f) => { setSelectedFacility(f); setAdminViewMode('review'); }}
            onManageUsers={() => setShowManageUsers(true)}
            onAddFacility={() => setShowAddFacilityModal(true)}
            periodType={periodType} setPeriodType={setPeriodType}
            year={year} setYear={setYear}
            month={month} setMonth={setMonth}
            quarter={quarter} setQuarter={setQuarter}
            availableYears={availableYears} availableMonths={availableMonths}
            initiateDeleteFacility={(f) => { setFacilityToDelete(f); setDeleteFacilityInput(''); }}
          />
        ) : (
          <FacilityDashboard 
            periodType={periodType} setPeriodType={setPeriodType}
            year={year} setYear={setYear}
            month={month} setMonth={setMonth}
            quarter={quarter} setQuarter={setQuarter}
            availableYears={availableYears} availableMonths={availableMonths}
            adminViewMode={adminViewMode}
            selectedFacility={selectedFacility}
            onBack={() => { setAdminViewMode('dashboard'); setSelectedFacility(null); }}
            setDeleteConfirmation={setDeleteConfirmation}
            setReportToDelete={setReportToDelete}
          />
        )}

        {/* --- MODALS (Kept at root level) --- */}
        {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} globalSettings={globalSettings} onSaveGlobal={setGlobalSettings} userProfile={userProfile} onSaveProfile={setUserProfile} isAdmin={user.role === 'admin'} />}
        {showManageUsers && <UserManagementModal onClose={() => setShowManageUsers(false)} facilities={facilities} client={adminHelperClient} />}
        {showProfileModal && <ProfileModal userId={user.id} onClose={() => setShowProfileModal(false)} isSelf={true} />}
        
        {/* Add Facility Modal */}
        {showAddFacilityModal && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl w-full max-w-md"><div className="flex justify-between items-center mb-6"><h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900"><PlusCircle size={20}/> Add New Facility</h2><button onClick={() => setShowAddFacilityModal(false)} className="text-gray-400 hover:text-zinc-900"><X size={20} /></button></div><AddFacilityForm onAdd={handleAddFacility} loading={false} /></div></div>)}
        
        {/* Facility Delete Modal */}
        {facilityToDelete && (<div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full"><div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><AlertTriangle size={24} /></div><h3 className="text-lg font-bold text-gray-900">Delete Facility?</h3><p className="text-sm text-gray-500 mt-2 mb-4">This will remove <span className="font-semibold">{facilityToDelete}</span>. Type <span className="font-mono font-bold text-red-600">delete</span> to confirm.</p><input type="text" value={deleteFacilityInput} onChange={(e) => setDeleteFacilityInput(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 mb-4 text-center text-sm outline-none focus:border-red-500" placeholder='Type "delete"' autoFocus /><div className="flex gap-3 w-full"><button onClick={() => setFacilityToDelete(null)} disabled={isDeletingFacility} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button onClick={confirmDeleteFacility} disabled={isDeletingFacility || deleteFacilityInput !== 'delete'} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex justify-center items-center gap-2">{isDeletingFacility && <Loader2 size={14} className="animate-spin"/>} Confirm</button></div></div></div></div>)}
        
        {showPrivacyPolicy && <PrivacyModal onClose={() => setShowPrivacyPolicy(false)} />}
        {showTermsOfUse && <TermsModal onClose={() => setShowTermsOfUse(false)} />}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 flex flex-col md:flex-row items-center gap-4">
            <span>&copy; 2026 Justice Belleza. Independent project.</span>
            <div className="hidden md:block w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowPrivacyPolicy(true)} className="hover:text-zinc-900 hover:underline transition">Privacy Policy</button>
              <button onClick={() => setShowTermsOfUse(true)} className="hover:text-zinc-900 hover:underline transition">Terms of Use</button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500"><span>GitHub Profile →</span><a href="https://github.com/JusticeBelleza" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-100"><Github size={16} /></a></div>
        </div>
      </footer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}