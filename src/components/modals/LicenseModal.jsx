import React from 'react';
import { Scale, ShieldCheck, Wrench, Ban, CheckCircle, Globe, AlertTriangle } from 'lucide-react';

export default function LicenseModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Scale className="text-indigo-600" size={24} /> 
              Software License
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">
              License Type: Proprietary (Institutional Grant)
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-8 pr-4 custom-scrollbar">
          
          {/* Grant Preamble */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-indigo-900 text-xs leading-5">
            <strong>OFFICIAL GRANT:</strong> This software is expressly provided <strong>FREE OF CHARGE</strong> to the <strong>Abra Provincial Health Office</strong> for use by its authorized Health Facilities. It is a dedicated modernization initiative.
          </div>

          {/* Section 1: Ownership */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-gray-400"/> 1. Ownership & Copyright
            </h3>
            <p>
              The <strong>ABTC Reporting System</strong> (the "Software"), including all source code, database schemas, and design elements, is the proprietary intellectual property of <strong>Justice Belleza</strong>.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              © 2026 Justice Belleza. All Rights Reserved.
            </p>
          </section>

          {/* Section 2: Maintenance & Succession */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Wrench size={16} className="text-emerald-600"/> 2. Maintenance & Succession Rights
            </h3>
            <div className="bg-emerald-50/50 border-l-2 border-emerald-500 p-3 rounded-r-lg">
              <p className="mb-2">
                To ensure the sustainability of public health reporting, <strong>specifically in the event that the Developer's contract is ended or not renewed</strong>, the <strong>Designated IT Officer</strong> of the Abra Provincial Health Office is granted the right to modify and update the Software source code <strong>SOLELY</strong> for:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                <li>Internal maintenance and bug fixing.</li>
                <li>Platform compatibility updates.</li>
                <li>Security patching.</li>
              </ul>
              <p className="mt-2 text-xs font-bold text-emerald-800">
                NOTE: Individual Health Facilities are NOT authorized to modify the source code.
              </p>
            </div>
          </section>

          {/* Section 3: Restrictions */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Ban size={16} className="text-red-500"/> 3. Restrictions
            </h3>
            <p className="mb-2">
              Unless expressly authorized in writing by the Developer, no person or entity may:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sell, sublicense, lease, or rent the Software to any third party.</li>
              <li>Distribute the Software outside the Abra Provincial Health Office network.</li>
              <li>Claim authorship of the Software.</li>
              <li>Use the Software for commercial gain.</li>
            </ul>
          </section>

          {/* Section 4: Disclaimer */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-2">4. Disclaimer of Warranty</h3>
            <p className="text-xs uppercase font-bold text-gray-500 mb-1">Provided "AS IS"</p>
            <p className="italic">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. THE DEVELOPER SHALL NOT BE LIABLE FOR ANY DAMAGES, DATA LOSS, OR REPORTING INACCURACIES ARISING FROM THE USE OF THIS SOFTWARE.
            </p>
          </section>

          {/* Section 5: Jurisdiction */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-2 flex items-center gap-2">
              <Globe size={16} className="text-gray-400"/> 5. Jurisdiction
            </h3>
            <p>
              This License is governed by the laws of the Republic of the Philippines. Disputes regarding intellectual property or usage rights shall be resolved exclusively in the courts of the <strong>Province of Abra</strong>.
            </p>
          </section>

          {/* Section 6: Termination */}
          <section className="border-t border-red-100 pt-6">
            <h3 className="font-bold text-red-900 text-base mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500"/> 6. Termination of Grant
            </h3>
            <p className="text-red-800/80">
              The Developer reserves the right to terminate this License Grant immediately if the Abra Provincial Health Office violates the Restrictions outlined in Section 3, particularly regarding unauthorized distribution or commercial use of the Software.
            </p>
          </section>

        </div>
        
        {/* Footer - Centered Button */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Understood
          </button>
        </div>

      </div>
    </div>
  );
}