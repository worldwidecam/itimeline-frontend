import { useEffect } from 'react';

/**
 * useSwipeDownToDismiss
 *
 * When a card (or any overlay) is active on a mobile auth page, this hook:
 *   1. Blocks the browser native pull-to-refresh gesture (overscroll-behavior).
 *   2. Interprets a downward swipe past a threshold as an intentional "dismiss" action,
 *      calling onDismiss() so the caller can flip the card face-down.
 *
 * @param {boolean} isActive   - Whether the card/overlay is currently face-up.
 * @param {function} onDismiss - Callback to invoke when a dismiss swipe is detected.
 * @param {number} threshold   - Minimum vertical pixel distance to count as a swipe (default 60).
 */
const useSwipeDownToDismiss = (isActive, onDismiss, threshold = 60) => {
  // 1. Block pull-to-refresh while the card is face-up
  useEffect(() => {
    if (!isActive) return;

    const prevHtml = document.documentElement.style.overscrollBehaviorY;
    const prevBody = document.body.style.overscrollBehaviorY;

    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';

    return () => {
      document.documentElement.style.overscrollBehaviorY = prevHtml;
      document.body.style.overscrollBehaviorY = prevBody;
    };
  }, [isActive]);

  // 2. Detect swipe-down gesture and call onDismiss when threshold is crossed
  useEffect(() => {
    if (!isActive) return;

    let startY = 0;
    let tracking = false;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      tracking = true;
    };

    const handleTouchMove = (e) => {
      if (!tracking || e.touches.length !== 1) return;
      const deltaY = e.touches[0].clientY - startY;
      // Block pull-to-refresh for any downward movement while active
      if (deltaY > 0 && e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!tracking) return;
      tracking = false;

      const endY = e.changedTouches[0]?.clientY ?? startY;
      const deltaY = endY - startY;

      if (deltaY >= threshold && typeof onDismiss === 'function') {
        onDismiss();
      }
    };

    const handleTouchCancel = () => {
      tracking = false;
    };

    // Use { passive: false } on touchmove so preventDefault() is allowed
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isActive, onDismiss, threshold]);
};

export default useSwipeDownToDismiss;
