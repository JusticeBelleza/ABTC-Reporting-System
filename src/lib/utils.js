import { toast } from 'sonner';
import { INITIAL_ROW_STATE } from './constants';

export const toInt = (val) => {
  // If the value is missing, empty, or undefined, safely return 0
  if (!val) return 0;
  
  const parsed = Number(val);
  // If the conversion results in NaN, safely return 0
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const toDbInt = (val) => val === '' ? null : Number(val);

export const getQuarterMonths = (q) => { 
  if (q === "1st Quarter") return ["January", "February", "March"]; 
  if (q === "2nd Quarter") return ["April", "May", "June"]; 
  if (q === "3rd Quarter") return ["July", "August", "September"]; 
  if (q === "4th Quarter") return ["October", "November", "December"]; 
  return []; 
};

// V2 HasData Check
export const hasData = (row) => {
  if (!row) return false;
  
  const v2Keys = [
    'male', 'female', 'ageUnder15', 'ageOver15',
    'cat1', 'cat2EligPri', 'cat2EligBoost', 'cat2NonElig',
    'cat3EligPri', 'cat3EligBoost', 'cat3NonElig',
    'compCat2Pri', 'compCat2Boost', 'compCat3PriErig', 'compCat3PriHrig', 'compCat3Boost',
    'typeDog', 'typeCat', 'typeOthers',
    'statusPet', 'statusStray', 'statusUnk',
    'rabiesCases'
  ];
  
  // Returns true if ANY of the numeric fields have a value greater than 0
  return v2Keys.some(k => toInt(row[k]) > 0);
};

// V2 Math Computations & Validation Checks
export const getComputations = (row) => {
  if (!row) return { totalSex: 0, totalAge: 0, totalCases: 0, totalAnimals: 0, totalStatus: 0, isMismatch: false };
  
  const totalSex = toInt(row.male) + toInt(row.female);
  const totalAge = toInt(row.ageUnder15) + toInt(row.ageOver15);
  
  const cat2Total = toInt(row.cat2EligPri) + toInt(row.cat2EligBoost) + toInt(row.cat2NonElig);
  const cat3Total = toInt(row.cat3EligPri) + toInt(row.cat3EligBoost) + toInt(row.cat3NonElig);
  const totalCases = toInt(row.cat1) + cat2Total + cat3Total;
  
  const totalAnimals = toInt(row.typeDog) + toInt(row.typeCat) + toInt(row.typeOthers);
  const totalStatus = toInt(row.statusPet) + toInt(row.statusStray) + toInt(row.statusUnk);
  
  // DOH Strict Validation: All demographic and animal totals MUST balance
  const isMismatch = (totalSex > 0 || totalAge > 0 || totalCases > 0 || totalAnimals > 0) &&
    (totalSex !== totalAge || totalSex !== totalCases || totalCases !== totalAnimals || totalAnimals !== totalStatus);
    
  return { totalSex, totalAge, totalCases, totalAnimals, totalStatus, isMismatch };
};

// --- WEB WORKER BRIDGE FOR SCALABLE PDF EXPORTS ---
export const downloadPDF = (payload) => {
  return new Promise((resolve, reject) => {
    // Spin up the background worker
    const worker = new Worker(new URL('./pdfWorker.js', import.meta.url), { type: 'module' });

    worker.onmessage = (e) => {
      const { success, blob, filename, error } = e.data;
      
      if (success) {
        // Trigger the browser download using the processed Blob
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("PDF Downloaded Successfully");
        resolve();
      } else {
        toast.error("PDF Error: " + error);
        reject(new Error(error));
      }
      
      // Terminate the worker once the job is complete
      worker.terminate();
    };

    worker.onerror = (err) => {
      toast.error("Worker Error: Document generation failed.");
      worker.terminate();
      reject(err);
    };

    // Send the data payload to the worker to start crunching
    worker.postMessage(payload);
  });
};