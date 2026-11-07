import { useEffect, useId, useRef, type ReactNode } from 'react';

type IconName =
  | 'mark'
  | 'back'
  | 'close'
  | 'check'
  | 'chevron'
  | 'plus'
  | 'minus'
  | 'more'
  | 'ledger'
  | 'chart'
  | 'gear'
  | 'download'
  | 'trash'
  | 'compass';

const PATHS: Record<IconName, ReactNode> = {
  mark: <path d="M12 2 14 9.4 21.5 12 14 14.6 12 22 10 14.6 2.5 12 10 9.4Z" fill="currentColor" />,
  back: <path d="M15 5 8 12l7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  chevron: <path d="M6 9.5 12 15.5 18 9.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" />
    </>
  ),
  ledger: (
    <>
      <path d="M6.5 4.5h11A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.5 9h7M8.5 13h4" />
    </>
  ),
  chart: <path d="M4 19V5M4 19h16M8 15l3.5-4.5L15 14l4-6" />,
  gear: (
    <>
      <path d="M4 7h6M14 7h6M4 17h10M18 17h2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
  download: <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" />,
  trash: <path d="M5 7h14M9 7V4.5h6V7M7 7l1 12.5h8L17 7" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 4.5 13.7 10.3 19.5 12l-5.8 1.7L12 19.5l-1.7-5.8L4.5 12l5.8-1.7Z" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.6,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

export function Switch({
  checked,
  onChange,
  title,
  note,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  note?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`switch${disabled ? ' is-disabled' : ''}`}>
      <span className="switch__text">
        <span className="switch__name">{title}</span>
        {note ? <span className="switch__note">{note}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__track" aria-hidden="true" />
    </label>
  );
}

export function Stepper({
  label,
  value,
  onStep,
  max,
  min = 0,
}: {
  label: string;
  value: number;
  onStep: (delta: number) => void;
  max: number;
  min?: number;
}) {
  return (
    <div className="stepper">
      <span className="stepper__label">{label}</span>
      <div className="stepper__row">
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onStep(-1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Icon name="minus" size={14} strokeWidth={2} />
        </button>
        <span className="stepper__val num" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onStep(1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Icon name="plus" size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function Counter({
  value,
  onStep,
  max = 9,
  min = 0,
  label,
}: {
  value: number;
  onStep: (delta: number) => void;
  max?: number;
  min?: number;
  label: string;
}) {
  return (
    <div className="counter">
      <button
        type="button"
        className="counter__btn"
        onClick={() => onStep(-1)}
        disabled={value <= min}
        aria-label={`Remove one ${label}`}
      >
        <Icon name="minus" size={12} strokeWidth={2} />
      </button>
      <span className="counter__val num">{value}</span>
      <button
        type="button"
        className="counter__btn"
        onClick={() => onStep(1)}
        disabled={value >= max}
        aria-label={`Add one ${label}`}
      >
        <Icon name="plus" size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

export function Sheet({
  title,
  sub,
  onClose,
  children,
  footer,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="sheet"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="sheet__head">
          <div className="appbar__grow">
            <h2 className="sheet__title" id={titleId}>
              {title}
            </h2>
            {sub ? <span className="sheet__sub">{sub}</span> : null}
          </div>
          <button type="button" className="icon-btn sheet__close" onClick={onClose} aria-label="Close" ref={closeRef}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer ? <footer className="sheet__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__body">
        <Icon name="check" size={14} strokeWidth={2} />
        {message}
      </span>
    </div>
  );
}
