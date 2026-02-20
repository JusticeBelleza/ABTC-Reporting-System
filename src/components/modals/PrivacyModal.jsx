import React from 'react';
import { Shield, AlertTriangle, FileText, Eye, Lock, UserCheck, History } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3 tracking-tight">
              <Shield className="w-7 h-7 text-emerald-600" />
              Privacy Policy
            </h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-2">Effective Date: February 17, 2026</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-8 text-sm text-gray-600 leading-relaxed custom-scrollbar">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <AlertTriangle size={20} className="text-rose-500" />
              1. Zero-Patient Data Policy
            </h3>
            <p>
              To ensure the highest standard of data privacy, this System operates on a <strong className="text-zinc-900">Strict Non-Collection Policy</strong>. We do <strong className="text-rose-600">NOT</strong> collect, store, or process Patient Names, Addresses, Medical Histories, or any Personally Identifiable Information (PII).
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              2. Information We Collect
            </h3>
            <p className="mb-4">We adhere to the principle of proportionality under RA 10173. Data collection is strictly limited to:</p>
            
            <div className="grid md:grid-cols-2 gap-6 pl-1">
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <strong className="block text-zinc-900 text-xs uppercase tracking-wider mb-3">A. Personnel Info (Users)</strong>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                  <li>Full Name & Designation</li>
                  <li>Institutional Email</li>
                  <li>Work Contact Number</li>
                </ul>
              </div>
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <strong className="block text-zinc-900 text-xs uppercase tracking-wider mb-3">B. Statistical Data</strong>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                  <li>Aggregated bite counts</li>
                  <li>Vaccine inventory usage</li>
                  <li>Category summaries</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <Eye size={20} className="text-blue-500" />
              3. Use and Disclosure
            </h3>
            <p className="mb-3">
              Data is processed solely for automated accomplishment reports, <strong className="text-zinc-900">Animal Bite Treatment Center</strong> monitoring, and security maintenance.
            </p>
            <p className="italic text-gray-500 border-l-2 border-gray-300 pl-4 py-1">
              We do not sell, trade, or transfer your personally identifiable information to outside parties.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <Lock size={20} className="text-amber-500" />
              4. Security Measures
            </h3>
            <p className="mb-3">The System utilizes industry-standard security protocols to protect your data:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong className="text-zinc-900">Encryption:</strong> All data is encrypted-at-rest and encrypted-in-transit via the platform provider (Supabase).</li>
              <li><strong className="text-zinc-900">Access Control:</strong> Strict Role-Based Access Control (RBAC) ensures only authorized personnel can access <strong className="text-zinc-900">ABTC data</strong>.</li>
              <li><strong className="text-zinc-900">Compliance:</strong> The infrastructure provider adheres to SOC2 and HIPAA compliance standards.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <UserCheck size={20} className="text-teal-500" />
              5. Contact Information (Data Protection)
            </h3>
            <p className="mb-3">For privacy concerns or to exercise your rights under RA 10173:</p>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-base font-bold text-zinc-900">Antonio L. Valera, MD</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Assistant Provincial Health Officer</p>
              <p className="text-xs text-gray-500 mt-0.5">Data Protection Officer (Abra Provincial Health Office)</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <History size={20} className="text-purple-500" />
              6. Data Retention Policy
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong className="text-zinc-900">Statistical Data:</strong> Retained indefinitely for historical public health analysis.</li>
              <li><strong className="text-zinc-900">Personnel Data:</strong> User account information is retained only as long as the account is active. Upon resignation or termination of an authorized representative, their personal contact details will be deactivated and purged from the live system within thirty (30) days.</li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/80 shrink-0 flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98] transition-all"
          >
            Acknowledge
          </button>
        </div>

      </div>
    </div>
  );
}