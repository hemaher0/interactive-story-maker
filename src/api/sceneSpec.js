// src/api/sceneSpec.js
function kindToText(tv, getObjectName) {
  if (!tv) return null;
  if (tv.kind === 'bool') return tv.value ? 'true' : 'false';
  if (tv.kind === 'number') return String(tv.value);
  if (tv.kind === 'literal') return String(tv.value);
  if (tv.kind === 'Object' || tv.kind === 'object') return getObjectName(tv.value) || String(tv.value);
  return String(tv.value);
}

function fmtLValue(lv, stateNameById, getObjectName) {
  if (!lv) return null;
  const obj = getObjectName(lv.objectRef) || lv.objectRef; // objectId거나 actor/target 슬롯일 수도 있음
  const st = stateNameById.get(lv.stateRef) || lv.stateRef;
  return `${obj}.${st}`;
}

function fmtRValue(rv, stateNameById, getObjectName) {
  if (!rv) return null;
  if (rv.kind === 'state') {
    const obj = getObjectName(rv.objectRef) || rv.objectRef;
    const st = stateNameById.get(rv.stateRef) || rv.stateRef;
    return `${obj}.${st}`;
  }
  return kindToText(rv, getObjectName);
}

export function buildSceneSpec(snapshot) {
  const nodes = snapshot.nodes || [];
  const objects = nodes.filter(n => n.type === 'Object');
  const states = nodes.filter(n => n.type === 'State');
  const actions = nodes.filter(n => n.type === 'Action');
  // condition 노드 자체는 시각적 요소고, 실제 논리는 Action 내부에 포함되거나 연결되므로 여기선 개별 처리가 불필요할 수 있음 (확인 필요)

  const objectNameById = new Map(objects.map(o => [o.objectId, o.name || o.objectId]));
  const getObjectName = (id) => objectNameById.get(id);

  const stateNameById = new Map(states.map(s => [s.stateId, s.name || s.stateId]));

  // 초기 상태 요약
  const initialState = states
    .filter(s => s.mode === 'slot' && s.ownerObjectId)
    .map(s => {
      const owner = getObjectName(s.ownerObjectId) || s.ownerObjectId;
      const st = s.name || s.stateId;
      const v = kindToText(s.currentValue, getObjectName);
      return { key: `${owner}.${st}`, value: v };
    });

  // 액션 요약
  const actionSpecs = actions.map(a => {
    const actor = getObjectName(a.actor?.ref) || a.actor?.ref || 'actor';
    const target = getObjectName(a.target?.ref) || a.target?.ref || 'target';

    const condLines = (Array.isArray(a.conditions) ? a.conditions : []).map(c => {
      const lv = fmtLValue(c.lvalue, stateNameById, getObjectName);
      const rv = fmtRValue(c.rvalue, stateNameById, getObjectName);
      return `${lv} ${c.rel || '?'} ${rv}`;
    });

    const effLines = (Array.isArray(a.effects) ? a.effects : []).map(e => {
      const lv = fmtLValue(e.lvalue, stateNameById, getObjectName);
      const rv = fmtRValue(e.rvalue, stateNameById, getObjectName);
      return `${lv} ${e.rel || 'set'} ${rv}`;
    });

    return {
      name: a.name,
      actor,
      target,
      conditions: condLines,
      effects: effLines,
    };
  });

  return {
    entities: objects.map(o => ({ name: o.name || o.objectId, id: o.objectId })),
    initial_state: initialState,
    actions: actionSpecs,
    render_hint: {
      composition: 'single frame or before/after diptych',
      include_labels: false,
      background: 'simple game-like scene',
    },
  };
}