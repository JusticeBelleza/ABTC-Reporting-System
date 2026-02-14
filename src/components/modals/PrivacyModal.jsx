import React from 'react';
import { Shield, X } from 'lucide-react';

// Added 'export default'
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
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">1. Information Collection</h3>
            <p>We collect minimal information required for the operation of the rabies reporting facility, including facility names, authorized user accounts, and aggregated patient statistics.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">2. Use of Information</h3>
            <p>Data is used solely for the purpose of generating consolidated reports for the Provincial Health Office. No personal patient information (PII) is exposed to unauthorized users.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">3. Data Security</h3>
            <p>We implement appropriate technical and organizational measures to protect the stored data against unauthorized access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}