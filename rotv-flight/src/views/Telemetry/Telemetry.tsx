import { useEffect, useState } from 'react';
import { useUnits } from '../../hooks/useUnits';
import { streamTelemetry, type AutonomyTelemetrySnapshot } from '../../services/autonomyService';
import './Telemetry.css';

// ---------------------------------------------------------------------------
// Placeholder live telemetry values (always SI internally)
// ---------------------------------------------------------------------------

const TELEMETRY = {
  attitude: { roll: 1.4, pitch: -0.8, heading: 247.3 },
  position: { latitude: 57.4821, longitude: 1.7634, depth: 38.4, altitude: 5.2 },
  velocity: { surge: 1.65, sway: 0.02, heave: -0.01, groundSpeed: 3.21 },
  power:    { voltage: 48.2, current: 12.4, powerW: 596 },
  tow:      { tension: 2.1, cableOut: 142.0 },
  env:      { waterTemp: 14.3, salinity: 34.8, soundVelocity: 1506.2 },
};

interface TelemetryRowProps {
  label: string;
  value: string;
  unit?: string;
  status?: 'ok' | 'warning' | 'critical' | 'neutral';
  threshold?: string;
}

function TelemetryRow({ label, value, unit, status = 'neutral', threshold }: TelemetryRowProps) {
  return (
    <tr className={`telem-row telem-row--${status}`}>
      <td className="telem-row__label">{label}</td>
      <td className="telem-row__value">
        <span className={`telem-row__number telem-row__number--${status}`}>{value}</span>
        {unit && <span className="telem-row__unit">{unit}</span>}
      </td>
      {threshold !== undefined && (
        <td className="telem-row__threshold">{threshold}</td>
      )}
    </tr>
  );
}

interface GaugeBarProps {
  value: number;
  min: number;
  max: number;
  warningMin?: number;
  warningMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  unit: string;
  label: string;
}

