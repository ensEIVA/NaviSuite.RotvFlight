import './Telemetry.css';

// ---------------------------------------------------------------------------
// Placeholder live telemetry values
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
          <strong>{value}</strong> {unit}
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
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

export function Telemetry() {
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
        <GaugeBar label="Roll"          value={TELEMETRY.attitude.roll}    min={-30}  max={30}   warningMax={12}   criticalMax={18}  warningMin={-12}  criticalMin={-18}  unit="°" />
        <GaugeBar label="Pitch"         value={TELEMETRY.attitude.pitch}   min={-45}  max={45}   warningMax={15}   criticalMax={25}  warningMin={-15}  criticalMin={-25}  unit="°" />
        <GaugeBar label="Altitude"      value={TELEMETRY.position.altitude} min={0}   max={20}   warningMin={3}    criticalMin={2}                                         unit="m" />
        <GaugeBar label="Cable Tension" value={TELEMETRY.tow.tension}      min={0}    max={10}   warningMax={4.5}  criticalMax={6}                                         unit="kN" />
        <GaugeBar label="Voltage"       value={TELEMETRY.power.voltage}    min={42}   max={56}   warningMin={45}   criticalMin={43}  warningMax={52}   criticalMax={54}    unit="V" />
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
                <TelemetryRow label="Roll"    value={TELEMETRY.attitude.roll.toFixed(2)}    unit="°"   status="ok"      threshold="±15°" />
                <TelemetryRow label="Pitch"   value={TELEMETRY.attitude.pitch.toFixed(2)}   unit="°"   status="ok"      threshold="±20°" />
                <TelemetryRow label="Heading" value={TELEMETRY.attitude.heading.toFixed(1)} unit="°T"  status="neutral" threshold="—" />
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
                <TelemetryRow label="Latitude"  value={TELEMETRY.position.latitude.toFixed(6)}  unit="°N"  status="neutral" threshold="—" />
                <TelemetryRow label="Longitude" value={TELEMETRY.position.longitude.toFixed(6)} unit="°E"  status="neutral" threshold="—" />
                <TelemetryRow label="Depth"     value={TELEMETRY.position.depth.toFixed(1)}     unit="m"   status="ok"      threshold="Max 200 m" />
                <TelemetryRow label="Altitude"  value={TELEMETRY.position.altitude.toFixed(1)}  unit="m"   status="ok"      threshold="Min 2 m" />
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
                <TelemetryRow label="Surge (Fwd)" value={TELEMETRY.velocity.surge.toFixed(2)} unit="m/s" status="ok"      threshold="—" />
                <TelemetryRow label="Sway (Lat)"  value={TELEMETRY.velocity.sway.toFixed(2)}  unit="m/s" status="ok"      threshold="—" />
                <TelemetryRow label="Heave (Vrt)" value={TELEMETRY.velocity.heave.toFixed(2)} unit="m/s" status="ok"      threshold="—" />
                <TelemetryRow label="Ground Speed" value={TELEMETRY.velocity.groundSpeed.toFixed(2)} unit="kn" status="ok" threshold="—" />
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
                <TelemetryRow label="Voltage"  value={TELEMETRY.power.voltage.toFixed(1)}  unit="V"  status="ok"  threshold="45–52 V" />
                <TelemetryRow label="Current"  value={TELEMETRY.power.current.toFixed(1)}  unit="A"  status="ok"  threshold="Max 25 A" />
                <TelemetryRow label="Power"    value={TELEMETRY.power.powerW.toFixed(0)}   unit="W"  status="ok"  threshold="Max 1200 W" />
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
                <TelemetryRow label="Cable Tension" value={TELEMETRY.tow.tension.toFixed(1)} unit="kN" status="ok"      threshold="Max 6 kN" />
                <TelemetryRow label="Cable Out"     value={TELEMETRY.tow.cableOut.toFixed(1)} unit="m" status="neutral" threshold="—" />
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
                <TelemetryRow label="Water Temp"      value={TELEMETRY.env.waterTemp.toFixed(1)}      unit="°C"   status="neutral" threshold="—" />
                <TelemetryRow label="Salinity"        value={TELEMETRY.env.salinity.toFixed(2)}       unit="PSU"  status="neutral" threshold="—" />
                <TelemetryRow label="Sound Velocity"  value={TELEMETRY.env.soundVelocity.toFixed(1)}  unit="m/s"  status="neutral" threshold="—" />
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
