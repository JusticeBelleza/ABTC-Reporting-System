import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INITIAL_ROW_STATE, INITIAL_COHORT_ROW } from './constants';

// Internal helper functions duplicated for the isolated worker thread
const toInt = (val) => val === '' ? 0 : Number(val);

const hasData = (row) => {
  if (!row) return false;
  const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
  return keys.some(k => Number(row[k]) > 0) || (row.remarks && row.remarks.trim() !== '') || (row.othersSpec && row.othersSpec.trim() !== '');
};

const hasCohortData = (row, category) => {
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

const getComputations = (row) => {
  if (!row) return { sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0, percent: '0%', sexMismatch: false };
  const sexTotal = toInt(row.male) + toInt(row.female);
  const ageTotal = toInt(row.ageLt15) + toInt(row.ageGt15);
  const cat23 = toInt(row.cat2) + toInt(row.cat3);
  const catTotal = toInt(row.cat1) + cat23;
  const animalTotal = toInt(row.dog) + toInt(row.cat) + toInt(row.othersCount);
  const percent = animalTotal > 0 ? (toInt(row.washed) / animalTotal * 100).toFixed(0) + '%' : '0%';
  return { sexTotal, ageTotal, cat23, catTotal, animalTotal, percent, sexMismatch: sexTotal !== ageTotal };
};

// Listen for the start command from the main thread
self.onmessage = async (e) => {
  const { type, cohortType, filename, data, rowKeys, grandTotals, cohortTotals, periodText, facilityName, userProfile, globalSettings, isConsolidated, facilityType, facilityOwnership } = e.data;

  try {
    const doc = new jsPDF('landscape', 'pt', [612, 936]); 
    const width = doc.internal.pageSize.getWidth();
    
    // --- BRANDING ---
    if (globalSettings?.logo_base64) {
      try { doc.addImage(globalSettings.logo_base64, 'PNG', 40, 20, 50, 50); } catch(err) { console.warn("Logo error"); }
    }
    if (userProfile?.facility_logo) {
      try { doc.addImage(userProfile.facility_logo, 'PNG', width - 90, 20, 50, 50); } catch(err) { console.warn("Facility logo error"); }
    }

    const isZeroReport = type === 'main' 
      ? rowKeys.every(key => key === "Others:" || !hasData(data[key]))
      : rowKeys.every(key => key === "Others:" || !hasCohortData(data[key], cohortType));

    // --- HEADERS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    let topHeaderText = "Department of Health";
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

    if (isZeroReport) {
      doc.setTextColor(220, 38, 38); 
      doc.setFontSize(12);
      doc.text("*** ZERO CASE REPORT ***", width / 2, 95, { align: 'center' });
      doc.setTextColor(0, 0, 0); 
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
          { content: 'Sex', colSpan: 2 }, { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Age', colSpan: 2 }, { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'AB Category', colSpan: 3 }, { content: '(CII+CIII)', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Total', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'AB', styles: { valign: 'middle' } }, { content: 'HR', styles: { valign: 'middle' } },
          { content: 'Post-Exposure Prophylaxis', colSpan: 4 },
          { content: 'Dog', rowSpan: 2, styles: { valign: 'middle' } }, { content: 'Cat', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Others (Specify)', colSpan: 2 }
        ],
        [
          'Male', 'Female', '<15', '>15', 'Cat I', 'Cat II', 'Cat III', 
          'No.', 'No.', 'PVRV', 'PCECV', 'HRIG', 'ERIG', 'No.', 'Specify'
        ]
      ];

      body = rowKeys.map(key => {
        if (key === "Others:") return [{ content: 'Other Municipalities', colSpan: 26, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', halign: 'left' } }];
        
        const row = data[key] || INITIAL_ROW_STATE;
        if (!hasData(row)) return null;

        const c = getComputations(row);
        
        return [
          { content: key, styles: { fontStyle: 'bold', halign: 'left' } },
          row.male, row.female, { content: c.sexTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.ageLt15, row.ageGt15, { content: c.ageTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.cat1, row.cat2, row.cat3, c.cat23, { content: c.catTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.totalPatients, row.abCount, row.pvrv, row.pcecv, row.hrig, row.erig,
          row.dog, row.cat, row.othersCount, row.othersSpec, 
          { content: c.animalTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          row.washed, { content: c.percent, styles: { fontSize: 8 } }, row.remarks
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
        if (key === "Others:") return [{ content: 'Other Municipalities', colSpan: 9, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', halign: 'left' } }];
        
        const row = data[key] || INITIAL_COHORT_ROW;
        if (!hasCohortData(row, cohortType)) return null;

        return [
          { content: key, styles: { fontStyle: 'bold', halign: 'left' } },
          row[`${prefix}_registered`], row[`${prefix}_rig`], row[`${prefix}_complete`], row[`${prefix}_incomplete`],
          row[`${prefix}_booster`], row[`${prefix}_none`], row[`${prefix}_died`], row[`${prefix}_remarks`]
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
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100);
        doc.text(sig.label || '', xPos, finalY, { align: 'center' });
        doc.setLineWidth(1); doc.line(xPos - 60, finalY + 50, xPos + 60, finalY + 50); 
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text(sig.name || '', xPos, finalY + 65, { align: 'center' });
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(sig.title || '', xPos, finalY + 75, { align: 'center' });
      });
    }

    const phTime = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`Generated on: ${phTime} by ${userProfile?.full_name || 'System'}`, 40, doc.internal.pageSize.getHeight() - 10);
    
    // Instead of saving directly, return the raw PDF file to the main browser thread
    const pdfBlob = doc.output('blob');
    self.postMessage({ success: true, blob: pdfBlob, filename });

  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};