import type { DataQualityReport } from '../types';
import { transport } from './transport';
import { getDataQualityClient } from './clients';
import { SystemStatus } from '../gen/rotv/v1/common_pb';

function mapSystemStatus(s: SystemStatus): DataQualityReport['metrics'][number]['status'] {
  switch (s) {
    case SystemStatus.NOMINAL:  return 'nominal';
    case SystemStatus.WARNING:  return 'warning';
    case SystemStatus.CRITICAL: return 'critical';
    case SystemStatus.OFFLINE:  return 'offline';
    default:                    return 'unknown';
  }
}

const FALLBACK_REPORTS: DataQualityReport[] = [
  {
    lineId: 'L01', lineLabel: 'Line 01', generatedAt: '2024-11-14T06:12:00Z', overallGrade: 'A',
    metrics: [
      { id: 'snr',      label: 'Signal-to-Noise Ratio', value: 42.1, unit: 'dB',      threshold: 30,  status: 'nominal', trend: 'stable'    },
      { id: 'coverage', label: 'Seafloor Coverage',      value: 98.4, unit: '%',        threshold: 95,  status: 'nominal', trend: 'stable'    },
      { id: 'density',  label: 'Point Density',          value: 14.2, unit: 'pts/m²',  threshold: 8,   status: 'nominal', trend: 'improving' },
      { id: 'overlap',  label: 'Swath Overlap',          value: 18.3, unit: '%',        threshold: 10,  status: 'nominal', trend: 'stable'    },
      { id: 'motion',   label: 'Motion Residuals',       value: 0.04, unit: 'm',        threshold: 0.1, status: 'nominal', trend: 'stable'    },
    ],
  },
  {
    lineId: 'L02', lineLabel: 'Line 02', generatedAt: '2024-11-14T06:55:00Z', overallGrade: 'B',
    metrics: [
      { id: 'snr',      label: 'Signal-to-Noise Ratio', value: 34.7, unit: 'dB',      threshold: 30,  status: 'nominal', trend: 'stable'    },
      { id: 'coverage', label: 'Seafloor Coverage',      value: 91.2, unit: '%',        threshold: 95,  status: 'warning', trend: 'degrading' },
      { id: 'density',  label: 'Point Density',          value: 9.8,  unit: 'pts/m²',  threshold: 8,   status: 'nominal', trend: 'stable'    },
      { id: 'overlap',  label: 'Swath Overlap',          value: 22.1, unit: '%',        threshold: 10,  status: 'nominal', trend: 'stable'    },
      { id: 'motion',   label: 'Motion Residuals',       value: 0.08, unit: 'm',        threshold: 0.1, status: 'nominal', trend: 'stable'    },
    ],
  },
  {
    lineId: 'L03', lineLabel: 'Line 03', generatedAt: '2024-11-14T07:41:00Z', overallGrade: 'A',
    metrics: [
      { id: 'snr',      label: 'Signal-to-Noise Ratio', value: 44.2, unit: 'dB',      threshold: 30,  status: 'nominal', trend: 'improving' },
      { id: 'coverage', label: 'Seafloor Coverage',      value: 99.1, unit: '%',        threshold: 95,  status: 'nominal', trend: 'stable'    },
      { id: 'density',  label: 'Point Density',          value: 15.6, unit: 'pts/m²',  threshold: 8,   status: 'nominal', trend: 'stable'    },
      { id: 'overlap',  label: 'Swath Overlap',          value: 16.9, unit: '%',        threshold: 10,  status: 'nominal', trend: 'stable'    },
      { id: 'motion',   label: 'Motion Residuals',       value: 0.03, unit: 'm',        threshold: 0.1, status: 'nominal', trend: 'stable'    },
    ],
  },
];

export async function getReports(systemId: string): Promise<DataQualityReport[]> {
  if (!transport) return FALLBACK_REPORTS;

  const response = await getDataQualityClient().getReports({ systemId });
  return response.reports.map((r) => ({
    lineId: r.lineId,
    lineLabel: r.lineLabel,
    generatedAt: r.generatedAt,
    overallGrade: r.overallGrade as DataQualityReport['overallGrade'],
    metrics: r.metrics.map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
      unit: m.unit,
      threshold: m.threshold,
      status: mapSystemStatus(m.status),
      trend: m.trend as DataQualityReport['metrics'][number]['trend'],
    })),
  }));
}

export function streamActiveLine(
  systemId: string,
  onReport: (report: DataQualityReport) => void,
): () => void {
  if (!transport) return () => {};

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const r of getDataQualityClient().streamActiveLine(
        { systemId },
        { signal: ctrl.signal },
      )) {
        onReport({
          lineId: r.lineId,
          lineLabel: r.lineLabel,
          generatedAt: r.generatedAt,
          overallGrade: r.overallGrade as DataQualityReport['overallGrade'],
          metrics: r.metrics.map((m) => ({
            id: m.id,
            label: m.label,
            value: m.value,
            unit: m.unit,
            threshold: m.threshold,
            status: mapSystemStatus(m.status),
            trend: m.trend as DataQualityReport['metrics'][number]['trend'],
          })),
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.error('[dataQualityService] stream error', err);
      }
    }
  })();

  return () => ctrl.abort();
}
