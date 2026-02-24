import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { useFlow } from '../context/FlowContext';
import type { FlightPhase, SystemStatus } from '../types';
import './AppLayout.css';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface Step {
  number: 1 | 2 | 3;
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Systems',    path: '/'          },
  { number: 2, label: 'Pre-flight', path: '/preflight' },
  { number: 3, label: 'Dashboard',  path: '/dashboard' },
];

// Derive the active step number from the current pathname
function pathToStep(pathname: string): 1 | 2 | 3 {
  if (pathname.startsWith('/preflight')) return 2;
  if (pathname.startsWith('/dashboard')) return 3;
  return 1;
}

// ---------------------------------------------------------------------------
// StepperNav component
// ---------------------------------------------------------------------------

function StepperNav() {
  const { step1Complete, step2Complete } = useFlow();
  const location  = useLocation();
  const navigate  = useNavigate();
  const activeStep = pathToStep(location.pathname);

  function isUnlocked(step: Step): boolean {
    if (step.number === 1) return true;
    if (step.number === 2) return step1Complete;
    if (step.number === 3) return step1Complete && step2Complete;
    return false;
  }

  function isComplete(step: Step): boolean {
    if (step.number === 1) return step1Complete;
    if (step.number === 2) return step2Complete;
    return false;
  }

  function handleStepClick(step: Step) {
    if (!isUnlocked(step)) return;
    navigate(step.path);
  }

  return (
    <nav className="stepper-nav" aria-label="Mission progress steps">
      <ol className="stepper-nav__list" role="list">
        {STEPS.map((step, idx) => {
          const unlocked = isUnlocked(step);
          const complete  = isComplete(step);
          const active    = activeStep === step.number;

          return (
            <li key={step.number} className="stepper-nav__item">
              {/* Connector line between steps (not before step 1) */}
              {idx > 0 && (
                <span
                  className={`stepper-nav__connector ${isUnlocked(STEPS[idx]) ? 'stepper-nav__connector--unlocked' : ''}`}
                  aria-hidden="true"
                />
              )}

              <button
                className={[
                  'stepper-nav__step',
                  active    ? 'stepper-nav__step--active'    : '',
                  complete  ? 'stepper-nav__step--complete'  : '',
                  !unlocked ? 'stepper-nav__step--locked'    : '',
                  unlocked && !active && !complete ? 'stepper-nav__step--unlocked' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleStepClick(step)}
                disabled={!unlocked}
                aria-current={active ? 'step' : undefined}
                aria-label={
                  !unlocked
                    ? `Step ${step.number}: ${step.label} — locked`
                    : complete
                    ? `Step ${step.number}: ${step.label} — complete`
                    : active
                    ? `Step ${step.number}: ${step.label} — current`
                    : `Step ${step.number}: ${step.label}`
                }
              >
                <span className="stepper-nav__circle" aria-hidden="true">
                  {!unlocked
                    ? '\uD83D\uDD12'   /* lock emoji */
                    : complete
                    ? '\u2713'          /* checkmark */
                    : step.number}
                </span>
                <span className="stepper-nav__label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// AppLayout
// ---------------------------------------------------------------------------

export function AppLayout() {
  const [utcTime, setUtcTime] = useState(() => formatUtc(new Date()));

  useEffect(() => {
    const id = setInterval(() => setUtcTime(formatUtc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  const systemStatus: SystemStatus = 'nominal';
  const flightPhase: FlightPhase   = 'pre_flight';
  const missionName                = 'NS-2024-Area7-Line04';

  function handleEmergencyStop() {
    console.warn('[ROTV Flight] EMERGENCY STOP ACTIVATED');
    window.alert('EMERGENCY STOP command sent.');
  }

  return (
    <div className="app-layout">
      <div className="app-layout__body">
        <Header
          systemStatus={systemStatus}
          flightPhase={flightPhase}
          missionName={missionName}
          utcTime={utcTime}
          onEmergencyStop={handleEmergencyStop}
        />

        <StepperNav />

        <main className="app-layout__main" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function formatUtc(date: Date): string {
  return date.toISOString().substring(11, 19);
}
