/**
 * Below 640px a centred dialog becomes a bottom sheet (design system: Mobile Today, thumb reach):
 * full width, pinned to the bottom, rounded top corners, clear of the home indicator.
 */
export const phoneSheetClass =
  'max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-lg max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]';
