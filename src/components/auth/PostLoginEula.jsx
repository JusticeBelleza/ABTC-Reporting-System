import React, { useState } from 'react';
import { ShieldAlert, Check, LogOut, Loader2, ShieldBan, FileWarning, Scale, Database, ServerCrash, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner'; // Upgraded from alert()

export default function PostLoginEula({ onAcceptComplete }) {
  const { user, logout } = useApp(); 
  const [hasConsented, setHasConsented] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
            eula_accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success("Consent recorded successfully.");
      onAcceptComplete();
    } catch (error) {
      console.error("Error saving EULA consent:", error);
      toast.error("Failed to save consent. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Main Modal Card */}
      <div className="bg-white w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 delay-150 border border-slate-200">
        
        {/* Header - Locked to top */}
        <div className="flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 bg-white shrink-0 relative z-10 shadow-sm">
          <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shadow-inner border border-blue-100/50 shrink-0">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Legal Consent Required</h2>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System Protocols & EULA</p>
          </div>
        </div>

        {/* Scrollable Content Area - Contains text AND checkbox */}
        <div className="p-5 sm:p-8 overflow-y-auto bg-slate-50/50 custom-scrollbar flex-1 flex flex-col relative">
          
          <div className="flex items-start gap-3 p-4 sm:p-5 bg-blue-50/80 border border-blue-200/60 rounded-xl mb-6 sm:mb-8 shadow-sm">
             <FileWarning size={22} className="text-blue-600 shrink-0 mt-0.5" />
             <p className="font-semibold text-blue-900 text-sm sm:text-base leading-relaxed">
               Before accessing the provincial health database, you must read and accept the following key data privacy protocols in strict compliance with the Data Privacy Act of 2012 (RA 10173).
             </p>
          </div>

          <div className="space-y-4 mb-6">
            {/* Section 1 */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldBan size={18} className="text-rose-500 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">Section 1 - Zero-Patient-Data Policy</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To uphold the highest standard of data privacy, the System operates under a strict non-collection policy. It does not collect, store, or process patient names, addresses, medical histories, or any personally identifiable information (PII).
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <Scale size={18} className="text-amber-500 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">Section 2 - Strict Prohibition on Patient Data</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                <strong>COMPLIANCE WITH RA 10173:</strong> Users are strictly prohibited from entering Sensitive Personal Information (Patient Names, Addresses, Medical IDs) into any free-text fields.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The Developer and the Abra Provincial Health Office assume no liability for privacy violations resulting from your failure to adhere to this prohibition.
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <Database size={18} className="text-blue-500 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">Section 3 - Intellectual Property</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The ABTC Reporting System ("Software"), including source code and design elements, constitutes the proprietary intellectual property of Justice Belleza. While the source code remains the property of the Developer, all statistical data and database records generated shall be the exclusive property of the Abra Provincial Health Office and the Reporting facilities.
              </p>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <ServerCrash size={18} className="text-indigo-500 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">Section 4 - Data Ownership & Transition</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                In the event that the Developer's contract is terminated, operational costs shall transfer to the Abra Provincial Health Office. The Developer shall transfer the domain and grant full database administrative access to the Office. The Information Technology Office of the Abra Provincial Health Office is granted a limited, perpetual right to access and modify the Software source code solely for internal maintenance, compatibility updates, and security patching.
              </p>
            </div>
          </div>

          {/* Consent Checkbox Area */}
          <div className="mt-auto pt-6 border-t border-slate-200">
            <div className="flex items-start gap-2.5 mb-4 p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
               <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
               <p className="text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed">
                 <strong>Note:</strong> This is a summary of key protocols. The complete text of the Privacy Policy, Terms of Use, and License Agreement is accessible at the bottom of your Dashboard for reference at any time.
               </p>
            </div>

            {/* Enhanced Accessibility Label & Checkbox */}
            <label className="flex items-start gap-3 sm:gap-4 cursor-pointer group p-4 sm:p-5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm transition-all">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input 
                  type="checkbox" 
                  checked={hasConsented}
                  onChange={() => setHasConsented(!hasConsented)}
                  className="peer appearance-none w-5 h-5 sm:w-6 sm:h-6 border-2 border-slate-300 rounded shadow-sm hover:border-blue-500 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer outline-none"
                />
                <Check size={16} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm sm:text-base font-bold text-slate-700 leading-snug select-none group-hover:text-slate-900 transition-colors">
                I have read, understood, and agree to strictly abide by the Zero-Patient Data Policy, Privacy Policy, and Terms of Use.
              </span>
            </label>
          </div>

        </div>
        
        {/* Action Buttons - Locked to bottom */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-sm font-bold rounded-xl transition-all active:scale-95 order-2 sm:order-1"
          >
            <LogOut size={16} strokeWidth={2.5} /> Decline & Logout
          </button>

          <button 
            onClick={handleAccept}
            disabled={!hasConsented || isSubmitting}
            className={`flex items-center justify-center min-w-[140px] w-full sm:w-auto gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all order-1 sm:order-2
              ${hasConsented 
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 cursor-pointer' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
            {isSubmitting ? (
               <><Loader2 size={18} className="animate-spin" /> Recording...</>
            ) : (
               <>I Accept & Continue</>
            )}
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}