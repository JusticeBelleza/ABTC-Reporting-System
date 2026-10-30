import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useForecastingMetrics } from './useForecastingMetrics';

// 1. MOCK THE SUPABASE DATABASE
let mockReportsData = [];
let mockFacilitiesData = [{ name: 'Facility A', status: 'Active' }];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      let rangeStart = null;
      let rangeEnd = null;
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn((start, end) => {
          rangeStart = start;
          rangeEnd = end;
          return queryBuilder;
        }),
        then: (resolve) => {
          if (table === 'populations') return resolve({ data: [], error: null });
          if (table === 'facilities') return resolve({ data: mockFacilitiesData, error: null });
          if (table === 'abtc_reports_v2') {
            const data = (rangeStart !== null && rangeEnd !== null)
              ? mockReportsData.slice(rangeStart, rangeEnd + 1)
              : mockReportsData;
            return resolve({ data, error: null });
          }
          return resolve({ data: [], error: null });
        },
      };
      return queryBuilder;
    }),
  },
}));

vi.mock('../lib/constants', () => ({
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  QUARTERS: ['Q1', 'Q2', 'Q3', 'Q4']
}));

describe('useForecastingMetrics', () => {
  const baseProps = {
    year: 2026,
    month: 'April',
    quarter: 'Q2',
    periodType: 'Monthly',
    facilities: ['Facility A'],
    user: { facility: 'Facility A', role: 'admin' },
    isAdmin: true,
    currentDate: new Date('2026-04-18'), // The system thinks it's April
    currentRealYear: 2026,
    OUTBREAK_SENSITIVITY: 1.5, // 50%
    TREND_SENSITIVITY: 10,     // 10%
    globalSettings: { high_risk_threshold_percent: 25 }, // 1.25 multiplier
    facilityDetails: {}
  };

  beforeEach(() => {
    mockReportsData = [];
    mockFacilitiesData = [{ name: 'Facility A', status: 'Active' }];
    vi.clearAllMocks();
  });

  it('1. Should return LOW risk and a gathering data message when there is no data', async () => {
    mockReportsData = []; 

    const { result } = renderHook(() => useForecastingMetrics(baseProps));

    await waitFor(() => expect(result.current.loadingHistory).toBe(false));

    expect(result.current.riskLevel).toBe('LOW');
    expect(result.current.smartAlerts[0].title).toBe('Gathering Baseline Data');
  });

  it('2. Should stay LOW risk when data is stable across 6 months', async () => {
    // Generate 6 months of perfectly stable data ending in APRIL
    mockReportsData = ['November', 'December', 'January', 'February', 'March', 'April'].map((m, i) => ({
      year: i < 2 ? 2025 : 2026,
      month: m,
      facility: 'Facility A',
      status: 'Approved',
      cat1: 9, cat3_elig_pri: 1, status_stray: 0 // 10 total cases, 1 high-risk score
    }));

    const { result } = renderHook(() => useForecastingMetrics(baseProps));

    await waitFor(() => expect(result.current.loadingHistory).toBe(false));

    expect(result.current.riskLevel).toBe('LOW');
    expect(result.current.smartAlerts[0].title).toBe('Stable Volume');
  });

  it('3. Should trigger CRITICAL ALERT when Stray + Cat3 cases spike (High-Risk Rabies Indicator)', async () => {
    // Baseline: 5 months of very low risk ending in March (10 total cases, 1 Cat3 = Score of 1)
    const baseline = ['November', 'December', 'January', 'February', 'March'].map((m, i) => ({
      year: i < 2 ? 2025 : 2026,
      month: m,
      facility: 'Facility A',
      status: 'Approved',
      cat1: 9, cat3_elig_pri: 1, status_stray: 0 
    }));

    // Spike: April suddenly gets 3 Cat3 and 2 Strays (Score of 5)
    // Note: Total volume is still 10, so it shouldn't trigger a standard volume outbreak, ONLY a High-Risk Outbreak!
    const spikeMonth = {
      year: 2026,
      month: 'April',
      facility: 'Facility A',
      status: 'Approved',
      cat1: 7, cat3_elig_pri: 3, status_stray: 2 
    };

    mockReportsData = [...baseline, spikeMonth];

    const { result } = renderHook(() => useForecastingMetrics(baseProps));

    await waitFor(() => expect(result.current.loadingHistory).toBe(false));

    // Verify the math worked!
    expect(result.current.riskLevel).toBe('HIGH');
    
    // The top alert should be our brand new Rabies Indicator
    const topAlert = result.current.smartAlerts[0];
    expect(topAlert.title).toBe('High-Risk Rabies Indicator');
    expect(topAlert.type).toBe('critical');
    expect(topAlert.desc).toContain('Critical spike in Category 3 exposures and Stray Animal bites detected');
  });

  it('4. Should stabilize forecasting when current month has partial in-flight reporting', async () => {
    // 5 months of steady 100 cases (May - Sep 2026)
    const steadyMonths = ['May', 'June', 'July', 'August', 'September'].map(m => ({
      year: 2026,
      month: m,
      facility: 'Facility A',
      status: 'Approved',
      cat1: 90, cat3_elig_pri: 10, status_stray: 0 // 100 total cases
    }));

    // Incomplete October report (only 10 cases so far because today is Oct 30 and reporting window is open)
    const incompleteOctober = {
      year: 2026,
      month: 'October',
      facility: 'Facility A',
      status: 'Approved',
      cat1: 10, cat3_elig_pri: 0, status_stray: 0
    };

    mockReportsData = [...steadyMonths, incompleteOctober];
    mockFacilitiesData = [
      { name: 'Facility A', status: 'Active' },
      { name: 'Facility B', status: 'Active' },
      { name: 'Facility C', status: 'Active' },
      { name: 'Facility D', status: 'Active' },
      { name: 'Facility E', status: 'Active' }
    ];

    const octProps = {
      ...baseProps,
      month: 'October',
      currentDate: new Date('2026-10-30'),
      facilities: ['Facility A', 'Facility B', 'Facility C', 'Facility D', 'Facility E'] // 5 facilities total, only 1 approved = 20% (<80%)
    };

    const { result } = renderHook(() => useForecastingMetrics(octProps));

    await waitFor(() => expect(result.current.loadingHistory).toBe(false));

    // October should be identified as in-flight
    expect(result.current.inFlightMonth).not.toBeNull();
    expect(result.current.inFlightMonth.month).toBe('October');

    // Forecast should be stabilized near 100 cases, NOT collapsed down into the 30s/40s
    expect(result.current.projectedNextMonth).toBeGreaterThanOrEqual(95);
    expect(result.current.projectedNextMonth).toBeLessThanOrEqual(105);

    // Risk should stay LOW (not artificially triggered by incomplete data)
    expect(result.current.riskLevel).toBe('LOW');

    // Target forecast period should be the active in-flight month (October 2026)
    expect(result.current.targetForecastMonth).toBe('October 2026');

    const fullData = result.current.full24MonthData;
    const sepItem = fullData.find(d => d.month === 'September' && d.year === 2026);
    const octItem = fullData.find(d => d.month === 'October' && d.year === 2026);
    const novItem = fullData.find(d => d.month === 'November' && d.year === 2026);

    // September (finalized) has historical moving averages
    expect(sepItem.sma3).not.toBeNull();
    expect(sepItem.wma3).not.toBeNull();

    // October (in-flight) gets the step-ahead forecast, but historical SMAs stop at September
    expect(octItem.forecast).toBeGreaterThanOrEqual(95);
    expect(octItem.forecast).toBeLessThanOrEqual(105);
    expect(octItem.sma3).toBeNull();
    expect(octItem.wma3).toBeNull();

    // November (future) must NOT have forecast or SMAs while October is open
    expect(novItem.forecast).toBeNull();
    expect(novItem.sma3).toBeNull();
    expect(novItem.wma3).toBeNull();
  });
});
