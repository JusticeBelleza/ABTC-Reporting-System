import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const useReportData = ({
  user, facilities, facilityBarangays, year, month, quarter, periodType, adminViewMode, selectedFacility
}) => {
  const [reportStatus, setReportStatus] = useState('Not Submitted');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Determine Active Facility
  const isConsolidatedView = adminViewMode === 'consolidated';
  const activeFacilityName = isConsolidatedView 
      ? 'Consolidated' 
      : (user?.role === 'admin' || user?.role === 'SYSADMIN') && selectedFacility 
          ? selectedFacility 
          : user?.facilityName;

  // Determine Host Municipality
  const currentHostMunicipality = activeFacilityName && activeFacilityName !== 'Consolidated' && facilities.includes(activeFacilityName)
      ? facilityBarangays[activeFacilityName]?.[0]?.municipality || ''
      : '';

  // Fetch the Report Status from V2
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      if (!activeFacilityName || activeFacilityName === 'Consolidated') {
        if (isMounted) {
          setReportStatus('Not Submitted');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);

        // Check V2 database for existing report status
        const { data, error } = await supabase
          .from('abtc_reports_v2')
          .select('status')
          .eq('year', year)
          .eq('month', currentPeriod)
          .eq('facility', activeFacilityName)
          .limit(1);

        if (error) throw error;

        if (isMounted) {
          if (data && data.length > 0) {
            setReportStatus(data[0].status || 'Draft');
          } else {
            setReportStatus('Not Submitted');
          }
        }
      } catch (error) {
        console.error("Error fetching V2 report status:", error);
        if (isMounted) setReportStatus('Not Submitted');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();

    return () => { isMounted = false; };
  }, [activeFacilityName, year, month, quarter, periodType]);

  // Delete Report from V2
  const confirmDeleteReport = async () => {
    if (!activeFacilityName) return false;
    setIsSaving(true);
    
    try {
      const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
      
      const { error } = await supabase
        .from('abtc_reports_v2')
        .delete()
        .eq('year', year)
        .eq('month', currentPeriod)
        .eq('facility', activeFacilityName);

      if (error) throw error;

      setReportStatus('Not Submitted');
      toast.success('Report successfully deleted.');
      
      window.location.reload(); 
      return true;
    } catch (err) {
      console.error("Error deleting V2 report:", err);
      toast.error('Failed to delete report.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    reportStatus,
    loading,
    isSaving,
    activeFacilityName,
    currentHostMunicipality,
    confirmDeleteReport
  };
};