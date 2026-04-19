import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QUARTERS, MONTHS } from '../lib/constants';

export function useForecastingMetrics({
  year, month, quarter, periodType, facilities, user, isAdmin,
  currentDate, currentRealYear, OUTBREAK_SENSITIVITY, TREND_SENSITIVITY,
  facilityDetails, globalSettings,
  includeAllFacilities = false
}) {
  const [historicalData, setHistoricalData] = useState([]);
  const [full24MonthData, setFull24MonthData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState([]);
  const [complianceRate, setComplianceRate] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [projectedNextMonth, setProjectedNextMonth] = useState(null);
  const [modelMetrics, setModelMetrics] = useState({ mae: 0, mape: 0, accuracy: 0, validMonths: 0 });
  
  const [totalYtdCases, setTotalYtdCases] = useState(0);
  const [totalPreviousYtdCases, setTotalPreviousYtdCases] = useState(0);

  const facilityType = facilityDetails?.[user?.facility]?.type || 'RHU';
  const areaText = (isAdmin || facilityType === 'Hospital' || facilityType === 'Clinic') ? 'the province' : 'the municipality';
  
  const HIGH_RISK_SENSITIVITY = 1 + ((globalSettings?.high_risk_threshold_percent ?? 25) / 100);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        let query = supabase.from('abtc_reports_v2').select('*');
        
        // As requested: Strictly ONLY Approved forms.
        if (isAdmin || includeAllFacilities) {
          query = query.eq('status', 'Approved');
        } else {
          query = query.eq('facility', user?.facility);
        }
        
        const { data: reports, error } = await query;
        if (error) throw error;

        if (reports) {
          const monthlyBuckets = {}; 
          [year - 1, year, year + 1].forEach(y => {
            monthlyBuckets[y] = {};
            MONTHS.forEach(m => {
              monthlyBuckets[y][m] = { raw: 0, cat3: 0, stray: 0, hasData: false };
            });
          });

          let trueYtd = 0;
          let truePrevYtd = 0;
          let firstReportDate = null;

          reports.forEach(r => {
            // REMOVED THE FILTERS THAT WERE HIDING YOUR TEST DATA!
            // It will now count all facilities and all locations perfectly.

            const rYear = Number(r.year);
            if (!monthlyBuckets[rYear]) return;

            // Handle both snake_case and camelCase just in case
            const n = (v) => Number(v) || 0;
            const cat2Tot = n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig) + n(r.cat2EligPri) + n(r.cat2EligBoost) + n(r.cat2NonElig);
            const cat3Tot = n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig) + n(r.cat3EligPri) + n(r.cat3EligBoost) + n(r.cat3NonElig);
            const rTotCases = n(r.cat1) + cat2Tot + cat3Tot;
            const rStray = n(r.status_stray) + n(r.statusStray);

            if (rYear === year) trueYtd += rTotCases;
            else if (rYear === year - 1) truePrevYtd += rTotCases;

            const inject = (mName, val, c3, st) => {
              if (monthlyBuckets[rYear][mName]) {
                monthlyBuckets[rYear][mName].raw += val;
                monthlyBuckets[rYear][mName].cat3 += c3;
                monthlyBuckets[rYear][mName].stray += st;
                monthlyBuckets[rYear][mName].hasData = true;
              }
            };

            const dbMonth = String(r.month || '').trim().toLowerCase();

            if (dbMonth === 'annual') {
                MONTHS.forEach(m => inject(m, rTotCases / 12, cat3Tot / 12, rStray / 12));
            } else if (dbMonth.includes('quarter')) {
                const qNum = parseInt(dbMonth.charAt(0));
                if (!isNaN(qNum) && qNum >= 1 && qNum <= 4) {
                    const targetMonths = MONTHS.slice((qNum - 1) * 3, qNum * 3);
                    targetMonths.forEach(m => inject(m, rTotCases / 3, cat3Tot / 3, rStray / 3));
                }
            } else {
                // Case-insensitive match for the exact month
                const exactMonth = MONTHS.find(m => m.toLowerCase() === dbMonth);
                if (exactMonth) {
                    inject(exactMonth, rTotCases, cat3Tot, rStray);
                    
                    let mIdx = MONTHS.indexOf(exactMonth);
                    if (!firstReportDate || rYear < firstReportDate.year || (rYear === firstReportDate.year && mIdx < firstReportDate.monthIdx)) {
                      firstReportDate = { year: rYear, monthIdx: mIdx };
                    }
                }
            }
          });
          
          setTotalYtdCases(Math.round(trueYtd));
          setTotalPreviousYtdCases(Math.round(truePrevYtd));

          const allMonthsRaw = [];
          [year - 1, year].forEach(y => {
             MONTHS.forEach((m) => {
                const bucket = monthlyBuckets[y][m];
                const mIdx = MONTHS.indexOf(m);
                const isPastOrCurrent = y < currentRealYear || (y === currentRealYear && mIdx <= currentDate.getMonth());
                const isAfterFirstReport = firstReportDate && (y > firstReportDate.year || (y === firstReportDate.year && mIdx >= firstReportDate.monthIdx));
                
                let rawVal = bucket.hasData ? Math.round(bucket.raw) : null;
                if (rawVal === null && isPastOrCurrent && isAfterFirstReport) {
                    rawVal = 0;
                }
                
                allMonthsRaw.push({ 
                    year: y, month: m, 
                    raw: rawVal, 
                    cat3: Math.round(bucket.cat3), 
                    stray: Math.round(bucket.stray),
                    display: `${m.substring(0,3)} ${y}` 
                });
             });
          });

          const processed24Months = allMonthsRaw.map((item, idx, arr) => {
              const getAvg = (size) => {
                  const start = Math.max(0, idx - size + 1);
                  const window = arr.slice(start, idx + 1).map(x => x.raw).filter(x => x !== null);
                  return window.length > 0 ? Math.round(window.reduce((a, b) => a + b, 0) / window.length) : null;
              };

              const sma3 = getAvg(3);
              const sma6 = getAvg(6);
              const sma12 = getAvg(12);

              let wma3 = null;
              const recent = arr.slice(Math.max(0, idx - 2), idx + 1).filter(x => x.raw !== null);
              if (recent.length === 3) {
                  wma3 = Math.round(((recent[0].raw * 1) + (recent[1].raw * 2) + (recent[2].raw * 3)) / 6);
              } else {
                  wma3 = sma3;
              }

              return { ...item, sma3, sma6, sma12, wma3, forecast: null };
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
                          if (denominator > 0) {
                              smapeSum += (2 * err) / denominator;
                          }
                          countForMetrics++;
                      }
                  }
              }

              // --- ROUNDED MAE HERE ---
              const calcMae = countForMetrics > 0 ? Math.round(absErrSum / countForMetrics) : 0;
              const calcMape = countForMetrics > 0 ? ((smapeSum / countForMetrics) * 100).toFixed(1) : 0;
              const calcAcc = countForMetrics > 0 ? Math.max(0, 100 - calcMape).toFixed(1) : 0;
              
              setModelMetrics({ mae: calcMae, mape: calcMape, accuracy: calcAcc, validMonths: countForMetrics });

              const last = processed24Months[lastValidIdx];
              predictedVal = last.wma3 !== null ? last.wma3 : (last.sma3 !== null ? last.sma3 : last.raw);
              setProjectedNextMonth(predictedVal);

              if (lastValidIdx + 1 < processed24Months.length) {
                  processed24Months[lastValidIdx + 1].forecast = predictedVal;
              }
          }

          setFull24MonthData(processed24Months);

          let currentRunning = 0;
          let prevRunning = 0;
          const trendMatrix = MONTHS.map((m) => {
              const curIdx = processed24Months.findIndex(x => x.month === m && x.year === year);
              const cur = processed24Months[curIdx];
              const prev = processed24Months[curIdx - 12];

              if (cur?.raw !== null) currentRunning += cur.raw;
              if (prev?.raw !== null) prevRunning += prev.raw;

              return {
                  month: m.substring(0, 3),
                  current: cur?.raw,
                  previous: prev?.raw,
                  currentYTD: cur?.raw !== null ? currentRunning : null,
                  previousYTD: prev?.raw !== null ? prevRunning : null
              };
          });
          setHistoricalData(trendMatrix);

          const latest = processed24Months[lastValidIdx];
          let alerts = [];
          let currentRisk = 'LOW';

          if (latest && lastValidIdx >= 3) {
              const growth = latest.sma3 > 0 ? ((latest.wma3 - latest.sma3) / latest.sma3) * 100 : 0;
              if (latest.raw > (latest.sma6 * OUTBREAK_SENSITIVITY)) {
                  alerts.push({ type: 'critical', title: 'Volume Anomaly', desc: 'Case volume significantly higher than 6-month baseline.' });
                  currentRisk = 'HIGH';
              } else if (growth > TREND_SENSITIVITY) {
                  alerts.push({ type: 'warning', title: 'Rising Trend', desc: `Cases are accelerating ${growth.toFixed(1)}% above average.` });
                  currentRisk = 'MODERATE';
              }
          }
          setSmartAlerts(alerts);
          setRiskLevel(currentRisk);

        }
      } catch (err) {
        console.error("Analytics Error:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [
    year, month, quarter, periodType, facilities.length, user, isAdmin, includeAllFacilities,
    currentDate, currentRealYear, OUTBREAK_SENSITIVITY, TREND_SENSITIVITY, HIGH_RISK_SENSITIVITY, areaText
  ]);

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