import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import './styles/globals.css';
import { App } from '@/app/app';
import { Providers } from '@/app/providers';
import { applySavedSunlight } from '@/features/day-of';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Sunlight mode before the first paint, so the screen doesn't flash low contrast outdoors.
applySavedSunlight();

// Offline shell and Web Push reminders (spec §14 as decided 2026-11-22). A new version waits
// until the planner chooses to reload, so a reload never lands mid-task on the day.
const updateApp = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast('A new version is ready', {
      duration: Infinity,
      action: { label: 'Reload', onClick: () => void updateApp(true) },
    });
  },
});

createRoot(root).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
