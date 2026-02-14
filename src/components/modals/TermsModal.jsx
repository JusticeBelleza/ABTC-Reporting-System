import React from 'react';
import { FileCheck, X } from 'lucide-react';

// Added 'export default'
export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><FileCheck size={20}/> Terms of Use</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-6">
           <div>
            <h3 className="font-bold text-gray-900 mb-2">Effective Date: February 12, 2026</h3>
            <p>By accessing or using the ABTC Reporting System, you agree to the following Terms of Use.</p>
          </div>
           <div>
            <h3 className="font-bold text-gray-900 mb-2">1. Authorized Use</h3>
            <p>This system is intended solely for authorized personnel of Animal Bite Treatment Centers (ABTC) and the Provincial Health Office. Unauthorized access is strictly prohibited.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">2. Data Accuracy</h3>
            <p>Users are responsible for the accuracy and completeness of the data submitted through the system.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">3. System Availability</h3>
            <p>While we strive for high availability, the system is provided "as is" and may undergo maintenance or updates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}