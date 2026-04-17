import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

// --- MOCK APP CONTEXT ---
const mockUseApp = vi.fn();
vi.mock('../../context/AppContext', () => ({
  useApp: () => mockUseApp(),
}));

// --- MOCK REPORT STORE ---
vi.mock('../../store/useReportStore', () => ({
  useReportStore: Object.assign(
    (selector) => selector({
      setInitialData: vi.fn(),
      reset: vi.fn()
    }),
    { getState: () => ({ reset: vi.fn() }) }
  ),
}));

// --- MOCK CUSTOM HOOK ---
// This prevents the component from trying to fetch real data
vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn().mockReturnValue({ loading: false }),
}));

// --- MOCK SUPABASE ---
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('AdminDashboard Access Controls & UI', () => {
  
  const defaultProps = {
    periodType: 'Monthly',
    year: 2026,
    month: 'January',
    quarter: '1st Quarter',
    availableYears: [2026],
    availableMonths: ['January', 'February'],
    facilities: ['Bangued RHU', 'Dolores RHU'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Behavior 1: Renders the Admin Dashboard Header', () => {
    mockUseApp.mockReturnValue({
      user: { role: 'admin' },
      facilities: ['Bangued RHU'],
      facilityDetails: {},
    });

    render(<AdminDashboard {...defaultProps} />);
    
    // Check if the main title renders
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage and monitor facility submissions province-wide')).toBeInTheDocument();
  });

  it('Behavior 2: Shows Add Facility and Manage Users buttons to Admins', () => {
    mockUseApp.mockReturnValue({
      user: { role: 'admin' },
      facilities: [],
      facilityDetails: {},
    });

    render(<AdminDashboard {...defaultProps} />);
    
    expect(screen.getByText('Add Facility')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
  });

  it('Behavior 3: Renders the Summary KPI Cards', () => {
    mockUseApp.mockReturnValue({
      user: { role: 'admin' },
      facilities: [],
      facilityDetails: {},
    });

    render(<AdminDashboard {...defaultProps} />);
    
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
  });

  it('Behavior 4: Shows Empty State when no facilities exist', () => {
    mockUseApp.mockReturnValue({
      user: { role: 'admin' },
      facilities: [],
      facilityDetails: {},
    });

    render(<AdminDashboard {...defaultProps} />);
    
    expect(screen.getByText('No Facilities Found')).toBeInTheDocument();
  });

});