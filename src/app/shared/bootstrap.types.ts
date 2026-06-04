/**
 * Shared type declaration for Bootstrap JS global.
 * Import this file anywhere that needs Bootstrap modal/tooltip/etc.
 * Usage: import type { } from '../../shared/bootstrap.types';
 */
declare var bootstrap: {
  Modal: {
    getInstance(element: HTMLElement): { show(): void; hide(): void } | null;
    new(element: HTMLElement, options?: object): { show(): void; hide(): void };
  };
  Tooltip: {
    new(element: HTMLElement, options?: object): { show(): void; hide(): void; dispose(): void };
  };
  Collapse: {
    getInstance(element: HTMLElement): { show(): void; hide(): void; toggle(): void } | null;
    new(element: HTMLElement, options?: object): { show(): void; hide(): void; toggle(): void };
  };
};
