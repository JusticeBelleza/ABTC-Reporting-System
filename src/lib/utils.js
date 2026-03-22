import { toast } from 'sonner';
import { INITIAL_ROW_STATE, INITIAL_COHORT_ROW } from './constants';

export const toInt = (val) => val === '' ? 0 : Number(val);
export const toDbInt = (val) => val === '' ? null : Number(val);

export const mapDbToRow = (r) => ({ 
  ...INITIAL_ROW_STATE, 
  ...r, 
  male: r.male ?? '', female: r.female ?? '', 
  ageLt15: r.age_lt_15 ?? '', ageGt15: r.age_gt_15 ?? '', 
  cat1: r.cat_1 ?? '', cat2: r.cat_2 ?? '', cat3: r.cat_3 ?? '', 
  totalPatients: r.total_patients ?? '', abCount: r.ab_count ?? '', hrCount: r.hr_count ?? '', 
  pvrv: r.pvrv ?? '', pcecv: r.pcecv ?? '', hrig: r.hrig ?? '', erig: r.erig ?? '', 
  dog: r.dog ?? '', cat: r.cat ?? '', 
  othersCount: r.others_count ?? '', othersSpec: r.others_spec ?? '', 
  washed: r.washed ?? '', remarks: r.remarks ?? '' 
});

export const mapCohortDbToRow = (r) => {
  const safe = (v) => (v === null) ? '' : v;
  return {
    cat2_registered: safe(r.cat2_registered), cat2_rig: safe(r.cat2_rig), cat2_complete: safe(r.cat2_complete), cat2_incomplete: safe(r.cat2_incomplete), cat2_booster: safe(r.cat2_booster), cat2_none: safe(r.cat2_none), cat2_died: safe(r.cat2_died), cat2_remarks: r.cat2_remarks || '',
    cat3_registered: safe(r.cat3_registered), cat3_rig: safe(r.cat3_rig), cat3_complete: safe(r.cat3_complete), cat3_incomplete: safe(r.cat3_incomplete), cat3_booster: safe(r.cat3_booster), cat3_none: safe(r.cat3_none), cat3_died: safe(r.cat3_died), cat3_remarks: r.cat3_remarks || ''
  };
};

export const mapRowToDb = (r) => ({ male: toDbInt(r.male), female: toDbInt(r.female), age_lt_15: toDbInt(r.ageLt15), age_gt_15: toDbInt(r.ageGt15), cat_1: toDbInt(r.cat1), cat_2: toDbInt(r.cat2), cat_3: toDbInt(r.cat3), total_patients: toDbInt(r.totalPatients), ab_count: toDbInt(r.abCount), hr_count: toDbInt(r.hrCount), pvrv: toDbInt(r.pvrv), pcecv: toDbInt(r.pcecv), hrig: toDbInt(r.hrig), erig: toDbInt(r.erig), dog: toDbInt(r.dog), cat: toDbInt(r.cat), others_count: toDbInt(r.othersCount), others_spec: r.othersSpec, washed: toDbInt(r.washed), remarks: r.remarks });

export const mapCohortRowToDb = (r) => ({
  cat2_registered: toDbInt(r.cat2_registered), cat2_rig: toDbInt(r.cat2_rig), cat2_complete: toDbInt(r.cat2_complete), cat2_incomplete: toDbInt(r.cat2_incomplete), cat2_booster: toDbInt(r.cat2_booster), cat2_none: toDbInt(r.cat2_none), cat2_died: toDbInt(r.cat2_died), cat2_remarks: r.cat2_remarks,
  cat3_registered: toDbInt(r.cat3_registered), cat3_rig: toDbInt(r.cat3_rig), cat3_complete: toDbInt(r.cat3_complete), cat3_incomplete: toDbInt(r.cat3_incomplete), cat3_booster: toDbInt(r.cat3_booster), cat3_none: toDbInt(r.cat3_none), cat3_died: toDbInt(r.cat3_died), cat3_remarks: r.cat3_remarks
});

export const parseAnimalCountFromText = (str) => {
  if (!str) return 0;
  const numbers = str.match(/(\d+)/g);
  if (!numbers) return 0;
  return numbers.reduce((acc, curr) => acc + parseInt(curr, 10), 0);
};

export const aggregateAnimalSpecs = (specsList) => {
  const counts = {};
  specsList.forEach(spec => {
    if (!spec) return;
    const items = spec.split(/[,;\n]+/);
    items.forEach(item => {
      const match = item.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[0], 10);
        let name = item.replace(match[0], '').trim().toLowerCase();
        if (name.endsWith('s')) name = name.slice(0, -1); 
        name = name.replace(/[^a-z0-9\s-]/g, ''); 
        
        if (name) counts[name] = (counts[name] || 0) + count;
      }
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]) 
    .map(([name, count]) => `${count} ${count > 1 ? `${name}s` : name}`.replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ');
};

export const getQuarterMonths = (q) => { if (q === "1st Quarter") return ["January", "February", "March"]; if (q === "2nd Quarter") return ["April", "May", "June"]; if (q === "3rd Quarter") return ["July", "August", "September"]; if (q === "4th Quarter") return ["October", "November", "December"]; return []; };

export const hasData = (row) => {
  if (!row) return false;
  const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
  return keys.some(k => Number(row[k]) > 0) || (row.remarks && row.remarks.trim() !== '') || (row.othersSpec && row.othersSpec.trim() !== '');
};

export const hasCohortData = (row, category) => {
  if(!row) return false;
  if (category === 'cat2') {
    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died'];
    return keys.some(k => Number(row[k]) > 0) || (row.cat2_remarks && row.cat2_remarks.trim() !== '');
  } else if (category === 'cat3') {
    const keys = ['cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
    return keys.some(k => Number(row[k]) > 0) || (row.cat3_remarks && row.cat3_remarks.trim() !== '');
  }
  return false;
};

export const getComputations = (row) => {
  if (!row) return { sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0, percent: '0%', sexMismatch: false };
  const sexTotal = toInt(row.male) + toInt(row.female);
  const ageTotal = toInt(row.ageLt15) + toInt(row.ageGt15);
  const cat23 = toInt(row.cat2) + toInt(row.cat3);
  const catTotal = toInt(row.cat1) + cat23;
  const animalTotal = toInt(row.dog) + toInt(row.cat) + toInt(row.othersCount);
  const percent = animalTotal > 0 ? (toInt(row.washed) / animalTotal * 100).toFixed(0) + '%' : '0%';
  return { sexTotal, ageTotal, cat23, catTotal, animalTotal, percent, sexMismatch: sexTotal !== ageTotal };
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