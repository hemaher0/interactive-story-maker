// src/components/blocks/BlockUtils.js

/**
 * Return all connections that go into (toId, toPort).
 * - toPort 미지정이면 해당 블록으로 들어오는 전체 연결 반환
 */
export const getIncoming = (connections, toId, toPort) => {
  const list = Array.isArray(connections) ? connections : [];
  return list.filter((c) => {
    const sameTarget = c?.to?.blockId === toId;
    const samePort = !toPort || c?.to?.port === toPort;
    return sameTarget && samePort;
  });
};

/**
 * Return the source block of the first incoming connection into (toId, toPort).
 * - 연결이 없으면 null
 * - blocks에서 uniqueId로 from.blockId 매칭
 */
export const firstIncomingSource = (connections, blocks, toId, toPort) => {
  const incoming = getIncoming(connections, toId, toPort);
  const conn = incoming[0];
  if (!conn) return null;

  const list = Array.isArray(blocks) ? blocks : [];
  return list.find((b) => b?.uniqueId === conn.from.blockId) || null;
};

/**
 * Find object block by objId and return a display name.
 * - 우선순위: name > contentName > targetContent > label > objId
 */
export const getObjectNameById = (blocks, objId) => {
  if (!objId) return null;

  const list = Array.isArray(blocks) ? blocks : [];
  const obj = list.find((b) => b?.type === 'Object' && b?.id === objId);

  return (
    obj?.name ||
    obj?.contentName ||
    obj?.targetContent ||
    obj?.label ||
    objId
  );
};

/**
 * Human-readable title for a condition-like block.
 * - cond가 없으면 'Condition'
 * - cond.type !== 'Condition'이면: name/contentName/label fallback
 * - Condition이면: label/rel fallback
 */
export const getConditionTitle = (cond) => {
  if (!cond) return 'Condition';

  const fallback = cond.name || cond.contentName || cond.label || 'Condition';
  if (cond.type !== 'Condition') return fallback;

  return cond.label || cond.rel || 'Condition';
};
