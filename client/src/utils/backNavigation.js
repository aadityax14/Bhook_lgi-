import { useEffect, useRef } from 'react';

// =============================================================
// BACK BUTTON (phone / browser)
//
// The app is a single page, so without this the Back button leaves
// the whole website. Every page or popup the user opens is added as
// one "step" in the browser history; pressing Back closes only the
// newest step, so the user goes back the same way they came.
// =============================================================

const steps = []; // newest last: { close }
let currentDepth = 0;
let listening = false;

function handlePopState(event) {
  const depth = Number(event.state?.bhookDepth) || 0;

  // Forward button: nothing to reopen, just remember where we are.
  if (depth > currentDepth) {
    currentDepth = depth;
    return;
  }

  currentDepth = depth;

  let closedSomething = false;

  while (steps.length > depth) {
    const step = steps.pop();
    closedSomething = true;
    try {
      step.close();
    } catch (error) {
      console.error('Back navigation error:', error);
    }
  }

  // This history entry belonged to a popup that was already closed
  // with its own button. Skip it so one press always does something.
  if (!closedSomething) {
    window.history.back();
  }
}

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  window.addEventListener('popstate', handlePopState);
  listening = true;
}

/**
 * Add one Back step. `close` runs when the user presses Back.
 * Returns a function to call when the step was closed by the app
 * itself (X button, etc.).
 */
export function pushBackStep(close) {
  if (typeof window === 'undefined') return () => {};

  ensureListener();

  const step = { close };
  steps.push(step);
  currentDepth = steps.length;

  try {
    window.history.pushState({ ...(window.history.state || {}), bhookDepth: currentDepth }, '');
  } catch {
    // History not available (rare): Back just won't be intercepted.
  }

  return () => {
    const index = steps.indexOf(step);
    if (index !== -1) steps.splice(index, 1);
  };
}

/**
 * For in-app "Back" buttons: go back one step exactly like the
 * phone's Back button. If there is nothing to go back to, run
 * `fallback` instead.
 */
export function goBack(fallback) {
  if (steps.length > 0 && typeof window !== 'undefined') {
    window.history.back();
  } else if (fallback) {
    fallback();
  }
}

/**
 * While `active` is true, pressing Back calls `close()` instead of
 * leaving the page. Use for pages, drawers and popups.
 */
export function useBackStep(active, close) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!active) return undefined;
    return pushBackStep(() => closeRef.current?.());
  }, [active]);
}
