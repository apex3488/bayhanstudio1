/**
 * Coordinates the first-paint sequence: the preloader (if shown) finishes,
 * then the hero plays its reveal. Classes on <html> are set before first paint
 * by the inline script in entry-server (INTRO_SCRIPT):
 *   .motion      — full motion allowed; hero elements wait hidden for their reveal
 *   .preloading  — first visit in this session: the preloader overlay is shown
 *   .motion-ready — added here once JS has taken over (stops the safety timeout)
 */
let resolveIntro: () => void = () => {};
export const introFinished = new Promise<void>((resolve) => {
  resolveIntro = resolve;
});

export function finishIntro(): void {
  resolveIntro();
}

/**
 * Resolved when the hero reveal has fully played (or immediately when there is
 * no hero motion). Heavy work such as loading the 3D scene waits for it, so it
 * can never stall the first animation.
 */
let resolveHero: () => void = () => {};
export const heroSettled = new Promise<void>((resolve) => {
  resolveHero = resolve;
});

export function settleHero(): void {
  resolveHero();
}

export function markMotionReady(): void {
  document.documentElement.classList.add('motion-ready');
}

export function motionAllowed(): boolean {
  return document.documentElement.classList.contains('motion');
}

/**
 * Inline, render-blocking on purpose: it must run before the first paint.
 * Also silences skipped cross-document view transitions (hidden tab, rapid
 * navigation): the browser rejects their promises, which would surface as
 * unhandled AbortErrors. `pagereveal` fires too early for module scripts.
 */
export const INTRO_SCRIPT = `(function(){function q(e){var v=e.viewTransition;if(v){v.ready.catch(function(){});v.finished.catch(function(){})}}addEventListener('pagereveal',q);addEventListener('pageswap',q);var d=document.documentElement;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');if(!sessionStorage.getItem('bayhan.intro')){d.classList.add('preloading');sessionStorage.setItem('bayhan.intro','1')}}catch(e){}setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion','preloading')},4000)})();`;
