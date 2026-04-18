import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

// Mock context so we don't need real Auth/Database
const mockAppCtx = {
  user: { role: 'admin' },
  facilities: ['RHU Tayum', 'APH'],
  facilityBarangays: {},
  facilityDetails: {
    'RHU Tayum': { type: 'RHU', ownership: 'Government' }
  },
  globalSettings: {
    outbreak_threshold_percent: 50,
    trend_alert_percent: 10
  }
};

vi.mock('../../context/AppContext', () => ({
  useApp: () => mockAppCtx
}));

// Mock Supabase calls (Specifically for fetching facility metadata)
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve) => {
          if (table === 'facilities') return resolve({ data: [], error: null });
          if (table === 'abtc_reports_v2') return resolve({ data: [], error: null });
          if (table === 'profiles') return resolve({ data: [], error: null });
          return resolve({ data: [], error: null });
        },
      };
    })
  },
  adminHelperClient: {}
}));

// We must mock useReportData since AdminDashboard calls it inside
vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn()
}));

// We must mock zustand store since AdminDashboard uses it
vi.mock('../../store/useReportStore', () => ({
  useReportStore: vi.fn(() => ({
    setInitialData: vi.fn()
  }))
}));

describe('AdminDashboard Access Controls & UI', () => {
  const defaultProps = {
    onViewConsolidated: vi.fn(),
    onSelectFacility: vi.fn(),
    onManageUsers: vi.fn(),
    onAddFacility: vi.fn(),
    periodType: 'Monthly',
    setPeriodType: vi.fn(),
    year: 2026,
    setYear: vi.fn(),
    month: 'January',
    setMonth: vi.fn(),
    quarter: '1st Quarter',
    setQuarter: vi.fn(),
    availableYears: [2026],
    availableMonths: ['January', 'February'],
    initiateDeleteFacility: vi.fn(),
    currentRealYear: 2026,
    currentRealMonthIdx: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Behavior 1: Renders the Admin Dashboard Header', async () => {
    render(<AdminDashboard {...defaultProps} />);
    
    // We use waitFor to silence the React 'act(...)' warning caused by async effects mounting
    await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage and monitor facility submissions province-wide')).toBeInTheDocument();
    });
  });

  it('Behavior 2: Shows Add Facility and Manage Users buttons to Admins', async () => {
    render(<AdminDashboard {...defaultProps} />);
    
    await waitFor(() => {
        expect(screen.getByText('Add Facility')).toBeInTheDocument();
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
    });
  });

  it('Behavior 3: Renders the Summary KPI Cards', async () => {
    render(<AdminDashboard {...defaultProps} />);

    await waitFor(() => {
        // Changed from 'Approved' to 'Approved Reports' to match new UI
        expect(screen.getByText('Approved Reports')).toBeInTheDocument();
        expect(screen.getByText('Pending Reports')).toBeInTheDocument();
        expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
    });
  });

  it('Behavior 4: Shows Empty State when no facilities exist', async () => {
    // Temporarily overwrite the mock to have ZERO facilities
    mockAppCtx.facilities = [];
    
    render(<AdminDashboard {...defaultProps} />);
    
    await waitFor(() => {
        expect(screen.getByText('No Facilities Found')).toBeInTheDocument();
    });

    // Reset the mock for future tests
    mockAppCtx.facilities = ['RHU Tayum', 'APH'];
  });
});