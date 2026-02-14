import React from 'react';
import { FileCheck, X } from 'lucide-react';

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
            <h3 className="font-bold text-gray-900 mb-2">1. Acceptable & Prohibited Use</h3>
            <p>Users agree to use the system only for intended reporting purposes, provide accurate information, and maintain the strict confidentiality of their account credentials.</p>
            <p className="mt-2 font-medium">Users must not:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Input patient-identifiable data or sensitive personal information in violation of the Data Privacy Act of 2012.</li>
                <li>Attempt unauthorized access, "hacking," or any form of system data misuse.</li>
                <li>Use the system for any illegal activities or unauthorized disclosure of aggregated health data.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">2. Data Responsibility</h3>
            <p>In compliance with the Data Privacy Act of 2012, users are solely responsible for ensuring that no confidential patient information is entered into the system. The ABTC Reporting System and its developer assume no liability for any sensitive personal data entered in violation of these terms or applicable privacy laws.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">3. Intellectual Property</h3>
            <p>© 2026 Justice Belleza. This is an independent project. Use of the system does not grant any ownership rights to the users or their respective facilities.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">4. Availability and Liability</h3>
            <p>The system is provided “as is” without warranties of any kind. The developer shall not be held liable for data inaccuracies, system downtime, or any loss arising from the misuse of the application.</p>
          </div>
           <div>
            <h3 className="font-bold text-gray-900 mb-2">5. Contact</h3>
            <p>For inquiries regarding these terms: <a href="mailto:justice.belleza@icloud.com" className="text-blue-600 hover:underline">justice.belleza@icloud.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}