import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FileText, LogOut, User, Settings, Github, AlertTriangle, X, PlusCircle, Loader2, LayoutDashboard, PieChart, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import { supabase, adminHelperClient } from '../../lib/supabase';
import { MONTHS } from '../../lib/constants';
import { useApp } from '../../context/AppContext';
import ModalPortal from '../modals/ModalPortal';
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
import AuditLogsModal from '../modals/AuditLogsModal'; 
import ErrorBoundary from '../ErrorBoundary';
import AnalyticsOverview from '../reports/AnalyticsOverview'; 
import PostLoginEula from '../auth/PostLoginEula';
import UserManualModal from '../modals/ResourcesModal.jsx';
import DashboardSkeleton from '../common/DashboardSkeleton';
import packageInfo from '../../../package.json';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

const getRoleDisplayName = (role) => {
    if (role === 'SYSADMIN') return 'System Admin';
    if (role === 'admin') return 'Administrator';
    if (role === 'user') return 'Facility Encoder';
    return role || '';
};

function DashboardContent() {
  const { user, facilities, setFacilities, setFacilityBarangays, logout, globalSettings, setGlobalSettings, userProfile, setUserProfile } = useApp();

  const isAnyAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  // ==========================================
  // EULA / LEGAL CONSENT VERIFICATION
  // ==========================================
  const [needsConsent, setNeedsConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);

  useEffect(() => {
    async function verifyLegalConsent() {
      if (!user) {
        setCheckingConsent(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('eula_accepted_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (!data?.eula_accepted_at) {
          setNeedsConsent(true);
        }
      } catch (error) {
        console.error('Error verifying EULA consent:', error);
      } finally {
        setCheckingConsent(false);
      }
    }

    verifyLegalConsent();
  }, [user]);

  // ==========================================
  // AUTO-LOGOUT / SESSION TIMEOUT LOGIC
  // ==========================================
  const timeoutIdRef = useRef(null);
  const INACTIVITY_LIMIT = 3 * 60 * 60 * 1000; // 3 hours

  const resetTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = setTimeout(() => {
      toast.error("Session expired due to inactivity. Please log in again.", { duration: 6000 });
      logout();
    }, INACTIVITY_LIMIT);
  }, [logout]);

  useEffect(() => {
    resetTimeout();
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    let throttleTimer;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetTimeout();
        throttleTimer = null;
      }, 1000); 
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimeout]);
  // ==========================================

  const [serverDate, setServerDate] = useState(new Date()); 
  const [liveTime, setLiveTime] = useState(new Date());
  
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const { data, error } = await supabase.rpc('get_server_time');
        if (data && !error) {
          const authoritativeDate = new Date(data);
          setServerDate(authoritativeDate);
          setLiveTime(authoritativeDate); 
          
          const sYear = authoritativeDate.getFullYear();
          const sMonth = MONTHS[authoritativeDate.getMonth()];
          
          setYear(prev => {
             const clientYear = new Date().getFullYear();
             return (prev === clientYear || prev < 2026) ? (sYear < 2026 ? 2026 : sYear) : prev;
          });
          setMonth(prev => prev === MONTHS[new Date().getMonth()] ? sMonth : prev);
        }
      } catch (err) {
        console.warn("Time sync fallback to local machine clock.");
      }
    };
    fetchServerTime();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedPHT = liveTime.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
  });

  const currentRealYear = serverDate.getFullYear();
  const currentRealMonthIdx = serverDate.getMonth();

  const availableYears = useMemo(() => {
    const startYear = 2026;
    const years = [];
    const endYear = currentRealYear < startYear ? startYear : currentRealYear;
    for (let y = startYear; y <= endYear; y++) { years.push(y); }
    return years;
  }, [currentRealYear]);
  
  const [year, setYear] = useState(currentRealYear < 2026 ? 2026 : currentRealYear);
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[currentRealMonthIdx]);
  const [quarter, setQuarter] = useState("1st Quarter");
  const availableMonths = useMemo(() => (
    year === currentRealYear ? MONTHS.slice(0, currentRealMonthIdx + 1) : MONTHS
  ), [year, currentRealYear, currentRealMonthIdx]);

  const [activeNav, setActiveNav] = useState('dashboard');
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [showLicense, setShowLicense] = useState(false); 
  const [showLogoutModal, setShowLogoutModal] = useState(false); 
  const [showAuditLogs, setShowAuditLogs] = useState(false); 
  const [showUserManual, setShowUserManual] = useState(false); 
  
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [deleteFacilityInput, setDeleteFacilityInput] = useState('');
  const [isDeletingFacility, setIsDeletingFacility] = useState(false);

  const handleAddFacility = async (name, type, barangaysList, municipality, ownership) => {
    if (facilities.includes(name)) { toast.error('Facility name already exists'); return; }
    try {
      let bArray = barangaysList ? barangaysList.split(',').map(b => b.trim()).filter(b => b) : [];
      const payload = { name, type, barangays: bArray, municipality: municipality || null, catchment_area: bArray.length > 0 ? bArray : null, ownership };
      const { error } = await supabase.from('facilities').insert(payload);
      if (error) throw error;
      setFacilities(prev => [...prev, name]);
      if (bArray.length > 0) setFacilityBarangays(prev => ({ ...prev, [name]: bArray }));
      toast.success("Facility added successfully!"); 
      setShowAddFacilityModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const confirmDeleteFacility = async () => {
    if (deleteFacilityInput !== 'delete') { toast.error('Please type "delete" to confirm'); return; }
    setIsDeletingFacility(true);
    try {
        await supabase.from('abtc_reports_v2').delete().eq('facility', facilityToDelete);
        
        await supabase.from('facilities').delete().eq('name', facilityToDelete);
        
        await supabase.from('profiles').update({ facility_name: null }).eq('facility_name', facilityToDelete);

        setFacilities(prev => prev.filter(f => f !== facilityToDelete));
        toast.success("Facility and reports deleted successfully."); 
        setFacilityToDelete(null);
    } catch (err) { toast.error(err.message); }
    setIsDeletingFacility(false);
  };

  if (checkingConsent) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      
      {needsConsent && <PostLoginEula onAcceptComplete={() => setNeedsConsent(false)} />}

      {/* --- HEADER --- */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print transition-all duration-300 shadow-sm shrink-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-8 py-2 sm:py-3 flex items-center justify-between relative min-h-[52px] sm:min-h-[72px]">
          
          {/* LEFT: LOGO, TITLE, AND DATE/TIME */}
          <div className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="bg-slate-900 text-yellow-400 p-1.5 sm:p-2 rounded-xl shadow-lg group-hover:rotate-3 transition-transform duration-300">
              <FileText size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5}/>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-black tracking-tight text-xs sm:text-base text-slate-900 leading-none uppercase truncate">ABTC</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate leading-tight">Reporting System</span>
              
              {/* TRANSFERRED DATE/TIME HERE WITHOUT BORDER */}
              <div className="hidden sm:flex items-center gap-1.5 mt-1" title="Philippine Standard Time (Server Synced)">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)] shrink-0"></div>
                <span className="text-[9px] font-bold text-emerald-700 tracking-wide uppercase whitespace-nowrap">{formattedPHT}</span>
              </div>
            </div>
          </div>

          {/* MIDDLE: NAV BUTTONS */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner absolute left-1/2 -translate-x-1/2">
            <button onClick={() => setActiveNav('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeNav === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>
              <LayoutDashboard size={16} strokeWidth={2.5} /> Dashboard
            </button>
            <button onClick={() => setActiveNav('reports')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeNav === 'reports' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>
              <PieChart size={16} strokeWidth={2.5} /> Analytics
            </button>
          </div>

          {/* RIGHT: PROFILE AND ACTION MENU */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
            
            <div onClick={() => setShowProfileModal(true)} className="hidden md:flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 pr-1 py-1 bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-400 active:scale-95 transition-all duration-300 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[120px]">{userProfile?.full_name || 'User'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{getRoleDisplayName(user?.role)}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 flex items-center justify-center text-yellow-400 text-[9px] sm:text-[10px] font-black ring-2 ring-slate-100 group-hover:ring-yellow-400 transition-all">
                {getInitials(userProfile?.full_name || user?.email)}
              </div>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
              <NotificationBell user={user} />
              
              {isAnyAdmin && (
                <>
                  <div className="hidden md:block w-px h-3 sm:h-4 bg-slate-300 mx-0.5"></div>
                  <button onClick={() => setShowAuditLogs(true)} className="hidden md:flex p-1.5 text-slate-500 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300 active:scale-90" title="System Audit Logs">
                    <ClipboardList size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  </button>
                </>
              )}
              
              <div className="hidden md:block w-px h-3 sm:h-4 bg-slate-300 mx-0.5"></div>

              <button onClick={() => setShowSettingsModal(true)} className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-300 active:scale-90" title="System Settings">
                <Settings size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
              </button>
              
              <div className="w-px h-3 sm:h-4 bg-slate-300 mx-0.5"></div>
              
              <button onClick={() => setShowLogoutModal(true)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:-translate-y-0.5 transition-all duration-300 active:scale-90" title="Log Out">
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 sm:p-4 md:p-8 relative z-0 pb-24 md:pb-8" id="report-content">
        {activeNav === 'reports' ? (
           <AnalyticsOverview 
              periodType={periodType} setPeriodType={setPeriodType}
              year={year} setYear={setYear} month={month} setMonth={setMonth}
              quarter={quarter} setQuarter={setQuarter}
              availableYears={availableYears} availableMonths={availableMonths}
           />
        ) : (
          isAnyAdmin && adminViewMode === 'dashboard' ? (
            <AdminDashboard 
              onViewConsolidated={() => setAdminViewMode('consolidated')}
              onSelectFacility={(f) => { setSelectedFacility(f); setAdminViewMode('review'); }}
              onManageUsers={() => setShowManageUsers(true)}
              onAddFacility={() => setShowAddFacilityModal(true)}
              periodType={periodType} setPeriodType={setPeriodType}
              year={year} setYear={setYear} month={month} setMonth={setMonth}
              quarter={quarter} setQuarter={setQuarter}
              availableYears={availableYears} availableMonths={availableMonths}
              initiateDeleteFacility={(f) => { setFacilityToDelete(f); setDeleteFacilityInput(''); }}
              currentRealYear={currentRealYear} currentRealMonthIdx={currentRealMonthIdx}
            />
          ) : (
            <FacilityDashboard 
              periodType={periodType} setPeriodType={setPeriodType}
              year={year} setYear={setYear} month={month} setMonth={setMonth}
              quarter={quarter} setQuarter={setQuarter}
              availableYears={availableYears} availableMonths={availableMonths}
              adminViewMode={adminViewMode} selectedFacility={selectedFacility}
              onBack={() => { setAdminViewMode('dashboard'); setSelectedFacility(null); }}
              currentRealYear={currentRealYear} currentRealMonthIdx={currentRealMonthIdx}
            />
          )
        )}

        {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} globalSettings={globalSettings} onSaveGlobal={setGlobalSettings} userProfile={userProfile} onSaveProfile={setUserProfile} isAdmin={isAnyAdmin} />}
        {showManageUsers && <UserManagementModal onClose={() => setShowManageUsers(false)} facilities={facilities} client={adminHelperClient} />}
        {showProfileModal && <ProfileModal userId={user.id} onClose={() => setShowProfileModal(false)} isSelf={true} />}
        {showAddFacilityModal && <AddFacilityForm onAdd={handleAddFacility} loading={false} facilities={facilities} onClose={() => setShowAddFacilityModal(false)} />}
        {showAuditLogs && <AuditLogsModal onClose={() => setShowAuditLogs(false)} />}
        {showUserManual && <UserManualModal onClose={() => setShowUserManual(false)} />} 
        
        {facilityToDelete && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-50 p-4 rounded-full mb-5 text-red-600 shadow-inner"><AlertTriangle size={32} strokeWidth={2.5} /></div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Delete Facility?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">This will remove <strong className="text-slate-900">{facilityToDelete}</strong> and <strong>ALL</strong> associated reports permanently. Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">delete</span> to confirm.</p>
                        <input type="text" value={deleteFacilityInput} onChange={(e) => setDeleteFacilityInput(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 mb-5 text-center text-sm font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm" placeholder='Type "delete"' autoFocus />
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setFacilityToDelete(null)} disabled={isDeletingFacility} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">Cancel</button>
                            <button onClick={confirmDeleteFacility} disabled={isDeletingFacility || deleteFacilityInput !== 'delete'} className="flex-1 py-3 sm:py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2 disabled:opacity-50">
                                {isDeletingFacility && <Loader2 size={16} className="animate-spin"/>} Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </ModalPortal>
        )}

        {showLogoutModal && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-rose-50 p-4 rounded-full mb-5 text-rose-600 shadow-inner"><LogOut size={32} strokeWidth={2.5} /></div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Log Out?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">Are you sure you want to log out of your account?</p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">Cancel</button>
                            <button onClick={logout} className="flex-1 py-3 sm:py-2.5 px-4 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2">Log Out</button>
                        </div>
                    </div>
                </div>
            </div>
          </ModalPortal>
        )}
        
        {showPrivacyPolicy && <PrivacyModal onClose={() => setShowPrivacyPolicy(false)} />}
        {showTermsOfUse && <TermsModal onClose={() => setShowTermsOfUse(false)} />}
        {showLicense && <LicenseModal onClose={() => setShowLicense(false)} />} 
      </main>

      <footer className="w-full py-4 md:py-8 px-4 md:px-8 bg-slate-50 no-print shrink-0 border-t border-slate-200/60 pb-20 md:pb-8">
        <div className="max-w-[1600px] mx-auto flex justify-center">
          
          {/* MOBILE FOOTER: Clean, Minimalist Text & Links (< md) */}
          <div className="md:hidden flex flex-col items-center text-center gap-2 w-full text-slate-500 py-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-bold tracking-wider text-slate-700">© 2026 JUSTICE BELLEZA</span>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] font-medium text-slate-400">v{packageInfo.version}</span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <button onClick={() => setShowPrivacyPolicy(true)} className="hover:text-slate-900 active:scale-95 transition-all">Privacy</button>
              <span>·</span>
              <button onClick={() => setShowTermsOfUse(true)} className="hover:text-slate-900 active:scale-95 transition-all">Terms</button>
              <span>·</span>
              <button onClick={() => setShowLicense(true)} className="hover:text-slate-900 active:scale-95 transition-all">License</button>
              <span>·</span>
              <button onClick={() => setShowUserManual(true)} className="hover:text-slate-900 active:scale-95 transition-all">Resources</button>
              <span>·</span>
              <a href="https://github.com/JusticeBelleza" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 inline-flex items-center gap-1 active:scale-95 transition-all text-slate-600" title="Github Profile">
                <Github size={11} strokeWidth={2.5}/>
              </a>
            </div>
          </div>

          {/* DESKTOP FOOTER: Sleek Floating Pill (>= md) */}
          <div className="hidden md:flex bg-slate-900/95 text-slate-400 px-8 py-3 rounded-full shadow-xl border border-slate-800 items-center gap-6 w-fit transition-all hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black whitespace-nowrap tracking-wider text-slate-300">© 2026 JUSTICE BELLEZA. ALL RIGHTS RESERVED.</span>
              </div>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
              <button onClick={() => setShowPrivacyPolicy(true)} className="text-[10px] font-bold uppercase tracking-widest hover:text-yellow-400 active:scale-95 transition-all">Privacy</button>
              <button onClick={() => setShowTermsOfUse(true)} className="text-[10px] font-bold uppercase tracking-widest hover:text-yellow-400 active:scale-95 transition-all">Terms</button>
              <button onClick={() => setShowLicense(true)} className="text-[10px] font-bold uppercase tracking-widest hover:text-yellow-400 active:scale-95 transition-all">License</button>
              <button onClick={() => setShowUserManual(true)} className="text-[10px] font-bold uppercase tracking-widest hover:text-yellow-400 active:scale-95 transition-all">Resources</button>
              <span className="text-[10px] font-bold text-slate-500 tracking-widest cursor-default">ABTC-RS v.{packageInfo.version}</span>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <a href="https://github.com/JusticeBelleza" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-xl text-yellow-400 hover:text-white hover:bg-slate-700 active:scale-90 transition-all shadow-inner group" title="Github Profile"><Github size={14} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform"/></a>
          </div>

        </div>
      </footer>

      {/* --- MOBILE BOTTOM NAVIGATION DOCK (< md) --- */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] no-print flex items-center justify-around"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <button 
          type="button"
          onClick={() => setActiveNav('dashboard')} 
          className="flex flex-col items-center justify-center flex-1 py-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:scale-95 transition-transform select-none border-none bg-transparent"
          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
        >
          <div className={`w-9 h-6 rounded-full flex items-center justify-center transition-all ${activeNav === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
            <LayoutDashboard size={18} strokeWidth={activeNav === 'dashboard' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] leading-tight mt-0.5 tracking-tight ${activeNav === 'dashboard' ? 'text-blue-700 font-black' : 'text-slate-500 font-semibold'}`}>Dashboard</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveNav('reports')} 
          className="flex flex-col items-center justify-center flex-1 py-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:scale-95 transition-transform select-none border-none bg-transparent"
          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
        >
          <div className={`w-9 h-6 rounded-full flex items-center justify-center transition-all ${activeNav === 'reports' ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
            <PieChart size={18} strokeWidth={activeNav === 'reports' ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] leading-tight mt-0.5 tracking-tight ${activeNav === 'reports' ? 'text-blue-700 font-black' : 'text-slate-500 font-semibold'}`}>Analytics</span>
        </button>

        {isAnyAdmin ? (
          <button 
            type="button"
            onClick={() => setShowAuditLogs(true)} 
            className="flex flex-col items-center justify-center flex-1 py-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:scale-95 transition-transform select-none border-none bg-transparent text-slate-500 hover:text-slate-800"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
          >
            <div className="w-9 h-6 rounded-full flex items-center justify-center text-slate-400">
              <ClipboardList size={18} strokeWidth={2} />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 tracking-tight font-semibold">Audit</span>
          </button>
        ) : (
          <button 
            type="button"
            onClick={() => setShowUserManual(true)} 
            className="flex flex-col items-center justify-center flex-1 py-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:scale-95 transition-transform select-none border-none bg-transparent text-slate-500 hover:text-slate-800"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
          >
            <div className="w-9 h-6 rounded-full flex items-center justify-center text-slate-400">
              <FileText size={18} strokeWidth={2} />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 tracking-tight font-semibold">Resources</span>
          </button>
        )}

        <button 
          type="button"
          onClick={() => setShowSettingsModal(true)} 
          className="flex flex-col items-center justify-center flex-1 py-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:scale-95 transition-transform select-none border-none bg-transparent text-slate-500 hover:text-slate-800"
          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
        >
          <div className="w-9 h-6 rounded-full flex items-center justify-center text-slate-400">
            <Settings size={18} strokeWidth={2} />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 tracking-tight font-semibold">Settings</span>
        </button>

        <button 
          type="button"
          onClick={() => setShowProfileModal(true)} 
          className="flex flex-col items-center justify-center flex-1 py-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:scale-95 transition-transform select-none border-none bg-transparent text-slate-500 hover:text-slate-800"
          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
        >
          <div className="w-9 h-6 rounded-full flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center text-[8px] font-black ring-1 ring-slate-300">
              {getInitials(userProfile?.full_name || user?.email)}
            </div>
          </div>
          <span className="text-[10px] leading-tight mt-0.5 tracking-tight font-semibold">Profile</span>
        </button>
      </nav>
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
