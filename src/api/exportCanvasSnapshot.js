// src/api/exportCanvasSnapshot.js
export function exportCanvasSnapshot({ blocks, connections, stateDefById }) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const safeConns = Array.isArray(connections) ? connections : [];

  const nodes = safeBlocks.map((b) => {
    if (!b?.type) return null;
    if (b.type === 'State') {
      const def = stateDefById?.get?.(b.id);
      return {
        type: 'State',
        uniqueId: b.uniqueId,
        stateId: b.id,
        name: def?.name || b.name || b.id,
        ownerObjectId: b.owner ?? null,
        mode: b.mode || 'slot',
        currentValue: b.currentValue ?? null, // {kind,value}
        x: b.x, y: b.y,
      };
    }
    if (b.type === 'Object') {
      return { type: 'Object', uniqueId: b.uniqueId, objectId: b.id, name: b.name, x: b.x, y: b.y };
    }
    if (b.type === 'Condition') {
      return {
        type: 'Condition',
        uniqueId: b.uniqueId,
        rel: b.rel,
        lvalue: b.lvalue ?? null,
        rvalue: b.rvalue ?? null,
        x: b.x, y: b.y,
      };
    }
    if (b.type === 'Action') {
      return {
        type: 'Action',
        uniqueId: b.uniqueId,
        name: b.contentName || b.name || b.label || 'Action',
        actor: b.actor ?? { type: 'Object', ref: null },
        target: b.target ?? { type: 'Object', ref: null },
        conditions: Array.isArray(b.condition) ? b.condition : [],
        effects: Array.isArray(b.effect) ? b.effect : [],
        x: b.x, y: b.y,
      };
    }
    return { type: b.type, uniqueId: b.uniqueId, x: b.x, y: b.y };
  }).filter(Boolean);

  const edges = safeConns.map((c) => ({ from: c.from, to: c.to })); // {blockId,port}

  return { version: 1, nodes, edges };
}
