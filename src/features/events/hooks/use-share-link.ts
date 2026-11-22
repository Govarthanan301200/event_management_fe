import { toast } from 'sonner';

/**
 * Copy and Share for the client-form link (spec §7 step 2: "WhatsApp share sheet on mobile").
 * Uses the native share sheet where the browser has one, else opens WhatsApp with the link.
 */
export function useShareLink(link: string, clientName: string) {
  const message = `Hello ${clientName}, please tick the services you'd like us to arrange for your wedding: ${link}`;

  return {
    copy: async () => {
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Link copied');
      } catch {
        toast.error("Couldn't copy. Select the link and copy it instead.");
      }
    },
    share: async () => {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ text: message });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return; // closed the sheet
        }
      }
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer',
      );
    },
  };
}
