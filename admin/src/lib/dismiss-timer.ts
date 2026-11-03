/**
 * One auto-dismiss timer. Each show() cancels the previous timer, so a second toast gets its
 * full time instead of vanishing when the first one's timer fires. dispose() cancels on unmount.
 */
export function createDismissTimer(onChange: (visible: boolean) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    show() {
      if (timer) clearTimeout(timer);
      onChange(true);
      timer = setTimeout(() => { timer = undefined; onChange(false); }, ms);
    },
    dispose() {
      if (timer) clearTimeout(timer);
      timer = undefined;
    },
  };
}
