import React from 'react';
import { Shield, Lock, FileText, UserCheck } from 'lucide-react';

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
              Effective Date: February 12, 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-8 pr-4 custom-scrollbar">
          
          {/* Preamble */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-xs leading-5">
            <strong>Commitment to Privacy:</strong> The ABTC Reporting System ("System") is committed to protecting the privacy of its users. This policy outlines our data handling practices in compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and strictly adheres to the principle of data minimization.
          </div>

          {/* Section 1 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Lock size={16} className="text-gray-400"/> 1. Zero-Patient Data Policy
            </h3>
            <p className="mb-3">
              To ensure the highest standard of data privacy, this System operates on a <strong>Strict Non-Collection Policy</strong> regarding patient health information (PHI).
            </p>
            <div className="pl-4 border-l-2 border-emerald-500 bg-gray-50 p-3 italic text-gray-700">
              "We do not collect, store, or process Patient Names, Addresses, Medical Histories, or any Personally Identifiable Information (PII) of patients."
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <FileText size={16} className="text-gray-400"/> 2. Information We Collect
            </h3>
            <p className="mb-3">We adhere to the principle of proportionality. Data collection is strictly limited to what is necessary for operational reporting:</p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <h4 className="font-semibold text-zinc-900 text-xs uppercase mb-1">A. Personnel Information</h4>
                <p className="text-xs">Used solely for account management and accountability (Audit Trails).</p>
                <ul className="list-disc pl-4 mt-2 text-xs space-y-1 text-gray-600">
                  <li>Full Name</li>
                  <li>Designation / Job Title</li>
                  <li>Institutional Email Address</li>
                  <li>Work Contact Number</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <h4 className="font-semibold text-zinc-900 text-xs uppercase mb-1">B. Statistical Data</h4>
                <p className="text-xs">Used for epidemiological reporting and resource allocation.</p>
                <ul className="list-disc pl-4 mt-2 text-xs space-y-1 text-gray-600">
                  <li>Aggregated bite counts</li>
                  <li>Vaccine inventory usage</li>
                  <li>Category summaries (Cat I, II, III)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <UserCheck size={16} className="text-gray-400"/> 3. Use and Disclosure of Data
            </h3>
            <p className="mb-2">
              The collected data is processed solely for the following legitimate purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Generating automated accomplishment reports (Monthly/Quarterly/Annual).</li>
              <li>Monitoring facility performance and vaccine utilization.</li>
              <li>System administration and security maintenance.</li>
            </ul>
            <p>
              <strong>Third-Party Disclosure:</strong> We do not sell, trade, or transfer your personally identifiable information to outside parties. Data access is restricted to authorized system administrators and facility heads.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3">4. Security Measures</h3>
            <p>
              We implement industry-standard security measures including encryption-at-rest and encryption-in-transit (via Supabase), Role-Based Access Control (RBAC), and regular security audits to protect against unauthorized access, alteration, or disclosure of data.
            </p>
          </section>

          {/* Section 5 */}
          <section className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-zinc-900 text-base mb-2">5. Contact Information</h3>
            <p className="mb-2">
              For concerns regarding this Privacy Policy or to exercise your rights under the Data Privacy Act (Access, Correction, Erasure), please contact:
            </p>
            <div className="text-sm">
              <p className="font-medium text-zinc-900">Justice Belleza</p>
              <p className="text-gray-500">System Developer</p>
              <a href="mailto:justice.belleza@icloud.com" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors mt-1 inline-block">
                justice.belleza@icloud.com
              </a>
            </div>
          </section>

        </div>
        
        {/* Footer - Centered Button */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}