import { useSyncExternalStore } from 'react';

// Sunlight mode (design system: Mobile Today): a high-contrast toggle, remembered on this device.

const KEY = 'wp.sunlight';
const listeners = new Set<() => void>();

function read(): boolean {
  return document.documentElement.dataset.contrast === 'high';
}

/** Applies the saved choice before the first paint (called from main.tsx). */
export function applySavedSunlight() {
  if (localStorage.getItem(KEY) === 'on') document.documentElement.dataset.contrast = 'high';
}

function set(on: boolean) {
  if (on) document.documentElement.dataset.contrast = 'high';
  else delete document.documentElement.dataset.contrast;
  localStorage.setItem(KEY, on ? 'on' : 'off');
  for (const listener of listeners) listener();
}

export function useSunlight() {
  const on = useSyncExternalStore((onChange) => {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, read);
  return {
    on,
    toggle: () => {
      set(!on);
    },
  };
}
