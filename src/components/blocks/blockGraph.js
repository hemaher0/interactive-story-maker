// src/components/blocks/blockGraph.js
export const buildStateDefMap = (files) => {
  const map = new Map();
  (Array.isArray(files) ? files : [])
    .filter((f) => f?.type === 'State')
    .forEach((st) => map.set(st.id, st));
  return map;
};

export const computeBlockSize = (b) => {
  if (!b || !b.type) return { w: 120, h: 90 };

  if (b.type === 'Object') return { w: 260, h: 210 };
  if (b.type === 'Action') return { w: 260, h: 260 };
  if (b.type === 'State') return { w: 220, h: 210 };
  if (b.type === 'Condition') return { w: 220, h: 180 };
  if (b.type === 'Goal') return { w: 220, h: 150 };

  return { w: 140, h: 110 };
};

export const isAllowedConnection = (fromBlock, fromPort, toBlock, toPort) => {
  if (!fromBlock || !toBlock) return false;

  // =========================
  // Condition -> Action (조건 추가)
  // =========================
  if (
    fromBlock.type === 'Condition' &&
    fromPort === 'out' &&
    toBlock.type === 'Action' &&
    toPort === 'in:conditions'
  ) {
    return true;
  }

  // =========================
  // Object ↔ State (State.owner 바인딩)
  // =========================
  if (fromBlock.type === 'State' && fromPort === 'out' && toBlock.type === 'Object' && toPort === 'in:states') {
    return true;
  }
  if (fromBlock.type === 'Object' && fromPort === 'out' && toBlock.type === 'State' && toPort === 'in:owner') {
    return true;
  }

  // =========================
  // State -> Condition (lvalue/rvalue)
  // =========================
  if (
    fromBlock.type === 'State' &&
    fromPort === 'out' &&
    toBlock.type === 'Condition' &&
    (toPort === 'in:lvalue' || toPort === 'in:rvalue')
  ) {
    return true;
  }

  // =========================
  // Object embedded/external state -> Condition (out:state:*)
  // =========================
  if (
    fromBlock.type === 'Object' &&
    typeof fromPort === 'string' &&
    fromPort.startsWith('out:state:') &&
    toBlock.type === 'Condition' &&
    (toPort === 'in:lvalue' || toPort === 'in:rvalue')
  ) {
    return true;
  }

  // =========================
  // Object -> Action (actor/target)
  // =========================
  if (
    fromBlock.type === 'Object' &&
    fromPort === 'out' &&
    toBlock.type === 'Action' &&
    (toPort === 'in:actor' || toPort === 'in:target')
  ) {
    return true;
  }
  // =========================
  // Action(out:effects) -> Object(in:states)
  // =========================
  if (
    fromBlock.type === 'Action' &&
    fromPort === 'out:effects' &&
    toBlock.type === 'Object' &&
    toPort === 'in:states'
  ) {
    return true;
  }
  // =========================
  // Action(out:effects) -> State(in:effect)
  // =========================
  if (
    fromBlock.type === 'Action' &&
    fromPort === 'out:effects' &&
    toBlock.type === 'State' &&
    toPort === 'in:effect'
  ) {
    return true;
  }

  // =========================
  // State value -> State value (typed value 복사)
  // =========================
  if (
    fromBlock.type === 'State' &&
    fromPort === 'out:value' &&
    toBlock.type === 'State' &&
    toPort === 'in:value'
  ) {
    return true;
  }

  return false;
};
