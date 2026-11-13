import { useLayoutEffect, useRef, type RefObject } from "react";
import { animate } from "animejs/animation";
import { createTimeline } from "animejs/timeline";
import { createScope } from "animejs/scope";
import { onScroll } from "animejs/events";
import { spring } from "animejs/easings";
import { stagger } from "animejs/utils";

const motionQueries = { reduceMotion: "(prefers-reduced-motion: reduce)" };

/**
 * Enter a routed page as one quiet unit, then bring in its explicitly marked
 * interface sections. The print canvas itself is intentionally never targeted.
 */
export function usePageMotion(
  ref: RefObject<HTMLElement | null>,
  routeKey: string,
  translateSections = true,
) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const scope = createScope({ root, mediaQueries: motionQueries }).add((self) => {
      if (!self || self.matches.reduceMotion) return;

      const timeline = createTimeline({ defaults: { ease: "out(3)" } });
      timeline.add(root, { opacity: [0.82, 1], duration: 190 });
      const sections = root.querySelectorAll<HTMLElement>(".motion-enter");
      if (sections.length) {
        timeline.add(
          sections,
          {
            ...(translateSections ? { y: [8, 0] } : {}),
            opacity: [0, 1],
            delay: stagger(32),
            duration: 220,
          },
          "-=120",
        );
      }
    });

    return () => scope.revert();
  }, [ref, routeKey, translateSections]);
}

/** Animate the appearance of modal, sheet, or command-palette contents. */
export function useOverlayMotion(ref: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!active || !root) return;

    const scope = createScope({ root, mediaQueries: motionQueries }).add((self) => {
      if (!self || self.matches.reduceMotion) return;
      createTimeline({ defaults: { ease: "out(3)" } })
        .add(root, { opacity: [0, 1], duration: 150 })
        .add(
          ".motion-panel",
          { y: [10, 0], scale: [0.99, 1], opacity: [0.65, 1], duration: 200 },
          "-=90",
        );
    });

    return () => scope.revert();
  }, [ref, active]);
}

/** Animate only the visible contents of a tabbed inspector panel. */
export function usePanelMotion(
  ref: RefObject<HTMLElement | null>,
  activeKey: string,
  selector?: string,
) {
  useLayoutEffect(() => {
    const root = ref.current;
    const target = selector ? root?.querySelector<HTMLElement>(selector) : root;
    if (!root || !target) return;

    const scope = createScope({ root, mediaQueries: motionQueries }).add((self) => {
      if (!self || self.matches.reduceMotion) return;
      animate(target, {
        opacity: [0.7, 1],
        y: [5, 0],
        duration: 170,
        ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, [ref, activeKey, selector]);
}

/** Brief feedback for changed totals, with no value interpolation or input delay. */
export function useValueFeedback(ref: RefObject<HTMLElement | null>, value: number) {
  const previousValue = useRef(value);
  useLayoutEffect(() => {
    const target = ref.current;
    const changed = !Object.is(previousValue.current, value);
    previousValue.current = value;
    if (!target || !changed) return;

    const scope = createScope({ root: target, mediaQueries: motionQueries }).add((self) => {
      if (!self || self.matches.reduceMotion) return;
      animate(target, {
        scale: [1, 1.025, 1],
        duration: 230,
        ease: spring({ stiffness: 360, damping: 30 }),
      });
    });
    return () => scope.revert();
  }, [ref, value]);
}

/** A tiny spring tap response for interface controls only, never canvas objects. */
export function animateControlPress(target: Element) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  animate(target, {
    scale: [1, 0.97, 1],
    duration: 210,
    ease: spring({ stiffness: 420, damping: 32 }),
  });
}

/** Reveal long-form sections when they enter view without hiding content up front. */
export function useScrollReveal(
  ref: RefObject<HTMLElement | null>,
  selector: string,
) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scope = createScope({ root, mediaQueries: motionQueries }).add((self) => {
      if (!self || self.matches.reduceMotion) return;
      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        onScroll({
          target: element,
          enter: "top 92%",
          repeat: false,
          onEnter: () => {
            scope.execute(() => {
              animate(element, {
                opacity: [0.84, 1],
                y: [7, 0],
                duration: 240,
                ease: "out(3)",
              });
            });
          },
        });
      });
    });

    return () => scope.revert();
  }, [ref, selector]);
}
