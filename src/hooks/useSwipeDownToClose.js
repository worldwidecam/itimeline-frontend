import { useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'framer-motion';

/**
 * useSwipeDownToClose
 * Custom hook to enable swiping downward or horizontally on a modal dialog / paper component to close it,
 * while respecting internal scrollable containers.
 * Supports mouse events (PC) and touch events (mobile) with overscroll rubber-banding physics.
 */
export const useSwipeDownToClose = (open, onClose) => {
  const popupX = useMotionValue(0);
  const popupY = useMotionValue(0);
  const paperRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Prevent mobile browser pull-to-refresh when popup is open
  useEffect(() => {
    if (open) {
      const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
      const prevBodyOverscroll = document.body.style.overscrollBehaviorY;
      
      document.documentElement.style.overscrollBehaviorY = 'contain';
      document.body.style.overscrollBehaviorY = 'contain';
      
      return () => {
        document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll;
        document.body.style.overscrollBehaviorY = prevBodyOverscroll;
      };
    }
  }, [open]);

  useEffect(() => {
    const paperEl = paperRef.current;
    const scrollEl = scrollContainerRef.current;
    if (!paperEl || !open) return;

    let startX = 0;
    let startY = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let startScrollTop = 0;
    let activeDragX = false;
    let activeDragY = false;

    // Helper to calculate rubber-banding overscroll
    const applyRubberBanding = (delta) => {
      if (delta <= 0) return delta;
      // Resistance curve: as delta grows, translation grows slower.
      // Scaling by 0.5x provides a very fluid and lightweight feel.
      return delta * 0.5;
    };

    const dragStart = (clientX, clientY, target) => {
      startX = clientX;
      startY = clientY;
      lastClientX = clientX;
      lastClientY = clientY;
      activeDragX = false;
      activeDragY = false;

      const isInsideScroll = scrollEl && scrollEl.contains(target);
      if (isInsideScroll) {
        startScrollTop = scrollEl.scrollTop;
      } else {
        startScrollTop = 0;
      }
    };

    const dragMove = (clientX, clientY, e) => {
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      // Check if we are already locked into dragging
      if (activeDragX) {
        if (e.cancelable) e.preventDefault();
        popupX.set(deltaX);
      } else if (activeDragY) {
        if (e.cancelable) e.preventDefault();
        // Apply overscroll rubber-banding physics if dragging downward
        const translationY = applyRubberBanding(deltaY);
        popupY.set(translationY);
      } else {
        // Find direction threshold
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY && absX > 5) {
          // Horizontal swipe lock (always allowed since popups don't scroll horizontally)
          if (e.cancelable) e.preventDefault();
          activeDragX = true;
          popupX.set(deltaX);
        } else if (absY > absX && absY > 5) {
          // Vertical check
          const isMovingDown = clientY > lastClientY;
          const isScrollAtTop = scrollEl ? scrollEl.scrollTop <= 0 : true;

          if (isMovingDown && isScrollAtTop) {
            // Drag downward lock
            if (e.cancelable) e.preventDefault();
            activeDragY = true;
            startX = clientX;
            startY = clientY; // Reset start coordinates to current point to avoid jumps
            popupY.set(0);
          }
        }
      }

      // Mid-swipe transition:
      // If user is swiping down inside a scroll container, standard scrolling happens.
      // If the scroll container hits scrollTop === 0 and the user's touch continues downward,
      // we transition seamlessly into dragging the popup.
      if (scrollEl && !activeDragX && !activeDragY && scrollEl.scrollTop <= 0 && clientY > lastClientY && deltaY > 5) {
        activeDragY = true;
        startX = clientX;
        startY = clientY; // Reset to current touch position to start drag from 0
        popupY.set(0);
        if (e.cancelable) e.preventDefault();
      }

      lastClientX = clientX;
      lastClientY = clientY;
    };

    const dragEnd = () => {
      if (activeDragX) {
        activeDragX = false;
        const currentX = popupX.get();
        if (Math.abs(currentX) > 120) {
          if (typeof onClose === 'function') onClose();
        } else {
          animate(popupX, 0, { type: 'spring', damping: 25, stiffness: 200 });
        }
      }
      if (activeDragY) {
        activeDragY = false;
        const currentY = popupY.get();
        // Since we apply rubber-banding (0.5x), a drag of 75px matches 150px of physical movement
        if (currentY > 75) {
          if (typeof onClose === 'function') onClose();
        } else {
          animate(popupY, 0, { type: 'spring', damping: 25, stiffness: 200 });
        }
      }
    };

    // --- Touch Event Handlers (Mobile) ---
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      dragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      dragMove(e.touches[0].clientX, e.touches[0].clientY, e);
    };

    const handleTouchEnd = () => {
      dragEnd();
    };

    // --- Mouse Event Handlers (PC) ---
    let isMouseDown = false;

    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // Only allow left clicks
      
      // Do not initiate mouse dragging if clicked inside the scrollable content container
      // to allow standard text selection, clicks, and scrolling on PC.
      const isInsideScroll = scrollEl && scrollEl.contains(e.target);
      if (isInsideScroll) return;

      isMouseDown = true;
      dragStart(e.clientX, e.clientY, e.target);
    };

    const handleMouseMove = (e) => {
      if (!isMouseDown) return;
      dragMove(e.clientX, e.clientY, e);
    };

    const handleMouseUp = () => {
      if (isMouseDown) {
        isMouseDown = false;
        dragEnd();
      }
    };

    // Bind touch events (mobile)
    paperEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    paperEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    paperEl.addEventListener('touchend', handleTouchEnd);
    paperEl.addEventListener('touchcancel', handleTouchEnd);

    // Bind mouse events (PC)
    paperEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Unbind touch events
      paperEl.removeEventListener('touchstart', handleTouchStart);
      paperEl.removeEventListener('touchmove', handleTouchMove);
      paperEl.removeEventListener('touchend', handleTouchEnd);
      paperEl.removeEventListener('touchcancel', handleTouchEnd);

      // Unbind mouse events
      paperEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [open, onClose, popupX, popupY]);

  // Reset positions when Dialog state changes
  useEffect(() => {
    if (!open) {
      popupX.set(0);
      popupY.set(0);
    }
  }, [open, popupX, popupY]);

  return { popupX, popupY, paperRef, scrollContainerRef };
};
