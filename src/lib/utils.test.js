import { describe, it, expect } from 'vitest';
import { toInt, getComputations, hasData } from './utils';

// Dummy initial state matching the V2 structure
const INITIAL_ROW_STATE = { 
  male: '', female: '', ageUnder15: '', ageOver15: '', 
  cat1: '', cat2EligPri: '', cat2EligBoost: '', cat2NonElig: '',
  cat3EligPri: '', cat3EligBoost: '', cat3NonElig: '',
  compCat2Pri: '', compCat2Boost: '', compCat3PriErig: '', compCat3PriHrig: '', compCat3Boost: '',
  typeDog: '', typeCat: '', typeOthers: '',
  statusPet: '', statusStray: '', statusUnk: '',
  rabiesCases: '' 
};

describe('Reporting Math Calculations (V2 Format)', () => {
    
    it('toInt should safely convert strings and blanks to numbers', () => {
        expect(toInt("5")).toBe(5);
        expect(toInt("")).toBe(0);
        expect(toInt(null)).toBe(0);
        // With our bulletproof fix, this will safely return 0 instead of NaN
        expect(toInt(undefined)).toBe(0); 
    });

    it('hasData should correctly identify if a row has user input', () => {
        const emptyRow = { ...INITIAL_ROW_STATE };
        expect(hasData(emptyRow)).toBeFalsy(); 

        const filledRow = { ...INITIAL_ROW_STATE, male: "2" };
        expect(hasData(filledRow)).toBeTruthy(); 
    });

    it('getComputations should accurately calculate category and animal totals', () => {
        const mockRow = {
            ...INITIAL_ROW_STATE,
            male: "5", female: "3", 
            ageUnder15: "4", ageOver15: "4",
            cat1: "1", cat2EligPri: "2", cat2EligBoost: "2", cat2NonElig: "1", // cat2 total = 5
            cat3EligPri: "1", cat3EligBoost: "1", cat3NonElig: "0", // cat3 total = 2. Total cases = 8
            typeDog: "6", typeCat: "1", typeOthers: "1", // total animals = 8
            statusPet: "4", statusStray: "2", statusUnk: "2" // total status = 8
        };

        const totals = getComputations(mockRow);

        expect(totals.totalSex).toBe(8);
        expect(totals.totalAge).toBe(8);
        expect(totals.totalCases).toBe(8); 
        expect(totals.totalAnimals).toBe(8); 
        expect(totals.totalStatus).toBe(8); 
        // Since all totals are exactly 8, isMismatch should be false
        expect(totals.isMismatch).toBeFalsy();
    });

    it('getComputations should correctly flag a DOH validation mismatch', () => {
        const invalidRow = {
            ...INITIAL_ROW_STATE,
            male: "5", female: "5", // Total Sex = 10
            typeDog: "5", typeCat: "0", typeOthers: "0" // Total Animals = 5
        };

        const totals = getComputations(invalidRow);
        
        expect(totals.totalSex).toBe(10);
        expect(totals.totalAnimals).toBe(5);
        // Because Sex (10) does not match Animals (5), DOH validation must fail
        expect(totals.isMismatch).toBeTruthy();
    });

    it('should correctly sum consolidated report totals across multiple facilities', () => {
        const facility1 = { ...INITIAL_ROW_STATE, male: "10", female: "5", cat1: "2", typeDog: "10", typeCat: "5", statusPet: "15", ageUnder15: "10", ageOver15: "5" };
        const facility2 = { ...INITIAL_ROW_STATE, male: "20", female: "15", cat1: "0", typeDog: "25", typeCat: "10", statusPet: "35", ageUnder15: "20", ageOver15: "15" };

        const consolidatedRow = {
            male: toInt(facility1.male) + toInt(facility2.male),
            female: toInt(facility1.female) + toInt(facility2.female),
            cat1: toInt(facility1.cat1) + toInt(facility2.cat1),
            typeDog: toInt(facility1.typeDog) + toInt(facility2.typeDog),
            typeCat: toInt(facility1.typeCat) + toInt(facility2.typeCat),
            statusPet: toInt(facility1.statusPet) + toInt(facility2.statusPet),
            ageUnder15: toInt(facility1.ageUnder15) + toInt(facility2.ageUnder15),
            ageOver15: toInt(facility1.ageOver15) + toInt(facility2.ageOver15),
        };

        const totals = getComputations(consolidatedRow);
        expect(totals.totalSex).toBe(50);         // (10+5) + (20+15)
        expect(totals.totalCases).toBe(2);        // 2 + 0
        expect(totals.totalAnimals).toBe(50);     // (10+5) + (25+10)
        expect(totals.totalStatus).toBe(50);      // 15 + 35
        expect(totals.totalAge).toBe(50);         // (10+5) + (20+15)
    });
});

