import { useState, useCallback } from 'react';

/**
 * Hook for handling block dragging logic.
 * Calculates position based on mouse event, origin point, and initial offset.
 */
export const useBlockDragger = (setBlocks) => {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const startDrag = useCallback((e, blockId, blockPos, origin = { x: 0, y: 0 }) => {
    setDragOffset({
      x: e.clientX - origin.x - blockPos.x,
      y: e.clientY - origin.y - blockPos.y
    });
    setDraggingId(blockId);
  }, []);

  const updateDrag = useCallback((e, origin = { x: 0, y: 0 }) => {
    if (draggingId === null) return;

    const newX = e.clientX - origin.x - dragOffset.x;
    const newY = e.clientY - origin.y - dragOffset.y;

    setBlocks(prev => prev.map(b => 
      b.uniqueId === draggingId ? { ...b, x: newX, y: newY } : b
    ));
  }, [draggingId, dragOffset, setBlocks]);

  const endDrag = useCallback(() => {
    setDraggingId(null);
  }, []);

  return { draggingId, startDrag, updateDrag, endDrag };
};