import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import type { DataQualityReport } from '../../types';
import { getReports } from '../../services/dataQualityService';
import './DataQuality.css';

const GRADE_STATUS = { A: 'nominal', B: 'nominal', C: 'warning', D: 'warning', F: 'critical' } as const;

const TREND_ICON: Record<string, string> = {
  improving: '▲',
  stable:    '→',
  degrading: '▼',
};

export function DataQuality() {
  const [reports, setReports] = useState<DataQualityReport[]>([]);

  useEffect(() => {
    getReports('').then(setReports).catch(console.error);
  }, []);

  return (
    <div className="data-quality">
      <header className="view-header">
        <div>
          <h1 className="view-title">Data Quality</h1>
          <p className="view-subtitle">Survey line quality metrics and acceptance reporting</p>
        </div>
        <div className="dq__header-actions">
          <button className="btn-secondary">Generate QC Report</button>
          <button className="btn-secondary">Export to CARIS</button>
        </div>
      </header>

      {/* Overview summary cards */}
      <section className="dq__overview" aria-label="Quality overview">
        <article className="dq__summary-card">
          <span className="dq__summary-label">Lines Assessed</span>
          <span className="dq__summary-value">3 / 4</span>
        </article>
        <article className="dq__summary-card">
          <span className="dq__summary-label">Lines Passed</span>
          <span className="dq__summary-value dq__summary-value--ok">2</span>
        </article>
        <article className="dq__summary-card">
          <span className="dq__summary-label">Lines Under Review</span>
          <span className="dq__summary-value dq__summary-value--warning">1</span>
        </article>
        <article className="dq__summary-card">
          <span className="dq__summary-label">Overall Grade</span>
          <span className="dq__summary-value">A–</span>
        </article>
      </section>

      {/* Per-line reports */}
      <section aria-label="Line quality reports">
        <h2 className="dq__section-title">Line Reports</h2>
        <div className="dq__reports">
          {reports.map((report) => (
            <article key={report.lineId} className="panel dq__report">
              <header className="panel__header">
                <div className="dq__report-heading">
                  <h3 className="panel__title">{report.lineLabel}</h3>
                  <time className="dq__report-time" dateTime={report.generatedAt}>
                    {new Date(report.generatedAt).toUTCString()}
                  </time>
                </div>
                <div className="dq__grade-badge dq__grade-badge--{report.overallGrade}">
                  <span className="dq__grade-letter">{report.overallGrade}</span>
                  <StatusBadge status={GRADE_STATUS[report.overallGrade]} size="sm" />
                </div>
              </header>

              <div className="panel__body">
                <table className="dq__metrics-table" aria-label={`Quality metrics for ${report.lineLabel}`}>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                      <th>Threshold</th>
                      <th>Trend</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.metrics.map((m) => (
                      <tr key={m.id} className={`dq__metric-row dq__metric-row--${m.status}`}>
                        <td className="dq__metric-name">{m.label}</td>
                        <td className="dq__metric-value">
                          <span className={`dq__metric-number dq__metric-number--${m.status}`}>
                            {m.value}
                          </span>
                          <span className="dq__metric-unit">{m.unit}</span>
                        </td>
                        <td className="dq__metric-threshold">
                          {m.status === 'nominal' ? '≥' : '＜'} {m.threshold} {m.unit}
                        </td>
                        <td className={`dq__metric-trend dq__metric-trend--${m.trend}`}>
                          {TREND_ICON[m.trend]} {m.trend}
                        </td>
                        <td>
                          <StatusBadge status={m.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Active line quality — live feed */}
      <section className="panel dq__live" aria-labelledby="dq-live-heading">
        <header className="panel__header">
          <h2 id="dq-live-heading" className="panel__title">Active Line — Real-time Quality Feed</h2>
          <StatusBadge status="nominal" label="Recording" pulse />
        </header>
        <div className="panel__body dq__live-body">
          <div className="dq__live-metric">
            <span className="dq__live-label">SNR</span>
            <span className="dq__live-bar-wrap">
              <span className="dq__live-bar" style={{ width: '72%' }} />
            </span>
            <span className="dq__live-value text-ok">41.8 dB</span>
          </div>
          <div className="dq__live-metric">
            <span className="dq__live-label">Coverage</span>
            <span className="dq__live-bar-wrap">
              <span className="dq__live-bar dq__live-bar--warning" style={{ width: '62%' }} />
            </span>
            <span className="dq__live-value text-warning">93.1 %</span>
          </div>
          <div className="dq__live-metric">
            <span className="dq__live-label">Density</span>
            <span className="dq__live-bar-wrap">
              <span className="dq__live-bar" style={{ width: '85%' }} />
            </span>
            <span className="dq__live-value text-ok">13.6 pts/m²</span>
          </div>
          <div className="dq__live-metric">
            <span className="dq__live-label">Motion</span>
            <span className="dq__live-bar-wrap">
              <span className="dq__live-bar" style={{ width: '40%' }} />
            </span>
            <span className="dq__live-value text-ok">0.04 m</span>
          </div>
        </div>
      </section>
    </div>
  );
}
