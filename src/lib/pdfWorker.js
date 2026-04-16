import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Internal helper functions duplicated for the isolated worker thread
const toInt = (val) => val === '' || isNaN(val) ? 0 : Number(val);

const hasData = (row) => {
  if (!row) return false;
  return Object.values(row).some(v => typeof v === 'string' && v.trim() !== '' && toInt(v) > 0) || (row.remarks && row.remarks.trim() !== '');
};

// Listen for the start command from the main thread
self.onmessage = async (e) => {
  const { filename, data, rowKeys, populations, periodText, facilityName, userProfile, globalSettings, isConsolidated, facilityType, facilityOwnership } = e.data;

  try {
    // Legal Landscape for maximum width
    const doc = new jsPDF('landscape', 'pt', 'legal'); 
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

    doc.text(topHeaderText, width / 2, 30, { align: 'center' }); 
    doc.text("National Rabies Prevention and Control Program", width / 2, 45, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text("Form 1 - Accomplishment Report (V2 Format)", width / 2, 65, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Period: ${periodText}`, width / 2, 80, { align: 'center' });
    doc.text(`Health Facility: ${facilityName}`, width / 2, 95, { align: 'center' });

    if (isZeroReport) {
      doc.setTextColor(220, 38, 38); 
      doc.setFontSize(12);
      doc.text("*** ZERO CASE REPORT ***", width / 2, 115, { align: 'center' });
      doc.setTextColor(0, 0, 0); 
    }

    // Shared Styles
    const defaultStyles = { fontSize: 7, cellPadding: 3, halign: 'center', valign: 'middle', lineWidth: 0.5, lineColor: [200, 200, 200] };
    const headStyles = { fillColor: [240, 244, 248], textColor: [15, 23, 42], fontStyle: 'bold' };

    // ==========================================
    // TABLE 1: ANIMAL BITE CASES
    // ==========================================
    doc.setFontSize(10);
    doc.text("PART 1: ANIMAL BITE CASES", 40, isZeroReport ? 140 : 120);

    const head1 = [
        [
            { content: 'Location', rowSpan: 3, styles: { halign: 'left' } },
            { content: 'Population', rowSpan: 3 },
            { content: 'Sex', colSpan: 3 }, { content: 'Age', colSpan: 3 },
            { content: 'Category I', rowSpan: 3 },
            { content: 'Category II', colSpan: 3 }, { content: 'Category III', colSpan: 3 },
            { content: 'Total PEP Elig.', rowSpan: 3 },
            { content: 'Total Cases', rowSpan: 3 }
        ],
        [
            { content: 'M', rowSpan: 2 }, { content: 'F', rowSpan: 2 }, { content: 'Total', rowSpan: 2 },
            { content: '<15', rowSpan: 2 }, { content: '>15', rowSpan: 2 }, { content: 'Total', rowSpan: 2 },
            { content: 'PEP Elig.', colSpan: 2 }, { content: 'Non-Elig', rowSpan: 2 },
            { content: 'PEP Elig.', colSpan: 2 }, { content: 'Non-Elig', rowSpan: 2 }
        ],
        [ 'Pri.', 'Boost.', 'Pri.', 'Boost.' ]
    ];

    let gt1 = { p:0, m:0, f:0, st:0, au:0, ao:0, at:0, c1:0, c2ep:0, c2eb:0, c2ne:0, c3ep:0, c3eb:0, c3ne:0, elig:0, tot:0 };

    const body1 = rowKeys.map(key => {
        const row = data[key] || {};
        const pop = populations?.[key] || 0;
        if (!hasData(row) && pop === 0 && key !== "Non-Abra") return null;

        const m = toInt(row.male), f = toInt(row.female), st = m+f;
        const au = toInt(row.ageUnder15), ao = toInt(row.ageOver15), at = au+ao;
        const c1 = toInt(row.cat1);
        const c2ep = toInt(row.cat2EligPri), c2eb = toInt(row.cat2EligBoost), c2ne = toInt(row.cat2NonElig);
        const c3ep = toInt(row.cat3EligPri), c3eb = toInt(row.cat3EligBoost), c3ne = toInt(row.cat3NonElig);
        const elig = c2ep + c2eb + c3ep + c3eb;
        const tot = c1 + c2ep + c2eb + c2ne + c3ep + c3eb + c3ne;

        gt1.p += pop; gt1.m += m; gt1.f += f; gt1.st += st; gt1.au += au; gt1.ao += ao; gt1.at += at;
        gt1.c1 += c1; gt1.c2ep += c2ep; gt1.c2eb += c2eb; gt1.c2ne += c2ne; gt1.c3ep += c3ep; gt1.c3eb += c3eb; gt1.c3ne += c3ne;
        gt1.elig += elig; gt1.tot += tot;

        return [
            { content: key, styles: { halign: 'left', fontStyle: 'bold' } },
            key === "Non-Abra" ? "N/A" : pop.toLocaleString(),
            m, f, st, au, ao, at, c1, c2ep, c2eb, c2ne, c3ep, c3eb, c3ne, elig, tot
        ];
    }).filter(Boolean);

    body1.push([
        { content: 'GRAND TOTAL', styles: { halign: 'left', fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.p.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.m, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.f, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.st, styles: { fontStyle: 'bold', fillColor: [203, 213, 225] } },
        { content: gt1.au, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.ao, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.at, styles: { fontStyle: 'bold', fillColor: [203, 213, 225] } },
        { content: gt1.c1, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.c2ep, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.c2eb, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.c2ne, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.c3ep, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.c3eb, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.c3ne, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt1.elig, styles: { fontStyle: 'bold', fillColor: [203, 213, 225] } },
        { content: gt1.tot, styles: { fontStyle: 'bold', fillColor: [203, 213, 225] } }
    ]);

    autoTable(doc, {
        startY: isZeroReport ? 150 : 130,
        head: head1,
        body: body1,
        theme: 'grid',
        styles: defaultStyles,
        headStyles: headStyles
    });

    // ==========================================
    // TABLE 2: POST-EXPOSURE PROPHYLAXIS
    // ==========================================
    let finalY = doc.lastAutoTable.finalY + 30;
    if (finalY + 100 > doc.internal.pageSize.getHeight()) { doc.addPage(); finalY = 40; }

    doc.setFontSize(10);
    doc.text("PART 2: POST-EXPOSURE PROPHYLAXIS (PEP)", 40, finalY);

    const head2 = [
        [
            { content: 'Location', rowSpan: 3, styles: { halign: 'left' } },
            { content: 'PEP Completed (CCEEV)', colSpan: 5 },
            { content: 'PEP Coverage (%)', colSpan: 5 }
        ],
        [
            { content: 'Cat II', colSpan: 2 }, { content: 'Cat III', colSpan: 3 },
            { content: 'Cat II', colSpan: 2 }, { content: 'Cat III', colSpan: 2 },
            { content: 'Total CCEEV', rowSpan: 2 }
        ],
        [
            'Pri.', 'Boost.', 'Pri. ERIG', 'Pri. HRIG', 'Boost.',
            'Pri.', 'Boost.', 'Pri.', 'Boost.'
        ]
    ];

    let gt2 = { c2p:0, c2b:0, c3pe:0, c3ph:0, c3b:0 };
    const fPct = (n, d) => d > 0 ? ((n/d)*100).toFixed(1)+'%' : '0.0%';

    const body2 = rowKeys.map(key => {
        const row = data[key] || {};
        if (!hasData(row) && key !== "Non-Abra") return null;

        const c2p = toInt(row.compCat2Pri), c2b = toInt(row.compCat2Boost);
        const c3pe = toInt(row.compCat3PriErig), c3ph = toInt(row.compCat3PriHrig), c3b = toInt(row.compCat3Boost);
        
        const e2p = toInt(row.cat2EligPri), e2b = toInt(row.cat2EligBoost);
        const e3p = toInt(row.cat3EligPri), e3b = toInt(row.cat3EligBoost);

        gt2.c2p += c2p; gt2.c2b += c2b; gt2.c3pe += c3pe; gt2.c3ph += c3ph; gt2.c3b += c3b;

        return [
            { content: key, styles: { halign: 'left', fontStyle: 'bold' } },
            c2p, c2b, c3pe, c3ph, c3b,
            fPct(c2p, e2p), fPct(c2b, e2b), fPct(c3pe + c3ph, e3p), fPct(c3b, e3b),
            fPct(c2p + c2b + c3pe + c3ph + c3b, e2p + e2b + e3p + e3b)
        ];
    }).filter(Boolean);

    body2.push([
        { content: 'GRAND TOTAL', styles: { halign: 'left', fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt2.c2p, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt2.c2b, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt2.c3pe, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt2.c3ph, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt2.c3b, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: fPct(gt2.c2p, gt1.c2ep), styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: fPct(gt2.c2b, gt1.c2eb), styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: fPct(gt2.c3pe + gt2.c3ph, gt1.c3ep), styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: fPct(gt2.c3b, gt1.c3eb), styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: fPct(gt2.c2p + gt2.c2b + gt2.c3pe + gt2.c3ph + gt2.c3b, gt1.elig), styles: { fontStyle: 'bold', fillColor: [203, 213, 225] } },
    ]);

    autoTable(doc, {
        startY: finalY + 10,
        head: head2,
        body: body2,
        theme: 'grid',
        styles: defaultStyles,
        headStyles: headStyles
    });

    // ==========================================
    // TABLE 3: BITING ANIMALS & RABIES CASES
    // ==========================================
    finalY = doc.lastAutoTable.finalY + 30;
    if (finalY + 100 > doc.internal.pageSize.getHeight()) { doc.addPage(); finalY = 40; }

    doc.setFontSize(10);
    doc.text("PART 3: BITING ANIMALS & HUMAN RABIES CASES", 40, finalY);

    const head3 = [
        [
            { content: 'Location', rowSpan: 2, styles: { halign: 'left' } },
            { content: 'Biting Animal Type', colSpan: 3 },
            { content: 'Animal Status', colSpan: 3 },
            { content: 'Total Animals', rowSpan: 2 },
            { content: 'Human Rabies Cases', rowSpan: 2 },
            { content: 'Incidence Prop. (per 1M)', rowSpan: 2 }
        ],
        [
            'Dog', 'Cat', 'Others', 'Pet', 'Stray', 'Unknown'
        ]
    ];

    let gt3 = { d:0, c:0, o:0, pt:0, st:0, un:0, tot:0, rab:0 };

    const body3 = rowKeys.map(key => {
        const row = data[key] || {};
        const pop = populations?.[key] || 0;
        if (!hasData(row) && key !== "Non-Abra") return null;

        const d = toInt(row.typeDog), c = toInt(row.typeCat), o = toInt(row.typeOthers);
        const pt = toInt(row.statusPet), st = toInt(row.statusStray), un = toInt(row.statusUnk);
        const tot = d + c + o;
        const rab = toInt(row.rabiesCases);
        const inc = (pop > 0 && key !== "Non-Abra") ? ((rab / pop) * 1000000).toFixed(2) : '0.00';

        gt3.d += d; gt3.c += c; gt3.o += o; gt3.pt += pt; gt3.st += st; gt3.un += un; gt3.tot += tot; gt3.rab += rab;

        return [
            { content: key, styles: { halign: 'left', fontStyle: 'bold' } },
            d, c, o, pt, st, un, { content: tot, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
            { content: rab, styles: { textColor: [220, 38, 38] } },
            { content: inc, styles: { textColor: [220, 38, 38] } }
        ];
    }).filter(Boolean);

    const gtInc = gt1.p > 0 ? ((gt3.rab / gt1.p) * 1000000).toFixed(2) : '0.00';

    body3.push([
        { content: 'GRAND TOTAL', styles: { halign: 'left', fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.d, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.c, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.o, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.pt, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.st, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.un, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
        { content: gt3.tot, styles: { fontStyle: 'bold', fillColor: [203, 213, 225] } },
        { content: gt3.rab, styles: { fontStyle: 'bold', textColor: [220, 38, 38], fillColor: [254, 226, 226] } },
        { content: gtInc, styles: { fontStyle: 'bold', textColor: [220, 38, 38], fillColor: [254, 226, 226] } }
    ]);

    autoTable(doc, {
        startY: finalY + 10,
        head: head3,
        body: body3,
        theme: 'grid',
        styles: defaultStyles,
        headStyles: headStyles
    });

    // ==========================================
    // SIGNATORIES & FOOTER
    // ==========================================
    finalY = doc.lastAutoTable.finalY + 40;
    if (finalY + 100 > doc.internal.pageSize.getHeight()) { doc.addPage(); finalY = 50; }

    if (userProfile?.signatories?.length > 0) {
      const sigCount = userProfile.signatories.length;
      const sectionWidth = width / sigCount;
      
      userProfile.signatories.forEach((sig, index) => {
        const xPos = (index * sectionWidth) + (sectionWidth / 2);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100);
        doc.text(sig.label || '', xPos, finalY, { align: 'center' });
        doc.setLineWidth(1); doc.line(xPos - 60, finalY + 40, xPos + 60, finalY + 40); 
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text(sig.name || '', xPos, finalY + 55, { align: 'center' });
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(sig.title || '', xPos, finalY + 65, { align: 'center' });
      });
    }

    const phTime = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`Generated on: ${phTime} by ${userProfile?.full_name || 'System'} | DOH ABTC Form 1 (V2)`, 40, doc.internal.pageSize.getHeight() - 15);
    
    const pdfBlob = doc.output('blob');
    self.postMessage({ success: true, blob: pdfBlob, filename });

  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};