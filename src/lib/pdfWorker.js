import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Internal helper functions duplicated for the isolated worker thread
const toInt = (val) => val === '' || isNaN(val) ? 0 : Number(val);

const hasData = (row) => {
  if (!row) return false;
  return Object.values(row).some(v => toInt(v) > 0) || (row.remarks && row.remarks.trim() !== '');
};

const getComputations = (row) => {
  if (!row) return { sexTotal: 0, ageTotal: 0, cat2: 0, cat3: 0, cat23: 0, catTotal: 0, animalTotal: 0 };
  
  const male = toInt(row.male);
  const female = toInt(row.female);
  const ageU = toInt(row.ageUnder15);
  const ageO = toInt(row.ageOver15);

  const cat1 = toInt(row.cat1);
  const cat2 = toInt(row.cat2EligPri) + toInt(row.cat2EligBoost) + toInt(row.cat2NonElig);
  const cat3 = toInt(row.cat3EligPri) + toInt(row.cat3EligBoost) + toInt(row.cat3NonElig);

  const dog = toInt(row.typeDog);
  const cat = toInt(row.typeCat);
  const others = toInt(row.typeOthers);

  return { 
      sexTotal: male + female, 
      ageTotal: ageU + ageO, 
      cat2, 
      cat3, 
      cat23: cat2 + cat3, 
      catTotal: cat1 + cat2 + cat3, 
      animalTotal: dog + cat + others 
  };
};

// Listen for the start command from the main thread
self.onmessage = async (e) => {
  const { filename, data, rowKeys, periodText, facilityName, userProfile, globalSettings, isConsolidated, facilityType, facilityOwnership } = e.data;

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

    const isZeroReport = rowKeys.every(key => !hasData(data[key]));

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
    doc.text("Form 1 - Accomplishment Report", width / 2, 50, { align: 'center' });
    
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
    const firstColTitle = isConsolidated ? "Municipality" : "Barangay / Municipality";
    const head = [
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

    let gt = { male: 0, female: 0, sexTotal: 0, ageLt15: 0, ageGt15: 0, ageTotal: 0, cat1: 0, cat2: 0, cat3: 0, cat23: 0, catTotal: 0, pvrv: 0, pcecv: 0, hrig: 0, erig: 0, dog: 0, cat: 0, othersCount: 0, animalTotal: 0 };

    const body = rowKeys.map(key => {
      if (key === "Non-Abra") return [{ content: 'Other Municipalities / Non-Abra', colSpan: 26, styles: { fillColor: [230, 230, 230], fontStyle: 'bold', halign: 'left' } }];
      
      const row = data[key] || {};
      if (!hasData(row)) return null;

      const c = getComputations(row);
      
      // Accumulate Grand Totals
      gt.male += toInt(row.male);
      gt.female += toInt(row.female);
      gt.sexTotal += c.sexTotal;
      gt.ageLt15 += toInt(row.ageUnder15);
      gt.ageGt15 += toInt(row.ageOver15);
      gt.ageTotal += c.ageTotal;
      gt.cat1 += toInt(row.cat1);
      gt.cat2 += c.cat2;
      gt.cat3 += c.cat3;
      gt.cat23 += c.cat23;
      gt.catTotal += c.catTotal;
      gt.pvrv += toInt(row.compCat2Pri);
      gt.pcecv += toInt(row.compCat2Boost);
      gt.hrig += toInt(row.compCat3PriHrig);
      gt.erig += toInt(row.compCat3PriErig);
      gt.dog += toInt(row.typeDog);
      gt.cat += toInt(row.typeCat);
      gt.othersCount += toInt(row.typeOthers);
      gt.animalTotal += c.animalTotal;
      
      return [
        { content: key, styles: { fontStyle: 'bold', halign: 'left' } },
        toInt(row.male), toInt(row.female), { content: c.sexTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        toInt(row.ageUnder15), toInt(row.ageOver15), { content: c.ageTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        toInt(row.cat1), c.cat2, c.cat3, c.cat23, { content: c.catTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        c.catTotal, c.cat23, toInt(row.compCat2Pri), toInt(row.compCat2Boost), toInt(row.compCat3PriHrig), toInt(row.compCat3PriErig),
        toInt(row.typeDog), toInt(row.typeCat), toInt(row.typeOthers), '', 
        { content: c.animalTotal, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        '', { content: '', styles: { fontSize: 8 } }, row.remarks || ''
      ];
    }).filter(row => row !== null);

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
      { content: gt.catTotal, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.cat23, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.pvrv, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.pcecv, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.hrig, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.erig, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.dog, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.cat, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.othersCount, styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: '', styles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: gt.animalTotal, styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
      { content: '', styles: { fontStyle: 'bold', fillColor: [50, 50, 50], textColor: [255, 255, 255] } },
      { content: '', styles: { fontStyle: 'bold', fillColor: [70, 70, 70], textColor: [255, 255, 255] } },
      { content: '', styles: { fillColor: [50, 50, 50] } }
    ]);

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
    
    const pdfBlob = doc.output('blob');
    self.postMessage({ success: true, blob: pdfBlob, filename });

  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};