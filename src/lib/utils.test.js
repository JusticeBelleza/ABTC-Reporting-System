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
        // toBeFalsy() accepts false, "", 0, null, etc.
        expect(hasData(emptyRow)).toBeFalsy(); 

        const filledRow = { ...INITIAL_ROW_STATE, male: "2" };
        // truthy() accepts true, "text", 1, etc.
        expect(hasData(filledRow)).toBeTruthy(); 
    });

    it('getComputations should accurately calculate category and animal totals', () => {
        const mockRow = {
            ...INITIAL_ROW_STATE,
            male: "5",
            female: "3",
            ageLt15: "4",
            ageGt15: "4",
            cat1: "1",
            cat2: "5",
            cat3: "2",
            dog: "6",
            cat: "1",
            othersCount: "0",
            washed: "7"
        };

        const totals = getComputations(mockRow);

        expect(totals.sexTotal).toBe(8);
        expect(totals.ageTotal).toBe(8);
        expect(totals.cat23).toBe(7);
        expect(totals.catTotal).toBe(8);
        expect(totals.animalTotal).toBe(7); // 6 dogs + 1 cat
        expect(totals.percent).toBe('100%'); // 7 washed / 7 animals = 100%
    });

    it('should correctly sum and calculate consolidated report totals across multiple facilities', () => {
        // Simulate data from Facility A
        const facility1 = {
            ...INITIAL_ROW_STATE,
            male: "10", female: "5", ageLt15: "7", ageGt15: "8",
            cat1: "2", cat2: "8", cat3: "5", dog: "10", cat: "3", othersCount: "2", washed: "15"
        };
        
        // Simulate data from Facility B
        const facility2 = {
            ...INITIAL_ROW_STATE,
            male: "20", female: "15", ageLt15: "15", ageGt15: "20",
            cat1: "0", cat2: "20", cat3: "15", dog: "25", cat: "10", othersCount: "0", washed: "35"
        };

        // Simulate the consolidated data row aggregation logic
        const consolidatedRow = {
            male: toInt(facility1.male) + toInt(facility2.male),
            female: toInt(facility1.female) + toInt(facility2.female),
            ageLt15: toInt(facility1.ageLt15) + toInt(facility2.ageLt15),
            ageGt15: toInt(facility1.ageGt15) + toInt(facility2.ageGt15),
            cat1: toInt(facility1.cat1) + toInt(facility2.cat1),
            cat2: toInt(facility1.cat2) + toInt(facility2.cat2),
            cat3: toInt(facility1.cat3) + toInt(facility2.cat3),
            dog: toInt(facility1.dog) + toInt(facility2.dog),
            cat: toInt(facility1.cat) + toInt(facility2.cat),
            othersCount: toInt(facility1.othersCount) + toInt(facility2.othersCount),
            washed: toInt(facility1.washed) + toInt(facility2.washed),
        };

        const totals = getComputations(consolidatedRow);

        // Assertions for Consolidated Math
        expect(totals.sexTotal).toBe(50);         // (10+5) + (20+15) = 50
        expect(totals.ageTotal).toBe(50);         // (7+8) + (15+20) = 50
        expect(totals.cat23).toBe(48);            // (8+5) + (20+15) = 48
        expect(totals.catTotal).toBe(50);         // 48 + (2+0) = 50
        expect(totals.animalTotal).toBe(50);      // (10+3+2) + (25+10+0) = 50
        expect(totals.percent).toBe('100%');      // Washed (15+35=50) / AnimalTotal (50) = 100%
        expect(totals.sexMismatch).toBeFalsy();   // 50 === 50 (No mismatch)
    });
});