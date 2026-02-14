import React from 'react';
import { Shield, X } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><Shield size={20}/> Privacy Policy</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-6">
           <div>
            <h3 className="font-bold text-gray-900 mb-2">Effective Date: February 12, 2026</h3>
            <p>
              The ABTC Reporting System respects user privacy and is committed to protecting any personal information 
              collected through the system in accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>. 
              This Privacy Policy explains what information is collected, how it is used, and how it is protected.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">1. Information We Collect</h3>
            <p>The ABTC Reporting System <strong>does not collect patient-identifiable data</strong>. In compliance with transparency principles, the system only collects the following information for operational and reporting purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Aggregated Case Data:</strong> Number of animal bite cases, statistical summaries, and non-identifiable figures.</li>
                <li><strong>User / Employee Information:</strong> Full name, designation, email address, and contact number.</li>
            </ul>
            <p className="mt-2">No patient names, addresses, medical records, or personally identifiable health information are collected or stored.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">2. Purpose of Data Collection</h3>
            <p>The collected information is processed solely to generate reports, identify responsible personnel, support administration, and improve system reliability. All data processing is conducted for legitimate purposes and is not used for marketing or commercial advertising.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">3. Data Sharing and Security</h3>
            <p>The ABTC Reporting System does not sell, share, or disclose data to third parties. Access is strictly limited to authorized users. In line with the Data Privacy Act of 2012, reasonable technical and organizational measures are implemented to protect information against unauthorized access or processing, though no system can guarantee absolute security.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">4. Contact</h3>
            <p>For questions regarding this Privacy Policy or to exercise your rights under the Data Privacy Act of 2012, please contact: <a href="mailto:justice.belleza@icloud.com" className="text-blue-600 hover:underline">justice.belleza@icloud.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}