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
import LicenseModal from '../modals/LicenseModal'; 
import ErrorBoundary from '../ErrorBoundary';

function DashboardContent() {
  const { user, facilities, setFacilities, setFacilityBarangays, logout, globalSettings, setGlobalSettings, userProfile, setUserProfile } = useApp();

  // Date State
  const currentDate = useMemo(() => new Date(), []);
  const currentRealYear = currentDate.getFullYear();

  // --- UPDATED YEAR LOGIC: Start from 2026 ---
  const availableYears = useMemo(() => {
    const startYear = 2026;
    const years = [];
    const endYear = currentRealYear < startYear ? startYear : currentRealYear;
    
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [currentRealYear]);
  
  const [year, setYear] = useState(currentRealYear < 2026 ? 2026 : currentRealYear);
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
  const [showLicense, setShowLicense] = useState(false); 
  const [showLogoutModal, setShowLogoutModal] = useState(false); 
  
  // Facility Deletion State (Master Data)
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [deleteFacilityInput, setDeleteFacilityInput] = useState('');
  const [isDeletingFacility, setIsDeletingFacility] = useState(false);

  // Admin Actions: Add Facility
  const handleAddFacility = async (name, type, barangaysList, municipality, ownership) => {
    if (facilities.includes(name)) { toast.error('Name exists'); return; }
    try {
      // Parse the list into a proper JavaScript Array
      let bArray = barangaysList ? barangaysList.split(',').map(b => b.trim()).filter(b => b) : [];
      
      const payload = { 
          name, 
          type, 
          barangays: bArray,
          municipality: municipality || null, 
          catchment_area: bArray.length > 0 ? bArray : null, 
          ownership: ownership 
      };

      const { error } = await supabase.from('facilities').insert(payload);
      
      if (error) throw error;
      
      setFacilities(prev => [...prev, name]);
      if (bArray.length > 0) setFacilityBarangays(prev => ({ ...prev, [name]: bArray }));
      
      toast.success("Facility added successfully!"); 
      setShowAddFacilityModal(false);
    } catch (err) { 
      toast.error(err.message); 
      console.error("Supabase Insert Error:", err);
    }
  };

  // Admin Actions: Delete Facility
  const confirmDeleteFacility = async () => {
    if (deleteFacilityInput !== 'delete') { toast.error('Type "delete"'); return; }
    setIsDeletingFacility(true);
    try {
        await supabase.from('abtc_reports').delete().eq('facility', facilityToDelete);
        await supabase.from('abtc_cohort_reports').delete().eq('facility', facilityToDelete);
        await supabase.from('facilities').delete().eq('name', facilityToDelete);
        
        setFacilities(prev => prev.filter(f => f !== facilityToDelete));
        toast.success("Facility Deleted"); 
        setFacilityToDelete(null);
    } catch (err) { toast.error(err.message); }
    setIsDeletingFacility(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 text-yellow-400 p-1.5 rounded-lg shadow-inner"><FileText size={18} strokeWidth={2.5}/></div>
             <span className="font-bold tracking-tight text-sm md:text-lg text-slate-800">ABTC-Reporting System</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            
            <NotificationBell user={user} />
            
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            
            {/* Profile Group */}
            <div 
                className="flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 active:scale-95 transition-all duration-300 group" 
                onClick={() => setShowProfileModal(true)}
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold leading-none text-slate-700 group-hover:text-slate-900 transition-colors">
                    {userProfile?.full_name || user.fullName || user.name}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1 group-hover:text-slate-600 transition-colors">
                    {user.role}
                </div>
              </div>
              <div className="bg-slate-100 p-2 rounded-full text-slate-500 group-hover:bg-slate-900 group-hover:text-yellow-400 shadow-sm transition-colors">
                  <User size={16} strokeWidth={2.5}/>
              </div>
            </div>
            
            {/* Settings Button */}
            <button 
                onClick={() => setShowSettingsModal(true)} 
                className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 active:scale-90 p-2 rounded-xl transition-all duration-300"
                title="Settings"
            >
                <Settings size={20} strokeWidth={2.5} />
            </button>
            
            {/* Logout Button */}
            <button 
                onClick={() => setShowLogoutModal(true)} 
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 p-2 rounded-xl transition-all duration-300 ml-1"
                title="Logout"
            >
                <LogOut size={20} strokeWidth={2.5} />
            </button>
            
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
          />
        )}

        {/* --- MODALS --- */}
        {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} globalSettings={globalSettings} onSaveGlobal={setGlobalSettings} userProfile={userProfile} onSaveProfile={setUserProfile} isAdmin={user.role === 'admin'} />}
        
        {/* Pass adminHelperClient here to prevent session overwrites during user creation */}
        {showManageUsers && <UserManagementModal onClose={() => setShowManageUsers(false)} facilities={facilities} client={adminHelperClient} />}
        
        {showProfileModal && <ProfileModal userId={user.id} onClose={() => setShowProfileModal(false)} isSelf={true} />}
        
        {/* --- FIXED ADD FACILITY MODAL --- */}
        {showAddFacilityModal && (
            <AddFacilityForm 
                onAdd={handleAddFacility} 
                loading={false} 
                facilities={facilities} 
                onClose={() => setShowAddFacilityModal(false)} 
            />
        )}
        
        {/* Delete Facility Modal */}
        {facilityToDelete && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-50 p-4 rounded-full mb-5 text-red-600 shadow-inner">
                            <AlertTriangle size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Delete Facility?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            This will remove <strong className="text-slate-900">{facilityToDelete}</strong> and <strong>ALL</strong> associated reports permanently. Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">delete</span> to confirm.
                        </p>
                        <input 
                            type="text" 
                            value={deleteFacilityInput} 
                            onChange={(e) => setDeleteFacilityInput(e.target.value)} 
                            className="w-full border border-slate-300 rounded-xl p-3 mb-5 text-center text-sm font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm" 
                            placeholder='Type "delete"' 
                            autoFocus 
                        />
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setFacilityToDelete(null)} disabled={isDeletingFacility} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={confirmDeleteFacility} disabled={isDeletingFacility || deleteFacilityInput !== 'delete'} className="flex-1 py-3 sm:py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isDeletingFacility && <Loader2 size={16} className="animate-spin"/>} Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- LOGOUT CONFIRMATION MODAL --- */}
        {showLogoutModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-rose-50 p-4 rounded-full mb-5 text-rose-600 shadow-inner">
                            <LogOut size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Log Out?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to log out of your account? You will need to sign in again to access the system.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button 
                                onClick={() => setShowLogoutModal(false)} 
                                className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={logout} 
                                className="flex-1 py-3 sm:py-2.5 px-4 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {showPrivacyPolicy && <PrivacyModal onClose={() => setShowPrivacyPolicy(false)} />}
        {showTermsOfUse && <TermsModal onClose={() => setShowTermsOfUse(false)} />}
        {showLicense && <LicenseModal onClose={() => setShowLicense(false)} />} 
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500 font-medium flex flex-col md:flex-row items-center gap-4">
            <span>&copy; 2026 Justice Belleza. All Rights Reserved.</span>
            <div className="hidden md:block w-px h-3 bg-slate-300"></div>
            <div className="flex items-center gap-4 font-semibold">
              <button onClick={() => setShowPrivacyPolicy(true)} className="hover:text-slate-900 hover:underline transition">Privacy Policy</button>
              <button onClick={() => setShowTermsOfUse(true)} className="hover:text-slate-900 hover:underline transition">Terms of Use</button>
              <button onClick={() => setShowLicense(true)} className="hover:text-slate-900 hover:underline transition">License</button> 
              <a href="/images/System_Manual.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 hover:underline transition">User Manual</a>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span>GitHub Profile &rarr;</span>
              <a href="https://github.com/JusticeBelleza" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all p-1.5 rounded-full active:scale-90">
                  <Github size={18} strokeWidth={2.5} />
              </a>
          </div>
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