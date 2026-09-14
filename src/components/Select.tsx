import { useEffect, useRef, useState } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange(value: T): void;
  ariaLabel?: string;
}

/**
 * Свой выпадающий список вместо <select>: нативный в Telegram WebView рисует
 * системное меню с белым фоном и рамкой, которое нельзя привести к теме.
 */
export function Select<T extends string>({ value, options, onChange, ariaLabel }: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div className="select" ref={ref}>
      <button
        className={`select-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <span>{current?.label ?? value}</span>
        <i className="select-caret" />
      </button>
      {open && (
        <ul className="select-menu" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                className={`select-option${o.value === value ? ' is-on' : ''}`}
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
