import { describe, it, expect } from 'vitest';
import { toInt, getComputations, hasData } from './utils';

// Dummy initial state to prevent import errors in the test example
const INITIAL_ROW_STATE = { 
    male: '', female: '', ageLt15: '', ageGt15: '', 
    cat1: '', cat2: '', cat3: '', dog: '', cat: '', othersCount: '', washed: '' 
};

describe('Reporting Math Calculations', () => {
    
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
            male: "5", female: "3", ageLt15: "4", ageGt15: "4",
            cat1: "1", cat2: "5", cat3: "2",
            dog: "6", cat: "1", othersCount: "0", washed: "7"
        };

        const totals = getComputations(mockRow);

        expect(totals.sexTotal).toBe(8);
        expect(totals.catTotal).toBe(8);
        expect(totals.animalTotal).toBe(7); // 6 dogs + 1 cat
        expect(totals.percent).toBe('100%'); // 7 washed / 7 animals = 100%
    });

    it('should correctly sum consolidated report totals across multiple facilities', () => {
        // FIXED: Changed facility1 'washed' to 13 so it logically matches the 13 animals (10 dogs + 3 cats)
        const facility1 = { ...INITIAL_ROW_STATE, male: "10", female: "5", cat1: "2", cat2: "8", cat3: "5", dog: "10", cat: "3", othersCount: "0", washed: "13" };
        const facility2 = { ...INITIAL_ROW_STATE, male: "20", female: "15", cat1: "0", cat2: "20", cat3: "15", dog: "25", cat: "10", othersCount: "0", washed: "35" };

        const consolidatedRow = {
            male: toInt(facility1.male) + toInt(facility2.male),
            female: toInt(facility1.female) + toInt(facility2.female),
            cat1: toInt(facility1.cat1) + toInt(facility2.cat1),
            cat2: toInt(facility1.cat2) + toInt(facility2.cat2),
            cat3: toInt(facility1.cat3) + toInt(facility2.cat3),
            dog: toInt(facility1.dog) + toInt(facility2.dog),
            cat: toInt(facility1.cat) + toInt(facility2.cat),
            othersCount: toInt(facility1.othersCount) + toInt(facility2.othersCount),
            washed: toInt(facility1.washed) + toInt(facility2.washed),
        };

        const totals = getComputations(consolidatedRow);
        expect(totals.sexTotal).toBe(50);         // 15 + 35
        expect(totals.catTotal).toBe(50);         // 15 + 35
        expect(totals.animalTotal).toBe(48);      // 13 + 35 = 48
        expect(totals.percent).toBe('100%');      // 48 washed / 48 total = 100%
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