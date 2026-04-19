import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QUARTERS, MONTHS } from '../lib/constants';

export function useForecastingMetrics({
  year, month, quarter, periodType, facilities, user, isAdmin,
  currentDate, currentRealYear, OUTBREAK_SENSITIVITY, TREND_SENSITIVITY,
  facilityDetails, globalSettings
}) {
  const [historicalData, setHistoricalData] = useState([]);
  const [full24MonthData, setFull24MonthData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState([]);
  const [complianceRate, setComplianceRate] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [projectedNextMonth, setProjectedNextMonth] = useState(null);
  const [modelMetrics, setModelMetrics] = useState({ mae: 0, mape: 0, accuracy: 0, validMonths: 0 });
  
  // --- NEW: EXPLICIT YTD TRACKERS ---
  const [totalYtdCases, setTotalYtdCases] = useState(0);
  const [totalPreviousYtdCases, setTotalPreviousYtdCases] = useState(0);

  const facilityType = facilityDetails?.[user?.facility]?.type || 'RHU';
  const areaText = (isAdmin || facilityType === 'Hospital' || facilityType === 'Clinic') ? 'the province' : 'the municipality';
  
  const HIGH_RISK_SENSITIVITY = 1 + ((globalSettings?.high_risk_threshold_percent ?? 25) / 100);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data: popData } = await supabase.from('populations').select('municipality').not('municipality', 'is', null);
        const dynamicMunicipalities = popData ? Array.from(new Set(popData.map(p => p.municipality))) : [];

        let query = supabase.from('abtc_reports_v2').select('*');
        
        if (isAdmin) {
            query = query.eq('status', 'Approved');
        } else {
            query = query.eq('facility', user?.facility);
        }
        
        const { data: reports, error } = await query;

        if (error) throw error;

        if (reports) {
          // --- FIX 1: CALCULATE TRUE YTD IGNORING PERIOD TYPE STRINGS ---
          let trueYtd = 0;
          let truePrevYtd = 0;

          reports.forEach(r => {
              const fName = String(r.facility || '').trim();
              if (isAdmin && (fName === 'PHO' || fName.toLowerCase().includes('provincial') || fName.toLowerCase().includes('admin'))) return;
              if (r.location_name && r.location_name.includes('Outside Catchment')) return;

              const n = (v) => Number(v) || 0;
              const cat2Tot = n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig);
              const cat3Tot = n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig);
              const rTotCases = n(r.cat1) + cat2Tot + cat3Tot;

              if (Number(r.year) === year) trueYtd += rTotCases;
              else if (Number(r.year) === year - 1) truePrevYtd += rTotCases;
          });
          
          setTotalYtdCases(trueYtd);
          setTotalPreviousYtdCases(truePrevYtd);

          let firstReportDate = null;
          reports.forEach(r => {
              if (r.month && MONTHS.includes(r.month)) {
                  const rYear = Number(r.year);
                  const rMonthIdx = MONTHS.indexOf(r.month);
                  if (!firstReportDate || rYear < firstReportDate.year || (rYear === firstReportDate.year && rMonthIdx < firstReportDate.monthIdx)) {
                      firstReportDate = { year: rYear, monthIdx: rMonthIdx };
                  }
              }
          });

          const targetFacilitiesCount = isAdmin ? facilities.length : 1;
          let expectedReports = 0; let actualReports = 0;

          if (periodType === 'Monthly') {
              expectedReports = targetFacilitiesCount;
              actualReports = new Set(reports.filter(r => Number(r.year) === year && r.month === month).map(r => r.facility)).size;
          } else if (periodType === 'Quarterly') {
              const qIdx = QUARTERS.indexOf(quarter);
              const targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]];
              expectedReports = targetFacilitiesCount * 3; 
              actualReports = new Set(reports.filter(r => Number(r.year) === year && targetMonths.includes(r.month)).map(r => `${r.facility}-${r.month}`)).size;
          } else {
              expectedReports = targetFacilitiesCount * 12; 
              actualReports = new Set(reports.filter(r => Number(r.year) === year).map(r => `${r.facility}-${r.month}`)).size;
          }

          let calcRate = expectedReports > 0 ? Math.round((actualReports / expectedReports) * 100) : 0;
          setComplianceRate(Math.min(calcRate, 100));

          const allMonthsRaw = [];
          [year - 1, year].forEach(y => {
             MONTHS.forEach((m) => {
                // Ensure we catch data even if it was saved quarterly/annually
                const periodReports = reports.filter(r => Number(r.year) === y && r.month === m);
                const hasData = periodReports.length > 0;
                
                const mIdx = MONTHS.indexOf(m);
                const isPastOrCurrent = y < currentRealYear || (y === currentRealYear && mIdx <= currentDate.getMonth());
                const isAfterFirstReport = firstReportDate && (y > firstReportDate.year || (y === firstReportDate.year && mIdx >= firstReportDate.monthIdx));
                
                let totalRaw = null; 
                let totalCat3 = 0;
                let totalStray = 0;
                
                if (hasData) {
                    const sums = periodReports.reduce((acc, r) => {
                        const fName = String(r.facility || '').trim();
                        if (isAdmin && (fName === 'PHO' || fName.toLowerCase().includes('provincial') || fName.toLowerCase().includes('admin'))) {
                            return acc;
                        }
                        if (r.location_name && r.location_name.includes('Outside Catchment')) {
                            return acc;
                        }

                        const n = (v) => Number(v) || 0;
                        const cat2Tot = n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig);
                        const cat3Tot = n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig);
                        const rTotCases = n(r.cat1) + cat2Tot + cat3Tot;

                        acc.raw += rTotCases;
                        acc.cat3 += cat3Tot; 
                        acc.stray += n(r.status_stray);

                        return acc;
                    }, { raw: 0, cat3: 0, stray: 0 });

                    totalRaw = sums.raw;
                    totalCat3 = sums.cat3;
                    totalStray = sums.stray;
                } else if (isPastOrCurrent && isAfterFirstReport) {
                    totalRaw = 0; 
                }
                
                allMonthsRaw.push({ 
                    year: y, month: m, 
                    raw: totalRaw, 
                    cat3: totalCat3, 
                    stray: totalStray,
                    display: `${m.substring(0,3)} ${y}` 
                });
             });
          });

          const processed24Months = allMonthsRaw.map((item, idx, arr) => {
              const getAdaptiveWindow = (size) => {
                  const startIdx = Math.max(0, idx - size + 1);
                  const window = arr.slice(startIdx, idx + 1).map(x => x.raw).filter(x => x !== null);
                  return window.length > 0 ? window : null;
              };

              const getAdaptiveWindowHighRisk = (size) => {
                  const startIdx = Math.max(0, idx - size + 1);
                  const window = arr.slice(startIdx, idx + 1).filter(x => x.raw !== null).map(x => x.cat3 + x.stray);
                  return window.length > 0 ? window : null;
              };

              const win3 = getAdaptiveWindow(3);
              const sma3 = win3 ? Math.round(win3.reduce((a, b) => a + b, 0) / win3.length) : null;
              
              const win6 = getAdaptiveWindow(6);
              const sma6 = win6 ? Math.round(win6.reduce((a, b) => a + b, 0) / win6.length) : null;

              const win6_hr = getAdaptiveWindowHighRisk(6);
              const sma6_hr = win6_hr ? Math.round(win6_hr.reduce((a, b) => a + b, 0) / win6_hr.length) : null;
              const current_hr = item.raw !== null ? (item.cat3 + item.stray) : null;

              const win12 = getAdaptiveWindow(12);
              const sma12 = win12 ? Math.round(win12.reduce((a, b) => a + b, 0) / win12.length) : null;

              let wma3 = null;
              if (win3) {
                  if (win3.length === 3) wma3 = Math.round(((win3[0] * 1) + (win3[1] * 2) + (win3[2] * 3)) / 6);
                  else if (win3.length === 2) wma3 = Math.round(((win3[0] * 1) + (win3[1] * 2)) / 3);
                  else if (win3.length === 1) wma3 = win3[0];
              }

              return { ...item, sma3, wma3, sma6, sma12, sma6_hr, current_hr, forecast: null }; 
          });

          const lastValidIdx = processed24Months.findLastIndex(d => d.raw !== null);
          let predictedVal = null;
          
          let absErrSum = 0; 
          let smapeSum = 0; 
          let countForMetrics = 0;
          
          if (lastValidIdx !== -1) {
              for (let i = 1; i <= lastValidIdx; i++) {
                  const prev = processed24Months[i - 1];
                  const currentActual = processed24Months[i].raw;
                  const predictedForCurrent = prev.wma3 !== null ? prev.wma3 : (prev.sma3 !== null ? prev.sma3 : prev.raw);

                  if (predictedForCurrent !== null && predictedForCurrent !== undefined) {
                      processed24Months[i].forecast = predictedForCurrent;
                      
                      if (currentActual !== null) {
                          const err = Math.abs(currentActual - predictedForCurrent);
                          absErrSum += err;
                          
                          const denominator = Math.abs(currentActual) + Math.abs(predictedForCurrent);
                          
                          if (denominator === 0) {
                              smapeSum += 0;
                          } else {
                              const smape = (2 * err) / denominator;
                              smapeSum += smape;
                          }
                          countForMetrics++;
                      }
                  }
              }

              const calcMae = countForMetrics > 0 ? (absErrSum / countForMetrics).toFixed(1) : 0;
              const calcMape = countForMetrics > 0 ? ((smapeSum / countForMetrics) * 100).toFixed(1) : 0;
              const calcAcc = countForMetrics > 0 ? Math.max(0, 100 - calcMape).toFixed(1) : 0;
              
              setModelMetrics({ mae: calcMae, mape: calcMape, accuracy: calcAcc, validMonths: countForMetrics });

              const lastValid = processed24Months[lastValidIdx];
              predictedVal = lastValid.wma3 !== null ? lastValid.wma3 : (lastValid.sma3 !== null ? lastValid.sma3 : lastValid.raw);
              setProjectedNextMonth(predictedVal);

              if (lastValidIdx + 1 < processed24Months.length) {
                  processed24Months[lastValidIdx + 1].forecast = predictedVal;
              } else {
                  processed24Months.push({
                      year: year + 1, month: 'January', display: `Jan ${year + 1}`,
                      raw: null, forecast: predictedVal
                  });
              }
          }
          setFull24MonthData(processed24Months);

          // --- FIX 2: AGGREGATE RUNNING YTD FOR THE CHART MATRIX ---
          let runningCurrentYTD = 0;
          let runningPrevYTD = 0;

          const trendMatrix = MONTHS.map((m) => {
             const curIdx = processed24Months.findIndex(x => x.month === m && x.year === year);
             const curMonthData = processed24Months[curIdx];
             const prevMonthData = processed24Months[curIdx - 12];

             if (curMonthData?.raw !== null && curMonthData?.raw !== undefined) {
                 runningCurrentYTD += curMonthData.raw;
             }
             
             if (prevMonthData?.raw !== null && prevMonthData?.raw !== undefined) {
                 runningPrevYTD += prevMonthData.raw;
             }

             return { 
                 month: m.substring(0, 3), 
                 current: curMonthData?.raw, 
                 previous: prevMonthData?.raw,
                 currentYTD: curMonthData?.raw !== null ? runningCurrentYTD : null,
                 previousYTD: prevMonthData?.raw !== null ? runningPrevYTD : null
             };
          });
          setHistoricalData(trendMatrix);

          const validData = processed24Months.filter(d => d.raw !== null);
          const latest = validData[validData.length - 1];
          const previous = validData[validData.length - 2];
          
          let alerts = [];
          let currentRisk = 'LOW';

          if (latest && latest.wma3 !== null && validData.length >= 3) {
              let diffPercent = 0;
              if (latest.sma3 > 0) diffPercent = ((latest.wma3 - latest.sma3) / latest.sma3) * 100;

              let isHighRisk = false;

              if (latest.current_hr !== null && latest.sma6_hr !== null && latest.current_hr >= 3) {
                  if (latest.current_hr > (latest.sma6_hr * HIGH_RISK_SENSITIVITY)) {
                      alerts.unshift({ 
                          type: 'critical', 
                          title: 'High-Risk Rabies Indicator', 
                          desc: `Critical spike in Category 3 exposures and Stray Animal bites detected. High probability of a rabid animal incident in ${areaText}.` 
                      });
                      isHighRisk = true;
                  }
              }

              if (latest.raw && latest.sma6 && latest.raw > (latest.sma6 * OUTBREAK_SENSITIVITY)) {
                  alerts.push({ 
                      type: 'critical', 
                      title: 'Volume Anomaly Detected', 
                      desc: `Current total case volume is over ${(OUTBREAK_SENSITIVITY - 1) * 100}% higher than the 6-month baseline. Immediate review recommended.` 
                  });
                  isHighRisk = true;
              }

              if (diffPercent > 0 && previous?.sma6 && latest.sma6 > previous.sma6) {
                  alerts.push({ type: 'critical', title: 'Sustained Risk', desc: 'Both fast-signal (WMA) and mid-term (6M) trends are actively rising.' });
                  isHighRisk = true;
              }

              if (isHighRisk) {
                  currentRisk = 'HIGH';
              } else {
                  if (diffPercent > TREND_SENSITIVITY) {
                      alerts.push({ type: 'warning', title: 'Rising Trend Signal', desc: `Short-term projected cases are accelerating (${diffPercent.toFixed(1)}% above average).` });
                      currentRisk = 'MODERATE';
                  } else if (diffPercent < -TREND_SENSITIVITY) {
                      alerts.push({ type: 'success', title: 'Decreasing Trend', desc: `Cases are dropping (${Math.abs(diffPercent).toFixed(1)}% below average).` });
                      currentRisk = 'LOW';
                  } else {
                      alerts.push({ type: 'info', title: 'Stable Volume', desc: `Short-term and mid-term averages are closely aligned (< ${TREND_SENSITIVITY}% variance).` });
                      currentRisk = 'LOW';
                  }
              }
          } else {
              alerts.push({ type: 'info', title: 'Gathering Baseline Data', desc: 'The system requires at least 3 months of continuous data to generate reliable alerts and outbreak indicators.' });
              currentRisk = 'LOW';
          }

          setSmartAlerts(alerts);
          setRiskLevel(currentRisk);
        }
      } catch (err) { console.error("Analytics Error:", err); }
      finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, [year, month, quarter, periodType, facilities.length, user, isAdmin, currentDate, currentRealYear, OUTBREAK_SENSITIVITY, TREND_SENSITIVITY, HIGH_RISK_SENSITIVITY, areaText]);

  // Make sure to return the new YTD variables!!
  return { 
      historicalData, 
      full24MonthData, 
      loadingHistory, 
      smartAlerts, 
      complianceRate, 
      riskLevel, 
      projectedNextMonth, 
      modelMetrics,
      totalYtdCases, 
      totalPreviousYtdCases 
  };
}