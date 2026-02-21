import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INITIAL_ROW_STATE, INITIAL_COHORT_ROW } from './constants';

export const toInt = (val) => val === '' ? 0 : Number(val);

export const toDbInt = (val) => val === '' ? null : Number(val);

export const mapDbToRow = (r) => ({ 
  ...INITIAL_ROW_STATE, 
  ...r, 
  male: r.male ?? '', 
  female: r.female ?? '', 
  ageLt15: r.age_lt_15 ?? '', 
  ageGt15: r.age_gt_15 ?? '', 
  cat1: r.cat_1 ?? '', 
  cat2: r.cat_2 ?? '', 
  cat3: r.cat_3 ?? '', 
  totalPatients: r.total_patients ?? '', 
  abCount: r.ab_count ?? '', 
  hrCount: r.hr_count ?? '', 
  pvrv: r.pvrv ?? '', 
  pcecv: r.pcecv ?? '', 
  hrig: r.hrig ?? '', 
  erig: r.erig ?? '', 
  dog: r.dog ?? '', 
  cat: r.cat ?? '', 
  othersCount: r.others_count ?? '', 
  othersSpec: r.others_spec ?? '', 
  washed: r.washed ?? '', 
  remarks: r.remarks ?? '' 
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

// --- NEW HELPER FUNCTIONS FOR ANIMAL PARSING & AGGREGATION ---

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
        
        if (name) {
          counts[name] = (counts[name] || 0) + count;
        }
      }
    });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]) 
    .map(([name, count]) => {
       const label = count > 1 ? `${name}s` : name;
       const display = label.charAt(0).toUpperCase() + label.slice(1);
       return `${count} ${display}`; 
    })
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

// --- DATA-DRIVEN PDF ENGINE (JSPDF + AUTOTABLE) ---

