import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../../context/FlowContext';
import './PreFlight.css';

// ---------------------------------------------------------------------------
// Checklist item types
// ---------------------------------------------------------------------------

type CheckStatus = 'pending' | 'checking' | 'success' | 'failed';

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
}

// ---------------------------------------------------------------------------
// Initial check list with mixed statuses for visual interest
// ---------------------------------------------------------------------------

const INITIAL_CHECKS: CheckItem[] = [
  { id: 'battery',    label: 'Battery Level',       status: 'success'  },
  { id: 'io',         label: 'I/O Module',           status: 'success'  },
  { id: 'gps',        label: 'GPS Signal',           status: 'checking' },
  { id: 'flap-stbd',  label: 'Flap - Starboard',    status: 'pending'  },
  { id: 'flap-port',  label: 'Flap - Port',          status: 'pending'  },
  { id: 'motion',     label: 'Motion Sensor',        status: 'pending'  },
  { id: 'depth',      label: 'Depth Sensor',         status: 'success'   },
  { id: 'winch',      label: 'Winch Connection',     status: 'success'  },
  { id: 'tether',     label: 'Tether Integrity',     status: 'pending'  },
  { id: 'estop',      label: 'Emergency Stop Circuit', status: 'success' },
];

// ---------------------------------------------------------------------------
// Status icon helpers
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'success':
      return <span className="check-icon check-icon--success" aria-hidden="true">&#10003;</span>;
    case 'failed':
      return <span className="check-icon check-icon--failed" aria-hidden="true">&#10007;</span>;
    case 'checking':
      return <span className="check-icon check-icon--checking check-spinner" aria-hidden="true">&#9696;</span>;
    case 'pending':
    default:
      return <span className="check-icon check-icon--pending" aria-hidden="true">&#128336;</span>;
  }
}

// ---------------------------------------------------------------------------
// ROTV 3D mesh — simple box with accent-coloured materials
// ---------------------------------------------------------------------------

function RotvMesh() {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 0.5, 0.5]} />
        <meshStandardMaterial color="#1e90d4" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Dorsal fin */}
      <mesh position={[0.6, 0.35, 0]}>
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color="#3aa3e0" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Starboard wing */}
      <mesh position={[0, -0.05, 0.55]}>
        <boxGeometry args={[1.1, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a3f5f" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Port wing */}
      <mesh position={[0, -0.05, -0.55]}>
        <boxGeometry args={[1.1, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a3f5f" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[-1.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.25, 0.4, 8]} />
        <meshStandardMaterial color="#1a2236" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// PreFlight view
// ---------------------------------------------------------------------------

export function PreFlight() {
  const [checks, setChecks] = useState<CheckItem[]>(INITIAL_CHECKS);
  const [running, setRunning] = useState(false);
  const runRef = useRef(false);

  const { completeStep2 } = useFlow();
  const navigate = useNavigate();

  const canProceed =
    !running &&
    checks.every((c) => c.status === 'success');

  function setCheckStatus(id: string, status: CheckStatus) {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

  function runAllChecks() {
    if (running) return;
    setRunning(true);
    runRef.current = true;

    // Reset all non-success checks to pending first, then cycle through
    const pending = checks.map((c) => ({ ...c, status: 'pending' as CheckStatus }));
    setChecks(pending);

    pending.forEach((check, i) => {
      // Start checking with staggered delay
      const checkDelay = i * 500 + 200;
      setTimeout(() => {
        setCheckStatus(check.id, 'checking');
      }, checkDelay);

      // Resolve: most succeed, depth sensor always fails for realism
      const resolveDelay = checkDelay + 900 + Math.random() * 400;
      setTimeout(() => {
        const outcome: CheckStatus =
          check.id === 'depth' ? 'failed' : 'success';
        setCheckStatus(check.id, outcome);

        if (i === pending.length - 1) {
          setRunning(false);
          runRef.current = false;
        }
      }, resolveDelay);
    });
  }

  function handleProceed() {
    completeStep2();
    navigate('/dashboard');
  }

  return (
    <div className="preflight-v2">
      {/* Left panel — 3D scene */}
      <section className="preflight-v2__scene" aria-label="ROTV 3D model viewer">
        <div className="preflight-v2__scene-label">
          <span>ROTV Vehicle — 3D Preview</span>
          <span className="preflight-v2__scene-hint">Drag to rotate &bull; Scroll to zoom</span>
        </div>
        <Canvas
          camera={{ position: [4, 2, 4], fov: 45 }}
          style={{ background: '#0a0e1a', width: '100%', height: '100%' }}
          aria-label="3D ROTV vehicle model"
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} color="#e8edf5" />
          <directionalLight position={[-4, -2, -4]} intensity={0.3} color="#1e90d4" />

          {/* Vehicle mesh */}
          <RotvMesh />

          {/* Interactive controls */}
          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={12}
            autoRotate
            autoRotateSpeed={0.6}
          />
        </Canvas>
      </section>

      {/* Right panel — checklist */}
      <section className="preflight-v2__checklist" aria-label="Pre-flight checklist">
        <div className="preflight-v2__checklist-header">
          <div>
            <h1 className="preflight-v2__title">Pre-flight Checks</h1>
            <p className="preflight-v2__subtitle">
              Run all checks before proceeding to operations
            </p>
          </div>

          {/* Progress pill */}
          <div className="preflight-v2__progress-pill" aria-live="polite">
            <span className="preflight-v2__progress-count">
              {checks.filter((c) => c.status === 'success').length}
              <span className="preflight-v2__progress-total">/{checks.length}</span>
            </span>
            <span className="preflight-v2__progress-label">passed</span>
          </div>
        </div>

        {/* Check items */}
        <ul className="preflight-v2__list" role="list" aria-label="Pre-flight check items">
          {checks.map((check) => (
            <li
              key={check.id}
              className={`preflight-v2__item preflight-v2__item--${check.status}`}
              aria-label={`${check.label}: ${check.status}`}
            >
              <StatusIcon status={check.status} />
              <span className="preflight-v2__item-label">{check.label}</span>
              <span className={`preflight-v2__item-status-text preflight-v2__item-status-text--${check.status}`}>
                {check.status}
              </span>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="preflight-v2__actions">
          <button
            className="btn-secondary preflight-v2__run-btn"
            onClick={runAllChecks}
            disabled={running}
            aria-busy={running}
          >
            {running ? 'Running checks...' : 'Run All Checks'}
          </button>

          <button
            className={`btn-lg preflight-v2__proceed-btn ${canProceed ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleProceed}
            disabled={!canProceed}
            aria-label={
              canProceed
                ? 'Proceed to Dashboard'
                : 'All checks must pass before proceeding'
            }
            title={
              !canProceed
                ? 'Resolve all failed and pending checks first'
                : undefined
            }
          >
            {canProceed ? 'Proceed to Dashboard \u2192' : 'Resolve checks to proceed'}
          </button>
        </div>
      </section>
    </div>
  );
}
