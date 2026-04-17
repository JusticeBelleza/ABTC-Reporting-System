import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useForecastingMetrics } from './useForecastingMetrics';

// 1. MOCK THE SUPABASE DATABASE
let mockReportsData = [];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (resolve) => {
          if (table === 'populations') return resolve({ data: [], error: null });
          if (table === 'abtc_reports_v2') return resolve({ data: mockReportsData, error: null });
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
});