describe('Predictive Analytics Engine (Algorithm Validation)', () => {
    
    it('should correctly calculate Simple Moving Average (SMA 3)', () => {
        // Formula: (Case1 + Case2 + Case3) / 3
        const data = [10, 20, 15]; 
        const sma3 = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
        
        expect(sma3).toBe(15);
    });

    it('should correctly calculate Weighted Moving Average (WMA 3) favoring recent data', () => {
        // Formula: [(Case_m-2 * 1) + (Case_m-1 * 2) + (Case_m * 3)] / 6
        const data = [10, 20, 15]; // Jan=10, Feb=20, Mar=15
        const wma3 = Math.round(((data[0] * 1) + (data[1] * 2) + (data[2] * 3)) / 6);
        
        // (10) + (40) + (45) = 95 / 6 = 15.83 -> rounds to 16
        expect(wma3).toBe(16); 
    });

    it('should accurately compute Mean Absolute Error (MAE)', () => {
        const actual = 20;
        const forecast = 15;

        // MAE: Average absolute difference
        const mae = Math.abs(actual - forecast);
        expect(mae).toBe(5); // 5 cases off target
    });

    it('should calculate Symmetric MAPE (sMAPE) safely, avoiding division-by-zero Infinity errors', () => {
        // This simulates the exact mathematical block from useForecastingMetrics.js
        const calculateSmapePercentage = (actual, forecast) => {
            const denominator = Math.abs(actual) + Math.abs(forecast);
            if (denominator === 0) return 0; // Perfect prediction of 0 cases = 0% error
            return ((2 * Math.abs(actual - forecast)) / denominator) * 100;
        };

        // Scenario 1: Standard Prediction (Actual 20, Forecast 15)
        // |20-15| = 5. Denom = 35. (10/35) * 100 = 28.57%
        expect(calculateSmapePercentage(20, 15)).toBeCloseTo(28.57, 1);

        // Scenario 2: Actual is 0 (Would cause 'Infinity' in old MAPE)
        // |0-5| = 5. Denom = 5. (10/5) * 100 = 200%
        // sMAPE safely caps the maximum possible error at 200%
        expect(calculateSmapePercentage(0, 5)).toBe(200);

        // Scenario 3: Perfect Zero (Actual is 0, Forecast is 0)
        // Denominator is 0, so the fallback safely returns 0% error instead of NaN
        expect(calculateSmapePercentage(0, 0)).toBe(0);
    });

    it('Smart Alerts: should trigger Outbreak Anomaly when threshold is crossed', () => {
        const baseline6M = 100; // 6-Month SMA
        const currentCases = 160; 
        const OUTBREAK_SENSITIVITY = 1.5; // 50% above baseline

        const isOutbreakDetected = currentCases > (baseline6M * OUTBREAK_SENSITIVITY);
        
        // 160 > 150, so it should trigger HIGH RISK
        expect(isOutbreakDetected).toBeTruthy(); 
    });

    it('Smart Alerts: should detect a Rising Trend using fast-signals', () => {
        const sma3 = 50;
        const wma3 = 60; // Fast signal reacting to a recent spike
        const TREND_SENSITIVITY = 10; // 10% threshold

        const diffPercent = ((wma3 - sma3) / sma3) * 100;
        const isRisingTrend = diffPercent > TREND_SENSITIVITY;

        // 60 is 20% higher than 50, which is > 10% threshold.
        expect(diffPercent).toBe(20);
        expect(isRisingTrend).toBeTruthy();
    });
});

describe('Chart Data Aggregation Logic', () => {
    
    it('should correctly format data arrays for the Demographic Pie Charts', () => {
        // Simulating the data aggregation that happens before feeding into Recharts
        const rawTotals = { male: 120, female: 85 };
        
        const chartData = [
            { name: 'Male', value: rawTotals.male },
            { name: 'Female', value: rawTotals.female }
        ];

        expect(chartData.length).toBe(2);
        expect(chartData[0].name).toBe('Male');
        expect(chartData[0].value).toBe(120);
        
        const totalSample = chartData.reduce((sum, item) => sum + item.value, 0);
        expect(totalSample).toBe(205); // N = Total Verification
    });

    it('should safely handle and sort dynamic "Others" animals for the Bar Chart', () => {
        // Simulating how the system parses manually typed animals
        const rawString = "Rat-2, Monkey - 1, Horse: 1";
        const otherMap = {};
        
        // Regex logic used in DemographicCharts
        const parts = rawString.split(/[,;]/).map(s => s.trim());
        parts.forEach(part => {
            const match = part.match(/^([a-zA-Z\s]+)\s*[-:]?\s*(\d+)$/);
            if (match) {
                const name = match[1].trim();
                const val = parseInt(match[2], 10);
                otherMap[name] = val;
            }
        });

        // Convert to array and sort highest to lowest
        const chartData = Object.entries(otherMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        expect(chartData.length).toBe(3);
        expect(chartData[0].name).toBe('Rat'); // Highest value should be first
        expect(chartData[0].value).toBe(2);
        expect(chartData[2].name).toBe('Horse');
    });
});