// <-- UPDATED SIGNATURE TO ACCEPT TYPE & OWNERSHIP
export const downloadPDF = async ({ 
  type, 
  cohortType, 
  filename, 
  data, 
  rowKeys, 
  grandTotals, 
  cohortTotals, 
  periodText, 
  facilityName, 
  userProfile, 
  globalSettings,
  isConsolidated,
  facilityType,
  facilityOwnership
}) => {
  try {
    // UPDATED: 612pt x 936pt represents standard 8.5" x 13" Long Bond Paper
    const doc = new jsPDF('landscape', 'pt', [612, 936]); 
    const width = doc.internal.pageSize.getWidth();
    
    // --- BRANDING ---
    if (globalSettings?.logo_base64) {
      try { doc.addImage(globalSettings.logo_base64, 'PNG', 40, 20, 50, 50); } catch(e) { console.warn("Logo error", e); }
    }
    if (userProfile?.facility_logo) {
      try { doc.addImage(userProfile.facility_logo, 'PNG', width - 90, 20, 50, 50); } catch(e) { console.warn("Facility logo error", e); }
    }

    // --- ZERO REPORT LOGIC ---
    // If every row in the dataset is completely empty (hasData returns false), it triggers the Zero Report flag.
    const isZeroReport = type === 'main' 
      ? rowKeys.every(key => key === "Others:" || !hasData(data[key]))
      : rowKeys.every(key => key === "Others:" || !hasCohortData(data[key], cohortType));

    // --- HEADERS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // <-- UPDATED CONDITIONAL HEADER LOGIC
    let topHeaderText = "Department of Health";
    // Check if it's the consolidated report OR a government hospital
    if (isConsolidated || (facilityType === 'Hospital' && facilityOwnership === 'Government')) {
        topHeaderText = "Provincial Health Office";
    }

    doc.text(topHeaderText, width / 2, 20, { align: 'center' }); 
    doc.text("National Rabies Prevention and Control Program", width / 2, 35, { align: 'center' });
    
    doc.setFontSize(12);
    const title = type === 'main' ? "Form 1 - Accomplishment Report" : `Cohort Report - ${cohortType === 'cat2' ? 'Category II' : 'Category III'}`;
    doc.text(title, width / 2, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Period: ${periodText}`, width / 2, 65, { align: 'center' });
    doc.text(`Health Facility: ${facilityName}`, width / 2, 78, { align: 'center' });

    // --- INJECT "ZERO CASE REPORT" WARNING ---
    if (isZeroReport) {
      doc.setTextColor(220, 38, 38); // Make text a prominent Red
      doc.setFontSize(12);
      doc.text("*** ZERO CASE REPORT ***", width / 2, 95, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset color to black so the rest of the PDF is normal
    }

    // --- TABLE GENERATION ---
    let head = [];
    let body = [];
    
    if (type === 'main') {
      const firstColTitle = isConsolidated ? "Municipality" : "Barangay / Municipality";
      head = [
        [
          { content: firstColTitle, rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Human Cases', colSpan: 17 },
          { content: 'Biting Animals', colSpan: 4 },
          { content: 'Total', rowSpan: 3, styles: { valign: 'middle' } },
          { content: 'No. who washed', rowSpan: 3, styles: { valign: 'middle' } },
          { content: 'Percentage', rowSpan: 3, styles: { valign: 'middle' } },
          { content: 'Remarks', rowSpan: 3, styles: { valign: 'middle' } }
        ],
        [
          { content: 'Sex', colSpan: 2 },
          { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Age', colSpan: 2 },
          { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'AB Category', colSpan: 3 },
          { content: '(CII+CIII)', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'AB', styles: { valign: 'middle' } },
          { content: 'HR', styles: { valign: 'middle' } },
          { content: 'Post-Exposure Prophylaxis', colSpan: 4 },
          { content: 'Dog', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Cat', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Others (Specify)', colSpan: 2 }
        ],
        [
          'Male', 'Female', 
          '<15', '>15', 
          'Cat I', 'Cat II', 'Cat III', 
          'No.', 'No.', 
          'PVRV', 'PCECV', 'HRIG', 'ERIG', 
          'No.', 'Specify'
        ]
      ];

      body = rowKeys.map(key => {
        if (key === "Others:") {
             return [{ content: 'Other Municipalities', colSpan: 26, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', halign: 'left' } }];
        }
        
        const row = data[key] || INITIAL_ROW_STATE;
        if (!hasData(row)) return null;

        const c = getComputations(row);
        
        return [
          { content: key, styles: { fontStyle: 'bold', halign: 'left' } },
          row.male, row.female, { content: c.sexTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.ageLt15, row.ageGt15, { content: c.ageTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.cat1, row.cat2, row.cat3, c.cat23, { content: c.catTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.totalPatients, row.abCount,
          row.pvrv, row.pcecv, row.hrig, row.erig,
          row.dog, row.cat, row.othersCount, row.othersSpec, 
          { content: c.animalTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.washed, { content: c.percent, styles: { fontSize: 8 } },
          row.remarks
        ];
      }).filter(row => row !== null);

      const gt = grandTotals;
      body.push([
        { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255], halign: 'left' } },
        { content: gt.male, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.female, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.sexTotal, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
        { content: gt.ageLt15, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.ageGt15, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.ageTotal, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
        { content: gt.cat1, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.cat2, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.cat3, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.cat23, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
        { content: gt.catTotal, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
        { content: gt.totalPatients, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.abCount, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.pvrv, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.pcecv, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.hrig, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.erig, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.dog, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.cat, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.othersCount, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.othersSpec, styles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.animalTotal, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
        { content: gt.washed, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: gt.percent, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
        { content: '', styles: { fillColor: [50, 50, 50] } }
      ]);
    } 
    else {
      head = [[
        { content: 'Municipality', styles: { halign: 'left', valign: 'middle' } },
        'Registered', 'W/ RIG', 'Complete', 'Incomplete', 'Booster', 'None', 'Died', 'Remarks'
      ]];
      
      const prefix = cohortType === 'cat2' ? 'cat2' : 'cat3';
      body = rowKeys.map(key => {
        if (key === "Others:") {
             return [{ content: 'Other Municipalities', colSpan: 9, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', halign: 'left' } }];
        }
        
        const row = data[key] || INITIAL_COHORT_ROW;
        if (!hasCohortData(row, cohortType)) return null;

        return [
          { content: key, styles: { fontStyle: 'bold', halign: 'left' } },
          row[`${prefix}_registered`], row[`${prefix}_rig`],
          row[`${prefix}_complete`], row[`${prefix}_incomplete`],
          row[`${prefix}_booster`], row[`${prefix}_none`],
          row[`${prefix}_died`], row[`${prefix}_remarks`]
        ];
      }).filter(Boolean);

      const ct = cohortTotals;
      body.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255], halign: 'left' } },
        { content: ct[`${prefix}_registered`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: ct[`${prefix}_rig`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: ct[`${prefix}_complete`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: ct[`${prefix}_incomplete`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: ct[`${prefix}_booster`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: ct[`${prefix}_none`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: ct[`${prefix}_died`], styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
        { content: '', styles: { fillColor: [50, 50, 50] } }
      ]);
    }

    autoTable(doc, {
      // Adjust table placement downward slightly if "Zero Case Report" label is printed
      startY: isZeroReport ? 110 : 90, 
      head: head,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, halign: 'center', lineWidth: 0.5, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [250, 250, 250], textColor: [50, 50, 50], lineWidth: 0.5, lineColor: [200, 200, 200] },
    });
    
    let finalY = doc.lastAutoTable.finalY + 30;
    if (finalY + 100 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      finalY = 40;
    }

    if (userProfile?.signatories?.length > 0) {
      const sigCount = userProfile.signatories.length;
      const sectionWidth = width / sigCount;
      
      userProfile.signatories.forEach((sig, index) => {
        const xPos = (index * sectionWidth) + (sectionWidth / 2);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text(sig.label || '', xPos, finalY, { align: 'center' });
        
        doc.setLineWidth(1);
        doc.line(xPos - 60, finalY + 50, xPos + 60, finalY + 50); 
        
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(sig.name || '', xPos, finalY + 65, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(sig.title || '', xPos, finalY + 75, { align: 'center' });
      });
    }

    const phTime = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Generated on: ${phTime} by ${userProfile?.full_name || 'System'}`, 40, doc.internal.pageSize.getHeight() - 10);
    
    doc.save(filename);
    toast.success("PDF Downloaded");
  } catch (err) {
    console.error(err);
    toast.error("PDF Error: " + err.message);
  }
};