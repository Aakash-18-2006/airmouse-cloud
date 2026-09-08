import React, { useRef, useState, useEffect, useCallback } from 'react';
import { mouseClient } from '../services/mouseClient';

interface TouchSurfaceProps {
  sensitivity: number;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export const TouchSurface: React.FC<TouchSurfaceProps> = ({ sensitivity }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Gesture state refs (stored in refs for real-time touch performance without re-renders)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Two-finger gesture tracking
  const lastTwoFingerYRef = useRef<number | null>(null);
  const twoFingerStartTimeRef = useRef<number>(0);
  const twoFingerStartMovedRef = useRef<boolean>(false);

  // Visual tracking
  const [activeTouch, setActiveTouch] = useState<{ x: number; y: number } | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      const x = touch.clientX - (rect?.left || 0);
      const y = touch.clientY - (rect?.top || 0);

      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartTimeRef.current = Date.now();
      isDraggingRef.current = false;
      setDragActive(false);

      setActiveTouch({ x, y });

      // Start long-press detection timer (350ms) for drag & drop
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        setDragActive(true);
        triggerHaptic([30, 40, 30]);
        mouseClient.sendMouseDown('left');
      }, 350);

    } else if (e.touches.length === 2) {
      // Two-finger touch start
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isDraggingRef.current) {
        mouseClient.sendMouseUp('left');
        isDraggingRef.current = false;
        setDragActive(false);
      }

      const yAvg = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      lastTwoFingerYRef.current = yAvg;
      twoFingerStartTimeRef.current = Date.now();
      twoFingerStartMovedRef.current = false;
      setActiveTouch(null);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.touches.length === 1 && lastTouchRef.current) {
      const touch = e.touches[0];
      const deltaX = (touch.clientX - lastTouchRef.current.x) * sensitivity;
      const deltaY = (touch.clientY - lastTouchRef.current.y) * sensitivity;

      // Check distance from initial start to cancel long press if finger moved
      if (touchStartPosRef.current) {
        const distSq = Math.pow(touch.clientX - touchStartPosRef.current.x, 2) +
                       Math.pow(touch.clientY - touchStartPosRef.current.y, 2);
        if (distSq > 64 && longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      // Update position
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setActiveTouch({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }

      // Send relative motion
      mouseClient.sendMove(deltaX, deltaY);

    } else if (e.touches.length === 2 && lastTwoFingerYRef.current !== null) {
      // Two finger scroll
      const yAvg = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaY = yAvg - lastTwoFingerYRef.current;

      if (Math.abs(deltaY) > 2) {
        twoFingerStartMovedRef.current = true;
        // Invert scroll direction so natural flick scrolls document as expected
        // Scale scroll amount for smooth scrolling
        mouseClient.sendScroll(deltaY * 0.4 * sensitivity);
        lastTwoFingerYRef.current = yAvg;
      }
    }
  }, [sensitivity]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingRef.current) {
      // Finish drag & drop
      mouseClient.sendMouseUp('left');
      isDraggingRef.current = false;
      setDragActive(false);
      triggerHaptic(20);
      setActiveTouch(null);
      return;
    }

    const now = Date.now();

    // Check for Two-Finger Tap (Right Click)
    if (twoFingerStartTimeRef.current > 0 && !twoFingerStartMovedRef.current) {
      const twoFingerDuration = now - twoFingerStartTimeRef.current;
      if (twoFingerDuration < 280) {
        triggerHaptic([20, 20]);
        mouseClient.sendRightClick();
        twoFingerStartTimeRef.current = 0;
        setActiveTouch(null);
        return;
      }
    }
    twoFingerStartTimeRef.current = 0;
    twoFingerStartMovedRef.current = false;
    lastTwoFingerYRef.current = null;

    // Check for 1-Finger Tap
    if (touchStartPosRef.current && lastTouchRef.current) {
      const duration = now - touchStartTimeRef.current;
      const distSq = Math.pow(lastTouchRef.current.x - touchStartPosRef.current.x, 2) +
                     Math.pow(lastTouchRef.current.y - touchStartPosRef.current.y, 2);

      // Short tap without significant movement (< 10px)
      if (duration < 250 && distSq < 100) {
        const timeSinceLastTap = now - lastTapTimeRef.current;

        if (timeSinceLastTap < 300) {
          // Double Tap -> Double Click
          triggerHaptic([25, 30, 25]);
          mouseClient.sendDoubleClick();
          lastTapTimeRef.current = 0;
        } else {
          // Single Tap -> Left Click
          triggerHaptic(25);
          mouseClient.sendLeftClick();
          lastTapTimeRef.current = now;
        }
      }
    }

    if (e.touches.length === 0) {
      setActiveTouch(null);
      lastTouchRef.current = null;
      touchStartPosRef.current = null;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'crosshair',
        backgroundColor: '#0b1120',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 60%),
          linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        borderRadius: 'var(--radius-lg)',
        border: dragActive ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: dragActive ? '0 0 30px var(--accent-cyan-glow)' : 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'border 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Subtle trackpad watermarks & gesture hints */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          opacity: activeTouch ? 0.2 : 0.45,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        }}
      >
        <span style={{ fontSize: '1.8rem' }}>🖱️</span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: 'var(--text-secondary)',
          }}
        >
          {dragActive ? 'DRAGGING ACTIVE' : 'TRACKPAD'}
        </span>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}
        >
          <span>Tap: Left Click</span>
          <span>•</span>
          <span>2-Finger Tap: Right Click</span>
          <span>•</span>
          <span>2-Finger Drag: Scroll</span>
        </div>
      </div>

      {/* Real-time touch ripple / glow indicator */}
      {activeTouch && (
        <div
          style={{
            position: 'absolute',
            left: activeTouch.x - 28,
            top: activeTouch.y - 28,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: dragActive ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.25)',
            border: dragActive ? '2px solid #ef4444' : '2px solid var(--accent-cyan)',
            boxShadow: dragActive ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(56, 189, 248, 0.5)',
            pointerEvents: 'none',
            transform: 'scale(1)',
            transition: 'transform 0.05s ease',
          }}
        />
      )}
    </div>
  );
};
