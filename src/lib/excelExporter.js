import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const getCleanBase64 = (dataUrl) => {
    if (!dataUrl) return null;
    const matches = dataUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        return { extension: matches[1].replace('jpeg', 'jpg'), data: matches[2] };
    }
    return null;
};

const buildAggregatedData = (rawData, monthsList) => {
    const agg = {};
    const rows = rawData.filter(r => monthsList.includes(r.month));
    
    rows.forEach(row => {
        const loc = row.location_name;
        if (!agg[loc]) {
            agg[loc] = {};
        }
        const toNum = (v) => parseInt(v) || 0;
        
        const map = {
            male: 'male', female: 'female', ageUnder15: 'age_under_15', ageOver15: 'age_over_15',
            cat1: 'cat1', cat2EligPri: 'cat2_elig_pri', cat2EligBoost: 'cat2_elig_boost', cat2NonElig: 'cat2_non_elig',
            cat3EligPri: 'cat3_elig_pri', cat3EligBoost: 'cat3_elig_boost', cat3NonElig: 'cat3_non_elig',
            compCat2Pri: 'comp_cat2_pri', compCat2Boost: 'comp_cat2_boost', compCat3PriErig: 'comp_cat3_pri_erig', compCat3PriHrig: 'comp_cat3_pri_hrig', compCat3Boost: 'comp_cat3_boost',
            typeDog: 'type_dog', typeCat: 'type_cat', typeOthers: 'type_others',
            statusPet: 'status_pet', statusStray: 'status_stray', statusUnk: 'status_unk', rabiesCases: 'rabies_cases'
        };
        
        for (const [camel, snake] of Object.entries(map)) {
            agg[loc][camel] = (agg[loc][camel] || 0) + toNum(row[snake]);
        }
    });

    return agg;
};

