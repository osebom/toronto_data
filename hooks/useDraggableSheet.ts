'use client';

import { useState, useCallback } from 'react';

const SNAP_POINTS = [35, 55, 85] as const; // vh
const MIN_VH = 35;
const MAX_VH = 85;

export function useDraggableSheet(initialVh: number = 55) {
  const [heightVh, setHeightVh] = useState(initialVh);
  const [dragStart, setDragStart] = useState<{ y: number; height: number } | null>(null);

  const snapToNearest = useCallback((vh: number) => {
    const nearest = SNAP_POINTS.reduce((prev, curr) =>
      Math.abs(curr - vh) < Math.abs(prev - vh) ? curr : prev
    );
    setHeightVh(nearest);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragStart({ y: e.clientY, height: heightVh });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [heightVh]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart) return;
      const deltaY = dragStart.y - e.clientY;
      const vhPerPixel = 100 / (typeof window !== 'undefined' ? window.innerHeight : 600);
      let newVh = dragStart.height + deltaY * vhPerPixel;
      newVh = Math.max(MIN_VH, Math.min(MAX_VH, newVh));
      setHeightVh(newVh);
    },
    [dragStart]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragStart) {
        snapToNearest(heightVh);
        setDragStart(null);
      }
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [dragStart, heightVh, snapToNearest]
  );

  return {
    heightVh,
    setHeightVh: (v: number) => setHeightVh(Math.max(MIN_VH, Math.min(MAX_VH, v))),
    snapToNearest,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: (e: React.PointerEvent) => {
        setDragStart(null);
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      },
      style: { touchAction: 'none' } as React.CSSProperties,
    },
  };
}
