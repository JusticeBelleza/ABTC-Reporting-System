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
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-2">Effective Date: 17 February 2026</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-8 text-sm text-gray-600 leading-relaxed custom-scrollbar">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <AlertTriangle size={20} className="text-rose-500" />
              Section 1 - Zero-Patient-Data Policy
            </h3>
            <p>
              To uphold the highest standard of data privacy, the System operates under a <strong className="text-zinc-900">strict non-collection policy</strong>. It does <strong className="text-rose-600">not</strong> collect, store, or process patient names, addresses, medical histories, or any personally identifiable information (PII).
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              Section 2 - Information Collected
            </h3>
            <p className="mb-4">In adherence to the principle of proportionality under RA 10173, data collection is strictly limited to:</p>
            
            <div className="grid md:grid-cols-2 gap-6 pl-1">
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <strong className="block text-zinc-900 text-xs uppercase tracking-wider mb-3">A. Personnel Information (System Users)</strong>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                  <li>Full name and designation</li>
                  <li>Personal email</li>
                  <li>Work contact number</li>
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
              Section 3 - Use and Disclosure
            </h3>
            <p className="mb-3">
              Data shall be processed solely for accomplishment reports, Animal Bite Treatment Center monitoring, and system security maintenance.
            </p>
            <p className="italic text-gray-500 border-l-2 border-gray-300 pl-4 py-1">
              No personally identifiable information shall be sold, traded, or transferred to outside parties.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <Lock size={20} className="text-amber-500" />
              Section 4 - Security Measures
            </h3>
            <p className="mb-3">The System employs industry-standard security protocols to safeguard data:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong className="text-zinc-900">Encryption:</strong> All data is encrypted at rest and in transit via the platform provider (Supabase).</li>
              <li><strong className="text-zinc-900">Access Control:</strong> Role-based access control (RBAC) ensures that only authorized personnel may access ABTC data.</li>
              <li><strong className="text-zinc-900">Compliance:</strong> The infrastructure provider adheres to SOC2 and HIPAA compliance standards.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <UserCheck size={20} className="text-teal-500" />
              Section 5 - Contact Information (Data Protection)
            </h3>
            <p className="mb-3">For privacy concerns or to exercise rights under RA 10173, contact:</p>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-base font-bold text-zinc-900">Antonio L. Valera, MD</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Assistant Provincial Health Officer</p>
              <p className="text-xs text-gray-500 mt-0.5">Data Protection Officer, Abra Provincial Health Office</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-base text-zinc-900 font-bold mb-3 flex items-center gap-2">
              <History size={20} className="text-purple-500" />
              Section 6 - Data Retention Policy
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong className="text-zinc-900">Statistical data</strong> shall be retained indefinitely for historical public health analysis.</li>
              <li><strong className="text-zinc-900">Personnel data</strong> shall be retained only while the account remains active. Upon resignation or termination of an authorized representative, personal contact details shall be deactivated and purged from the live system within thirty (30) days.</li>
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