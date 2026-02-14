import { toast } from 'sonner';
import { INITIAL_ROW_STATE, INITIAL_COHORT_ROW } from './constants';

export const toInt = (val) => val === '' ? 0 : Number(val);

export const mapDbToRow = (r) => ({ ...INITIAL_ROW_STATE, ...r, male: r.male ?? '', female: r.female ?? '', ageLt15: r.age_lt_15 ?? '', ageGt15: r.age_gt_15 ?? '', cat1: r.cat_1 ?? '', cat2: r.cat_2 ?? '', cat3: r.cat_3 ?? '', totalPatients: r.total_patients ?? '', abCount: r.ab_count ?? '', hrCount: r.hr_count ?? '', pvrv: r.pvrv ?? '', pcecv: r.pcecv ?? '', hrig: r.hrig ?? '', erig: r.erig ?? '', dog: r.dog ?? '', cat: r.cat ?? '', othersCount: r.others_count ?? '', othersSpec: r.others_spec ?? '', washed: r.washed ?? '', remarks: r.remarks ?? '' });

export const mapCohortDbToRow = (r) => {
  const safe = (v) => (v === 0 || v === null) ? '' : v;
  return {
    cat2_registered: safe(r.cat2_registered), cat2_rig: safe(r.cat2_rig), cat2_complete: safe(r.cat2_complete), cat2_incomplete: safe(r.cat2_incomplete), cat2_booster: safe(r.cat2_booster), cat2_none: safe(r.cat2_none), cat2_died: safe(r.cat2_died), cat2_remarks: r.cat2_remarks || '',
    cat3_registered: safe(r.cat3_registered), cat3_rig: safe(r.cat3_rig), cat3_complete: safe(r.cat3_complete), cat3_incomplete: safe(r.cat3_incomplete), cat3_booster: safe(r.cat3_booster), cat3_none: safe(r.cat3_none), cat3_died: safe(r.cat3_died), cat3_remarks: r.cat3_remarks || ''
  };
};

export const mapRowToDb = (r) => ({ male: toInt(r.male), female: toInt(r.female), age_lt_15: toInt(r.ageLt15), age_gt_15: toInt(r.ageGt15), cat_1: toInt(r.cat1), cat_2: toInt(r.cat2), cat_3: toInt(r.cat3), total_patients: toInt(r.totalPatients), ab_count: toInt(r.abCount), hr_count: toInt(r.hrCount), pvrv: toInt(r.pvrv), pcecv: toInt(r.pcecv), hrig: toInt(r.hrig), erig: toInt(r.erig), dog: toInt(r.dog), cat: toInt(r.cat), others_count: toInt(r.others_count), others_spec: r.othersSpec, washed: toInt(r.washed), remarks: r.remarks });

export const mapCohortRowToDb = (r) => ({
  cat2_registered: toInt(r.cat2_registered), cat2_rig: toInt(r.cat2_rig), cat2_complete: toInt(r.cat2_complete), cat2_incomplete: toInt(r.cat2_incomplete), cat2_booster: toInt(r.cat2_booster), cat2_none: toInt(r.cat2_none), cat2_died: toInt(r.cat2_died), cat2_remarks: r.cat2_remarks,
  cat3_registered: toInt(r.cat3_registered), cat3_rig: toInt(r.cat3_rig), cat3_complete: toInt(r.cat3_complete), cat3_incomplete: toInt(r.cat3_incomplete), cat3_booster: toInt(r.cat3_booster), cat3_none: toInt(r.cat3_none), cat3_died: toInt(r.cat3_died), cat3_remarks: r.cat3_remarks
});

export const getQuarterMonths = (q) => { if (q === "1st Quarter") return ["January", "February", "March"]; if (q === "2nd Quarter") return ["April", "May", "June"]; if (q === "3rd Quarter") return ["July", "August", "September"]; if (q === "4th Quarter") return ["October", "November", "December"]; return []; };

export const hasData = (row) => {
  if (!row) return false;
  const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
  return keys.some(k => Number(row[k]) > 0) || (row.remarks && row.remarks.trim() !== '');
};

// This is the function that was missing:
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

export const downloadPDF = async (elementId, filename) => {
  const originalElement = document.getElementById(elementId);
  if(!originalElement) { toast.error("Nothing to print!"); return; }

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container-temp';
  printContainer.style.position = 'fixed';
  printContainer.style.top = '0';
  printContainer.style.left = '0';
  printContainer.style.width = '1600px';
  printContainer.style.zIndex = '-9999';
  printContainer.style.backgroundColor = '#ffffff';
  printContainer.style.visibility = 'hidden';
  
  const clone = originalElement.cloneNode(true);
  
  const noPrints = clone.querySelectorAll('.no-print');
  noPrints.forEach(el => el.remove());

  const hiddenRows = clone.querySelectorAll('.pdf-hide-empty');
  hiddenRows.forEach(el => el.style.display = 'none');
  
  const headers = clone.querySelectorAll('th');
  headers.forEach(th => {
    th.style.height = 'auto';
    th.style.minHeight = '40px';
    th.style.whiteSpace = 'normal';
    th.style.overflow = 'visible';
    th.style.verticalAlign = 'middle';
    th.style.padding = '8px 4px';
  });

  const rows = clone.querySelectorAll('tr');
  rows.forEach(tr => { tr.style.height = 'auto'; });

  printContainer.appendChild(clone);
  document.body.appendChild(printContainer);

  if (!window.html2pdf) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
    script.crossOrigin = "anonymous"; 
    document.head.appendChild(script);
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => { 
        document.body.removeChild(printContainer);
        toast.error("Failed to load PDF engine."); 
        reject(); 
      };
    });
  }

  if (window.html2pdf) {
    const pdfHeader = clone.querySelector('#pdf-header');
    const pdfFooter = clone.querySelector('#pdf-footer');
    if(pdfHeader) { pdfHeader.style.display = 'flex'; }
    if(pdfFooter) { pdfFooter.style.display = 'flex'; }

    const opt = { 
      margin: [0.3, 0.2, 0.3, 0.2],
      filename: filename, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1600 }, 
      jsPDF: { unit: 'in', format: [13, 8.5], orientation: 'landscape' } 
    };
    
    try {
      printContainer.style.visibility = 'visible'; 
      await window.html2pdf().set(opt).from(clone).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("PDF Error: " + err.message);
    } finally {
      document.body.removeChild(printContainer);
    }
  }
};