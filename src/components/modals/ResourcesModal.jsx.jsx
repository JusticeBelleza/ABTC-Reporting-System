import React from 'react';
import { X, FolderOpen, Download, FileText, Presentation, FileSpreadsheet } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function ResourcesModal({ onClose }) {
  const resources = [
    {
      id: 1,
      title: "Guide on Animal Bite and Rabies Report Form",
      description: "Official guidelines on how to correctly fill out the Animal Bite and Rabies Report Form.",
      icon: FileText,
      iconBg: "bg-red-50 text-red-600 border-red-100", 
      filename: "Guide on Animal Bite and Rabies Report Form.pdf",
      path: "/forms/Guide on Animal Bite and Rabies Report Form.pdf",
      type: "PDF Document"
    },
    {
      id: 2,
      title: "Rabies PEP Decision Tree",
      description: "Standardized flowchart for assessing patient exposure and determining the correct Post-Exposure Prophylaxis (PEP).",
      icon: Presentation,
      iconBg: "bg-orange-50 text-orange-600 border-orange-100", 
      filename: "Rabies PEP Decision Tree.pptx",
      path: "/forms/Rabies PEP Decision Tree.pptx",
      type: "PowerPoint Presentation"
    },
    {
      id: 3,
      title: "Potential Rabies Exposure Registry (PDF Format)",
      description: "Printable registry template for daily logging of animal bite patients before aggregation.",
      icon: FileText,
      iconBg: "bg-red-50 text-red-600 border-red-100", 
      filename: "Potential Rabies Exposure Registry for ABTC_ABC.pdf",
      path: "/forms/Potential Rabies Exposure Registry for ABTC_ABC.pdf",
      type: "PDF Document"
    },
    {
      id: 4,
      title: "Potential Rabies Exposure Registry (Excel Format)",
      description: "Digital spreadsheet registry template for daily logging of animal bite patients before aggregation.",
      icon: FileSpreadsheet,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", 
      filename: "Potential Rabies Exposure Registry for ABTC_ABC.xlsx",
      path: "/forms/Potential Rabies Exposure Registry for ABTC_ABC.xlsx",
      type: "Excel Spreadsheet"
    }
  ];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-100">

          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 text-yellow-400 shadow-sm shrink-0">
                <FolderOpen size={16} strokeWidth={2.5}/>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">System Resources</h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500">Download official guidelines and templates</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Content / Resource List */}
          <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 bg-white">
             <div className="grid grid-cols-1 gap-3">
                {resources.map((res) => {
                   const Icon = res.icon;
                   return (
                      <div key={res.id} className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group bg-slate-50/50">
                         <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-sm transition-transform group-hover:scale-105 ${res.iconBg}`}>
                            <Icon size={20} strokeWidth={2} />
                         </div>
                         
                         <div className="flex-1 flex flex-col justify-center">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 group-hover:text-blue-700 transition-colors">{res.title}</h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed mb-2">{res.description}</p>
                            <div className="flex items-center gap-2 mt-auto">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                                  {res.type}
                               </span>
                            </div>
                         </div>
                         
                         <div className="flex items-center sm:justify-end shrink-0 mt-2 sm:mt-0">
                            {/* FIX APPLIED HERE: encodeURI(res.path) safely handles the spaces for iPhones! */}
                            <a
                              href={encodeURI(res.path)}
                              download={res.filename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 px-3 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Download size={14} strokeWidth={2.5}/> Download
                            </a>
                         </div>
                      </div>
                   )
                })}
             </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
             <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all">
                Close Window
             </button>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </ModalPortal>
  );
}