function GaugeBar({ value, min, max, warningMin, warningMax, criticalMin, criticalMax, unit, label }: GaugeBarProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  let statusClass = 'gauge-bar__fill--ok';
  if (criticalMin !== undefined && value <= criticalMin) statusClass = 'gauge-bar__fill--critical';
  else if (criticalMax !== undefined && value >= criticalMax) statusClass = 'gauge-bar__fill--critical';
  else if (warningMin !== undefined && value <= warningMin) statusClass = 'gauge-bar__fill--warning';
  else if (warningMax !== undefined && value >= warningMax) statusClass = 'gauge-bar__fill--warning';

  return (
    <div className="gauge-bar">
      <div className="gauge-bar__header">
        <span className="gauge-bar__label">{label}</span>
        <span className="gauge-bar__reading">
          <strong>{value.toFixed(1)}</strong> {unit}
        </span>
      </div>
      <div
        className="gauge-bar__track"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min} 
        aria-valuemax={max}
        aria-label={label}
      >
        <div className={`gauge-bar__fill ${statusClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="gauge-bar__range">
        <span>{min.toFixed(1)} {unit}</span>
        <span>{max.toFixed(1)} {unit}</span>
      </div>
    </div>
  );
}

export function Telemetry() {
  const { fmt } = useUnits();

  const [telemetry, setTelemetry] = useState<AutonomyTelemetrySnapshot | null>(null);

  useEffect(() => {
    const stop = streamTelemetry('sf-01', (snap)=> setTelemetry(snap));
    return stop;
  },[]);
  if (!telemetry) return <div className="telemetry">Loading telemetry...</div>;

  // Pre-compute unit labels for repeated use
  const depthUnit = fmt(0, 'depth').unit;
  const tensionUnit = fmt(0, 'tension').unit;
  const speedUnit = fmt(0, 'speed').unit;
  const tempUnit = fmt(0, 'temperature').unit;

  // Conversion helpers
  const d = (v: number) => fmt(v, 'depth').value;
  const t = (v: number) => fmt(v, 'tension').value;
  const s = (v: number) => fmt(v, 'speed').value;
  
  return (
    <div className="telemetry">
      <header className="view-header">
        <div>
          <h1 className="view-title">Telemetry</h1>
          <p className="view-subtitle">Real-time sensor data from ROTV-01</p>
        </div>
        <div className="telemetry__header-actions">
          <span className="telemetry__live-indicator" aria-label="Live data streaming">
            <span className="telemetry__live-dot" aria-hidden="true" />
            Live — 10 Hz
          </span>
          <button className="btn-secondary">Export CSV</button>
          <button className="btn-secondary">Playback Mode</button>
        </div>
      </header>

      {/* Gauge row — most safety-critical values */}
      <section className="telemetry__gauges" aria-label="Primary gauges">
        <GaugeBar label="Roll"          value={telemetry?.attitude?.roll ?? 0}    min={-30}   max={30}    warningMax={12}      criticalMax={18}     warningMin={-12}     criticalMin={-18}    unit="°" />
        <GaugeBar label="Pitch"         value={telemetry?.attitude?.pitch ?? 0}   min={-45}   max={45}    warningMax={15}      criticalMax={25}     warningMin={-15}     criticalMin={-25}    unit="°" />
        <GaugeBar label="Altitude"      value={d(telemetry?.position?.altitude ?? 0)} min={d(0)} max={d(20)} warningMin={d(3)} criticalMin={d(2)}                                            unit={depthUnit} />
        <GaugeBar label="Cable Tension" value={t(telemetry?.tow?.tension ?? 0)}   min={t(0)}  max={t(10)} warningMax={t(4.5)}  criticalMax={t(6)}                                            unit={tensionUnit} />
        <GaugeBar label="Voltage"       value={telemetry?.power?.voltage ?? 0}    min={42}    max={56}    warningMin={45}      criticalMin={43}     warningMax={52}      criticalMax={54}     unit="V" />
      </section>

      {/* Data tables */}
      <div className="telemetry__tables">
        {/* Attitude */}
        <section className="panel" aria-labelledby="att-heading">
          <header className="panel__header">
            <h2 id="att-heading" className="panel__title">Attitude</h2>
            <span className="panel__meta text-ok">Nominal</span>
          </header>
          <div className="panel__body panel__body--table">
            <table className="telem-table" aria-label="Attitude data">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                <TelemetryRow label="Roll"    value={telemetry?.attitude?.roll.toFixed(2) ?? '0.00'}    unit="°"   status="ok"      threshold="±15°" />
                <TelemetryRow label="Pitch"   value={telemetry?.attitude?.pitch.toFixed(2) ?? '0.00'}   unit="°"   status="ok"      threshold="±20°" />
                <TelemetryRow label="Heading" value={telemetry?.attitude?.heading.toFixed(1) ?? '0.0'} unit="°T"  status="neutral" threshold="—" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Position */}
        <section className="panel" aria-labelledby="pos-heading">
          <header className="panel__header">
            <h2 id="pos-heading" className="panel__title">Position</h2>
            <span className="panel__meta text-ok">USBL Fix</span>
          </header>
          <div className="panel__body panel__body--table">
            <table className="telem-table" aria-label="Position data">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                <TelemetryRow label="Latitude"  value={telemetry?.position?.latitude.toFixed(6) ?? '0.000000'}  unit="°N"  status="neutral" threshold="—" />
                <TelemetryRow label="Longitude" value={telemetry?.position?.longitude.toFixed(6) ?? '0.000000'} unit="°E"  status="neutral" threshold="—" />
                <TelemetryRow label="Depth"     value={d(telemetry?.position?.depth ?? 0).toFixed(1)}     unit={depthUnit}   status="ok"      threshold={`Max ${d(200).toFixed(0)} ${depthUnit}`} />
                <TelemetryRow label="Altitude"  value={d(telemetry?.position?.altitude ?? 0).toFixed(1)}  unit={depthUnit}   status="ok"      threshold={`Min ${d(2).toFixed(0)} ${depthUnit}`} />
              </tbody>
            </table>
          </div>
        </section>

        {/* Velocity */}
        <section className="panel" aria-labelledby="vel-heading">
          <header className="panel__header">
            <h2 id="vel-heading" className="panel__title">Velocity</h2>
            <span className="panel__meta text-ok">DVL Lock</span>
          </header>
          <div className="panel__body panel__body--table">
            <table className="telem-table" aria-label="Velocity data">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                <TelemetryRow label="Surge (Fwd)" value={s(telemetry?.velocity?.surge ?? 0).toFixed(2)} unit={speedUnit} status="ok" threshold="—" />
                <TelemetryRow label="Sway (Lat)"  value={s(telemetry?.velocity?.sway ?? 0).toFixed(2)}  unit={speedUnit} status="ok" threshold="—" />
                <TelemetryRow label="Heave (Vrt)" value={s(telemetry?.velocity?.heave ?? 0).toFixed(2)} unit={speedUnit} status="ok" threshold="—" />
                <TelemetryRow label="Ground Speed" value={telemetry?.velocity?.groundSpeed.toFixed(2) ?? '0.00'} unit="kn" status="ok" threshold="—" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Power */}
        <section className="panel" aria-labelledby="pwr-heading">
          <header className="panel__header">
            <h2 id="pwr-heading" className="panel__title">Power</h2>
            <span className="panel__meta text-ok">Nominal</span>
          </header>
          <div className="panel__body panel__body--table">
            <table className="telem-table" aria-label="Power data">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                <TelemetryRow label="Voltage"  value={telemetry?.power?.voltage.toFixed(1) ?? '0.0'}  unit="V"  status="ok"  threshold="45–52 V" />
                <TelemetryRow label="Current"  value={telemetry?.power?.current.toFixed(1) ?? '0.0'}  unit="A"  status="ok"  threshold="Max 25 A" />
                <TelemetryRow label="Power"    value={telemetry?.power?.powerW.toFixed(0) ?? '0'}   unit="W"  status="ok"  threshold="Max 1200 W" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Tow */}
        <section className="panel" aria-labelledby="tow-heading">
          <header className="panel__header">
            <h2 id="tow-heading" className="panel__title">Tow System</h2>
            <span className="panel__meta text-ok">Nominal</span>
          </header>
          <div className="panel__body panel__body--table">
            <table className="telem-table" aria-label="Tow system data">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                <TelemetryRow label="Cable Tension" value={t(telemetry?.environment?.towCableTension ?? 0).toFixed(1)} unit={tensionUnit} status="ok"      threshold={`Max ${t(6).toFixed(1)} ${tensionUnit}`} />
                <TelemetryRow label="Cable Out"     value={d(telemetry?.environment?.cableOut ?? 0).toFixed(1)} unit={depthUnit}  status="neutral" threshold="—" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Environment */}
        <section className="panel" aria-labelledby="env-heading">
          <header className="panel__header">
            <h2 id="env-heading" className="panel__title">Environment</h2>
            <span className="panel__meta text-ok">CTD Active</span>
          </header>
          <div className="panel__body panel__body--table">
            <table className="telem-table" aria-label="Environmental data">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                <TelemetryRow label="Water Temp"      value={fmt(telemetry?.environment?.waterTemp ?? 0, 'temperature').value.toFixed(1)}   unit={tempUnit}  status="neutral" threshold="—" />
                <TelemetryRow label="Salinity"        value={(telemetry?.environment?.salinity ?? 0).toFixed(2)}                              unit="PSU"       status="neutral" threshold="—" />
                <TelemetryRow label="Sound Velocity"  value={(telemetry?.environment?.soundVelocity ?? 0).toFixed(1)}                        unit="m/s"       status="neutral" threshold="—" />
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
