import { describe, it, expect } from 'vitest';
import { toInt, getComputations, hasData } from './utils';
import { INITIAL_ROW_STATE } from './constants';

describe('Reporting Math Calculations', () => {
    
    it('toInt should safely convert strings and blanks to numbers', () => {
        expect(toInt("5")).toBe(5);
        expect(toInt("")).toBe(0);
        expect(toInt(null)).toBe(0);
        // With our new bulletproof fix, this will now safely return 0 instead of NaN!
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
            othersCount: "0"
        };

        const totals = getComputations(mockRow);

        expect(totals.sexTotal).toBe(8);
        expect(totals.ageTotal).toBe(8);
        expect(totals.cat23).toBe(7);
        expect(totals.catTotal).toBe(8);
        expect(totals.animalTotal).toBe(7);
    });
});