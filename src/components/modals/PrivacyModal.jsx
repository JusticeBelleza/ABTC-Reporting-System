import React from 'react';
import { Shield, Lock, Eye, FileText, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Shield className="text-emerald-600" size={24} /> 
              Privacy Policy
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">
              Effective Date: February 17, 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-8 pr-4 custom-scrollbar">
          
          {/* Section 1: Zero Data Policy */}
          <div className="bg-rose-50 p-5 rounded-lg border border-rose-100 text-rose-900 shadow-sm">
             <h4 className="font-bold flex items-center gap-2 mb-2 text-rose-700">
                <AlertTriangle size={18} /> 1. Zero-Patient Data Policy
             </h4>
             <p className="text-xs leading-5">
                To ensure the highest standard of data privacy, this System operates on a <strong>Strict Non-Collection Policy</strong>. We do <strong>NOT</strong> collect, store, or process Patient Names, Addresses, Medical Histories, or any Personally Identifiable Information (PII).
             </p>
          </div>

          {/* Section 2: Info We Collect */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600"/> 2. Information We Collect
            </h3>
            <p className="mb-4">
              We adhere to the principle of proportionality. Data collection is strictly limited to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <strong className="text-zinc-900 block mb-2 text-xs uppercase tracking-wider">A. Personnel Info</strong>
                    <ul className="list-disc pl-4 text-xs space-y-1.5 text-gray-500">
                        <li>Full Name & Designation</li>
                        <li>Institutional Email</li>
                        <li>Work Contact Number</li>
                    </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <strong className="text-zinc-900 block mb-2 text-xs uppercase tracking-wider">B. Statistical Data</strong>
                    <ul className="list-disc pl-4 text-xs space-y-1.5 text-gray-500">
                        <li>Aggregated bite counts</li>
                        <li>Vaccine inventory usage</li>
                        <li>Category summaries</li>
                    </ul>
                </div>
            </div>
          </section>

          {/* Section 3: Use & Disclosure */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Eye size={16} className="text-blue-500"/> 3. Use and Disclosure
            </h3>
            <p className="mb-2">
              Data is processed solely for automated accomplishment reports, <strong>Animal Bite Treatment Center (ABTC)</strong> monitoring, and security maintenance.
            </p>
            <p className="text-xs italic text-gray-400 bg-gray-50 p-2 rounded border-l-2 border-gray-200">
              "We do not sell, trade, or transfer your personally identifiable information to outside parties."
            </p>
          </section>

          {/* Section 4: Security Measures */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Lock size={16} className="text-gray-600"/> 4. Security Measures
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                <p className="text-xs"><strong>Encryption:</strong> All data is encrypted-at-rest and encrypted-in-transit via the platform provider (Supabase).</p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
                <p className="text-xs"><strong>Access Control:</strong> Strict Role-Based Access Control (RBAC) ensures only authorized personnel can access <strong>Animal Bite Treatment Center (ABTC)</strong> data.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</div>
                <p className="text-xs"><strong>Compliance:</strong> The infrastructure provider adheres to SOC2 and HIPAA compliance standards.</p>
              </div>
            </div>
          </section>

          {/* Section 5: Contact Information - Simplified */}
          <section className="border-t border-gray-100 pt-6 pb-4">
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <UserCheck size={16} className="text-zinc-900"/> 5. Contact Information
            </h3>
            <p className="mb-4 text-xs">
              For privacy concerns or to exercise your rights under <strong>RA 10173</strong>:
            </p>
            
            <div className="pl-4 border-l-2 border-zinc-200">
              <p className="font-bold text-zinc-900 text-sm">Antonio L. Valera, MD</p>
              <p className="text-xs text-gray-500">Assistant Provincial Health Officer</p>
              <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-widest">
                Data Protection Officer
              </p>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 active:scale-95 transition-all shadow-sm flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Acknowledge
          </button>
        </div>

      </div>
    </div>
  );
}