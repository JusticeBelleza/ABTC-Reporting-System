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
  
  // FIX: Make sure we check user?.facility instead of user?.facilityName!
  const activeFacilityName = isConsolidatedView 
      ? 'Consolidated' 
      : (user?.role === 'admin' || user?.role === 'SYSADMIN') && selectedFacility 
          ? selectedFacility 
          : user?.facility; 

  // Determine Host Municipality dynamically from the facility name
  const currentHostMunicipality = activeFacilityName && activeFacilityName !== 'Consolidated'
      ? activeFacilityName.replace(' RHU', '').replace(' Hospital', '').replace(' Clinic', '').trim()
      : '';

  // Fetch the Report Status from V2
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      // Don't try to fetch if we haven't loaded the user's facility yet
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

      // Also log the deletion to audit logs
      const actorName = user?.fullName || user?.email || 'Facility User';
      await supabase.from('audit_logs').insert([{
         facility_name: activeFacilityName,
         action: 'DELETED',
         report_type: 'Form 1 Report',
         period_info: `${activeFacilityName} - ${currentPeriod} ${year}`,
         actor_name: actorName
      }]);

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