export const exportToExcelTemplate = async ({ 
    data, formRowKeys, otherRowKeys, populations, periodType, quarter, month, year, facilityName,
    globalSettings, userProfile, rawData
}) => {
    try {
        const response = await fetch('/doh_template.xlsx');
        if (!response.ok) throw new Error("Template file not found in public folder");
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        let sysImageId = null;
        let facImageId = null;

        if (globalSettings?.logo_base64) {
            const logo = getCleanBase64(globalSettings.logo_base64);
            if (logo) sysImageId = workbook.addImage({ base64: logo.data, extension: logo.extension });
        }
        if (userProfile?.facility_logo) {
            const fLogo = getCleanBase64(userProfile.facility_logo);
            if (fLogo) facImageId = workbook.addImage({ base64: fLogo.data, extension: fLogo.extension });
        }

        const fillSheet = (worksheet, sheetData, fKeys, oKeys, periodText) => {
            worksheet.getCell('B7').value = 'Province: Abra';
            worksheet.getCell('B8').value = `Health Facility: ${facilityName}`;
            worksheet.getCell('G7').value = `Period: ${periodText}`;

            worksheet.getRow(14).height = 35;
            worksheet.getRow(15).height = 35;

            if (sysImageId) worksheet.addImage(sysImageId, { tl: { col: 18, row: 8 }, ext: { width: 140, height: 140 }, editAs: 'oneCell' });
            if (facImageId) worksheet.addImage(facImageId, { tl: { col: 20, row: 6 }, ext: { width: 140, height: 140 }, editAs: 'oneCell' });

            let currentRow = 16; 
            const maxTemplateDataRow = 65; 

            // 1. PRINT BASE MUNICIPALITIES (Inherits template styles naturally)
            fKeys.forEach(loc => {
                const rowData = sheetData[loc] || {};
                const pop = populations[loc] || 0;

                const r = worksheet.getRow(currentRow);
                const toNum = (val) => (val === '' || val === undefined || val === null) ? 0 : parseInt(val, 10);

                r.getCell(1).value = loc; 
                r.getCell(2).value = pop; 
                r.getCell(3).value = toNum(rowData.male); 
                r.getCell(4).value = toNum(rowData.female); 
                r.getCell(6).value = toNum(rowData.ageUnder15); 
                r.getCell(7).value = toNum(rowData.ageOver15); 
                r.getCell(9).value = toNum(rowData.cat1); 
                r.getCell(10).value = toNum(rowData.cat2EligPri); 
                r.getCell(11).value = toNum(rowData.cat2EligBoost); 
                r.getCell(13).value = toNum(rowData.cat2NonElig); 
                r.getCell(15).value = toNum(rowData.cat3EligPri); 
                r.getCell(16).value = toNum(rowData.cat3EligBoost); 
                r.getCell(18).value = toNum(rowData.cat3NonElig); 
                r.getCell(22).value = toNum(rowData.compCat2Pri); 
                r.getCell(23).value = toNum(rowData.compCat2Boost); 
                r.getCell(24).value = toNum(rowData.compCat3PriErig); 
                r.getCell(25).value = toNum(rowData.compCat3PriHrig); 
                r.getCell(27).value = toNum(rowData.compCat3Boost); 
                r.getCell(33).value = toNum(rowData.typeDog); 
                r.getCell(34).value = toNum(rowData.typeCat); 
                r.getCell(35).value = toNum(rowData.typeOthers); 
                r.getCell(36).value = toNum(rowData.statusPet); 
                r.getCell(37).value = toNum(rowData.statusStray); 
                r.getCell(38).value = toNum(rowData.statusUnk); 
                r.getCell(40).value = toNum(rowData.rabiesCases); 

                currentRow++;
            });

            // 2. INJECT SECTION HEADER LABEL & OTHER MUNICIPALITIES (Inherits template styles naturally)
            if (oKeys && oKeys.length > 0) {
                const labelRow = worksheet.getRow(currentRow);
                
                // Purely injects the text. It will look exactly how you formatted this row in your template!
                labelRow.getCell(1).value = 'Other Municipalities / Non-Abra';
                currentRow++;

                oKeys.forEach(loc => {
                    const rowData = sheetData[loc] || {};
                    const pop = populations[loc] || 0;
                    
                    const r = worksheet.getRow(currentRow);
                    const toNum = (val) => (val === '' || val === undefined || val === null) ? 0 : parseInt(val, 10);

                    r.getCell(1).value = loc; 
                    r.getCell(2).value = loc === 'Non-Abra' ? 'N/A' : pop; 
                    r.getCell(3).value = toNum(rowData.male); 
                    r.getCell(4).value = toNum(rowData.female); 
                    r.getCell(6).value = toNum(rowData.ageUnder15); 
                    r.getCell(7).value = toNum(rowData.ageOver15); 
                    r.getCell(9).value = toNum(rowData.cat1); 
                    r.getCell(10).value = toNum(rowData.cat2EligPri); 
                    r.getCell(11).value = toNum(rowData.cat2EligBoost); 
                    r.getCell(13).value = toNum(rowData.cat2NonElig); 
                    r.getCell(15).value = toNum(rowData.cat3EligPri); 
                    r.getCell(16).value = toNum(rowData.cat3EligBoost); 
                    r.getCell(18).value = toNum(rowData.cat3NonElig); 
                    r.getCell(22).value = toNum(rowData.compCat2Pri); 
                    r.getCell(23).value = toNum(rowData.compCat2Boost); 
                    r.getCell(24).value = toNum(rowData.compCat3PriErig); 
                    r.getCell(25).value = toNum(rowData.compCat3PriHrig); 
                    r.getCell(27).value = toNum(rowData.compCat3Boost); 
                    r.getCell(33).value = toNum(rowData.typeDog); 
                    r.getCell(34).value = toNum(rowData.typeCat); 
                    r.getCell(35).value = toNum(rowData.typeOthers); 
                    r.getCell(36).value = toNum(rowData.statusPet); 
                    r.getCell(37).value = toNum(rowData.statusStray); 
                    r.getCell(38).value = toNum(rowData.statusUnk); 
                    r.getCell(40).value = toNum(rowData.rabiesCases); 

                    currentRow++;
                });
            }

            if (currentRow <= maxTemplateDataRow) {
                for (let i = currentRow; i <= maxTemplateDataRow; i++) {
                    worksheet.getRow(i).hidden = true; 
                }
            }

            // The Signatories section retains its RichText structure because it requires 
            // mixing bold and italics inside the exact same cell (which the template can't do natively on an empty cell).
            const sigRow = 70;
            worksheet.getRow(sigRow).height = 140;

            const sigAlignment = { wrapText: true, vertical: 'top', horizontal: 'center' };
            const createSignatoryRichText = (label, name, title) => ({
                richText: [
                    { font: { bold: true, size: 10, name: 'Arial' }, text: `${label}\n\n\n\n\n` }, 
                    { font: { bold: true, size: 10, name: 'Arial' }, text: `${name}\n` },     
                    { font: { italic: true, size: 10, name: 'Arial' }, text: `${title}` }     
                ]
            });

            const sigs = userProfile?.signatories || [];
            let prep = {}, rev = {}, app = {};
            if (sigs.length === 2) {
                prep = sigs[0] || {};
                app = sigs[1] || {};
            } else if (sigs.length >= 3) {
                prep = sigs[0] || {};
                rev = sigs[1] || {};
                app = sigs[2] || {};
            } else if (sigs.length === 1) {
                prep = sigs[0] || {};
            }

            const prepCell = worksheet.getCell(`V${sigRow}`);
            if (prep.name || prep.title) {
                prepCell.value = createSignatoryRichText('Prepared by:', prep.name || '', prep.title || '');
                prepCell.alignment = sigAlignment;
            }

            const revCell = worksheet.getCell(`AB${sigRow}`);
            if (rev.name || rev.title) {
                revCell.value = createSignatoryRichText('Reviewed By:', rev.name || '', rev.title || '');
                revCell.alignment = sigAlignment;
            } else {
                revCell.value = ''; 
            }

            const appCell = worksheet.getCell(`AH${sigRow}`);
            if (app.name || app.title) {
                appCell.value = createSignatoryRichText('Approved By:', app.name || '', app.title || '');
                appCell.alignment = sigAlignment;
            } else {
                appCell.value = createSignatoryRichText('Approved By:', '', '');
                appCell.alignment = sigAlignment;
            }
        };

        let filenameOut = '';

        if (periodType === 'Annual' && rawData) {
            const qMonths = [
                ['January', 'February', 'March'],
                ['April', 'May', 'June'],
                ['July', 'August', 'September'],
                ['October', 'November', 'December']
            ];
            const qNames = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

            for (let i = 0; i < 4; i++) {
                const ws = workbook.getWorksheet(`Quarter ${i + 1}`);
                if (ws) {
                    const aggData = buildAggregatedData(rawData, qMonths[i]);
                    fillSheet(ws, aggData, formRowKeys, otherRowKeys, `${qNames[i]} ${year}`);
                }
            }
            
            const wsSummary = workbook.getWorksheet('Summary');
            if (wsSummary) fillSheet(wsSummary, data, formRowKeys, otherRowKeys, `Annual Summary ${year}`);

            filenameOut = `Animal_Bite_and_Rabies_Report_Form_${facilityName.replace(/\s+/g, '_')}_Annual_${year}.xlsx`;

        } else if (periodType === 'Quarterly') {
            const qNum = String(quarter).replace(/\D/g, ''); 
            const sheetName = `Quarter ${qNum}`;
            
            workbook.worksheets.forEach(ws => {
                if (ws.name !== sheetName) workbook.removeWorksheet(ws.id);
            });

            const ws = workbook.getWorksheet(sheetName);
            if (ws) fillSheet(ws, data, formRowKeys, otherRowKeys, `${formatQuarterName(quarter)} ${year}`);

            filenameOut = `Animal_Bite_and_Rabies_Report_Form_${facilityName.replace(/\s+/g, '_')}_${formatQuarterName(quarter).replace(/\s+/g, '_')}_${year}.xlsx`;
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, filenameOut);

        return true;
    } catch (error) {
        console.error("Excel Export Error:", error);
        throw error;
    }
};

const formatQuarterName = (q) => {
    if (!q) return '';
    if (q.toString().toLowerCase().includes('1')) return '1st Quarter';
    if (q.toString().toLowerCase().includes('2')) return '2nd Quarter';
    if (q.toString().toLowerCase().includes('3')) return '3rd Quarter';
    if (q.toString().toLowerCase().includes('4')) return '4th Quarter';
    return q;
};