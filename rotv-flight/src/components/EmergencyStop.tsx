import { useState } from 'react';
import './EmergencyStop.css';

interface EmergencyStopProps {
  onConfirm: () => void;
  disabled?: boolean;
}

/**
 * Emergency Stop — two-step confirmation pattern.
 *
 * First press arms the button; second press within 4 seconds confirms
 * the stop command. This prevents accidental activation while keeping
 * the control immediately accessible.
 */
export function EmergencyStop({ onConfirm, disabled = false }: EmergencyStopProps) {
  const [armed, setArmed] = useState(false);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleFirstPress() {
    if (disabled) return;
    setArmed(true);
    const id = setTimeout(() => {
      setArmed(false);
    }, 4000);
    setTimerId(id);
  }

  function handleConfirm() {
    if (timerId) clearTimeout(timerId);
    setArmed(false);
    onConfirm();
  }

  function handleCancel() {
    if (timerId) clearTimeout(timerId);
    setArmed(false);
  }

  if (armed) {
    return (
      <div className="estop estop--armed" role="alertdialog" aria-label="Confirm emergency stop">
        <p className="estop__confirm-text">Confirm E-STOP?</p>
        <div className="estop__confirm-actions">
          <button
            className="estop__confirm-btn"
            onClick={handleConfirm}
            aria-label="Confirm emergency stop — all motion will halt"
          >
            CONFIRM STOP
          </button>
          <button
            className="estop__cancel-btn"
            onClick={handleCancel}
            aria-label="Cancel emergency stop"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="estop estop--idle"
      onClick={handleFirstPress}
      disabled={disabled}
      aria-label="Emergency stop — press to arm, then confirm"
    >
      <span className="estop__icon" aria-hidden="true">⬛</span>
      <span className="estop__label">E-STOP</span>
    </button>
  );
}
