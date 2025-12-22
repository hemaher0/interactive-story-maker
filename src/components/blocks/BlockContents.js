// src/components/blocks/BlockContents.js
import React, { useMemo } from 'react';
import LinkHandle from './LinkHandle';
import { getIncoming, getObjectNameById, getConditionTitle } from './BlockUtils';
import { formatTypedValue } from './valueFormat';

/* =========================================
   helpers
   ========================================= */
const isStateRValue = (rv) => rv && typeof rv === 'object' && rv.kind === 'state';
const isLiteralRValue = (rv) => rv && typeof rv === 'object' && rv.kind && rv.kind !== 'state';

const fmtRValue = (rv, safeBlocks, stateDefById) => {
  if (!rv) return '?';

  if (isStateRValue(rv)) {
    const stName = stateDefById.get(rv.stateRef)?.name || rv.stateRef || '?';
    const objLabel = rv.objectRef || '?';
    // objectRef가 실제 objectId면 이름으로
    const objName = getObjectNameById(safeBlocks, objLabel);
    return `${objName || objLabel}.${stName}`;
  }

  if (isLiteralRValue(rv)) {
    return formatTypedValue(rv, { getObjectName: (id) => getObjectNameById(safeBlocks, id) });
  }

  return '?';
};

const fmtLValue = (lv, safeBlocks, stateDefById) => {
  if (!lv) return '?';
  const stName = stateDefById.get(lv.stateRef)?.name || lv.stateRef || '?';
  const objLabel = lv.objectRef || '?';
  const objName = getObjectNameById(safeBlocks, objLabel);
  return `${objName || objLabel}.${stName}`;
};

/* =========================================
   Object Content
   - embedded/external state마다 out:state:<stateRef> 제공
   ========================================= */
export const ObjectContent = ({ block, blocks, stateDefById, isConnectMode, can, clickIn, startOut }) => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const embedded = Array.isArray(block.state) ? block.state : [];
  const external = safeBlocks.filter((b) => b?.type === 'State' && b?.owner === block.id);

  const hasStates = embedded.length > 0 || external.length > 0;

  return (
    <div className="object-internals-preview">
      <div className="preview-label preview-label-row">
        <span className="preview-label-text">States:</span>
        <LinkHandle
          title="in:states"
          selectable={isConnectMode ? can('in:states') : false}
          dim={isConnectMode ? !can('in:states') : false}
          onMouseDown={(e) => clickIn(e, 'in:states')}
        />
      </div>

      {!hasStates ? (
        <div className="object-empty-state">No states</div>
      ) : (
        <div className="object-state-list">
          {embedded.map((s, idx) => {
            const def = stateDefById.get(s.ref);
            const name = def?.name || s.ref;
            const val = s.currentValue ?? def?.values?.[0] ?? null;
            const port = `out:state:${s.ref}`;

            return (
              <div key={`${block.uniqueId}-emb-${idx}`} className="object-state-item">
                <span className="state-dot">●</span>
                <span className="state-name">{name}</span>
                <span className="state-val-preview">
                  : {formatTypedValue(val, { getObjectName: (id) => getObjectNameById(safeBlocks, id) })}
                </span>

                {/* ✅ object의 모든 state는 out 가능 */}
                <LinkHandle title={port} onMouseDown={(e) => startOut(e, port)} />
              </div>
            );
          })}

          {external.map((st) => {
            const def = stateDefById.get(st.id);
            const name = st.name || def?.name || st.id;
            const val = st.currentValue ?? def?.values?.[0] ?? null;
            const port = `out:state:${st.id}`;

            return (
              <div key={`${block.uniqueId}-ext-${st.uniqueId}`} className="object-state-item">
                <span className="state-dot">●</span>
                <span className="state-name">{name}</span>
                <span className="state-val-preview">
                  : {formatTypedValue(val, { getObjectName: (id) => getObjectNameById(safeBlocks, id) })}
                </span>

                {/* ✅ external state도 out 가능 */}
                <LinkHandle title={port} onMouseDown={(e) => startOut(e, port)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =========================================
   Action Content
   - effects는 out:effects로 연결해서 State(in:effect)에 꽂는다
   ========================================= */
export const ActionContent = ({ block, blocks, connections, stateDefById, isConnectMode, can, clickIn }) => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];

  const incomingConditionsToAction = useMemo(() => {
    const incoming = getIncoming(connections, block.uniqueId, 'in:conditions');
    return incoming
      .map((c) => safeBlocks.find((b) => b?.uniqueId === c?.from?.blockId))
      .filter((b) => b && b.type === 'Condition');
  }, [connections, block.uniqueId, safeBlocks]);

  const renderEffects = () => {
    const eff = Array.isArray(block.effect) ? block.effect : [];
    if (eff.length === 0) return <div className="object-empty-state">No effects</div>;

    return (
      <div className="object-state-list">
        {eff.map((e, idx) => {
          const left = fmtLValue(e?.lvalue, safeBlocks, stateDefById);
          const right = fmtRValue(e?.rvalue, safeBlocks, stateDefById);
          const rel = e?.rel || 'set';
          return (
            <div key={`${block.uniqueId}-eff-${idx}`} className="object-state-item">
              <span className="state-name">{`${left} ${rel} ${right}`}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderConditions = () => {
    if (incomingConditionsToAction.length === 0) return <div className="object-empty-state">No conditions</div>;
    return (
      <div className="object-state-list">
        {incomingConditionsToAction.map((cond) => (
          <div key={cond.uniqueId} className="object-state-item">
            <span className="state-name">{getConditionTitle(cond)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="object-internals-preview">
        <div className="preview-label preview-label-row">
          <span className="preview-label-text">Actor / Target:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <LinkHandle
              title="in:actor"
              selectable={isConnectMode ? can('in:actor') : false}
              dim={isConnectMode ? !can('in:actor') : false}
              onMouseDown={(e) => clickIn(e, 'in:actor')}
            />
            <LinkHandle
              title="in:target"
              selectable={isConnectMode ? can('in:target') : false}
              dim={isConnectMode ? !can('in:target') : false}
              onMouseDown={(e) => clickIn(e, 'in:target')}
            />
          </div>
        </div>

        <div className="object-state-list">
          <div className="object-state-item">
            <span className="state-dot">●</span>
            <span className="state-name">actor</span>
            <span className="state-val-preview">: {block?.actor?.ref ? getObjectNameById(safeBlocks, block.actor.ref) : '-'}</span>
          </div>
          <div className="object-state-item">
            <span className="state-dot">●</span>
            <span className="state-name">target</span>
            <span className="state-val-preview">: {block?.target?.ref ? getObjectNameById(safeBlocks, block.target.ref) : '-'}</span>
          </div>
        </div>
      </div>

      <div className="object-internals-preview">
        <div className="preview-label preview-label-row">
          <span className="preview-label-text">Effects:</span>
          {/* in 포트가 아니라 안내 텍스트만 */}
          <span style={{ fontSize: 10, opacity: 0.7 }}>Action(out:effects) → State(in:effect)</span>
        </div>
        {renderEffects()}
      </div>

      <div className="object-internals-preview">
        <div className="preview-label preview-label-row">
          <span className="preview-label-text">Conditions:</span>
          <LinkHandle
            title="in:conditions"
            selectable={isConnectMode ? can('in:conditions') : false}
            dim={isConnectMode ? !can('in:conditions') : false}
            onMouseDown={(e) => clickIn(e, 'in:conditions')}
          />
        </div>
        {renderConditions()}
      </div>
    </>
  );
};

/* =========================================
   State Content
   - in:effect 추가(액션 effect 대상)
   ========================================= */
export const StateContent = ({
  block,
  blocks,
  stateDefById,
  isConnectMode,
  isActiveSource,
  can,
  clickIn,
  startOut,
  onUpdateBlock,
}) => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const def = stateDefById.get(block.id);

  const mode = block.mode || 'slot'; // 'slot' | 'value'
  const isSlotMode = mode === 'slot';
  const isValueMode = mode === 'value';
  const valueOptions =
    Array.isArray(block.values) && block.values.length > 0
      ? block.values
      : Array.isArray(def?.values)
        ? def.values
        : [];

  const val = block.currentValue ?? valueOptions[0] ?? null;

  const ownerName = block.owner ? getObjectNameById(safeBlocks, block.owner) : null;
  const stateName = def?.name || block.name || block.id;
  const typedValueToKey = (tv) => {
    if (!tv || typeof tv !== 'object') return '';
    return JSON.stringify({ kind: tv.kind, value: tv.value });
  };

  const displayValueOnly = (tv) => {
    if (!tv || typeof tv !== 'object') return '-';
    if (tv.kind === 'bool') return tv.value ? 'true' : 'false';
    if (tv.kind === 'number') return String(tv.value);
    if (tv.kind === 'literal') return String(tv.value);
    if (tv.kind === 'Object' || tv.kind === 'object') {
      const name = getObjectNameById(safeBlocks, tv.value);
      return name || String(tv.value);
    }
    return String(tv.value);
  };

  const currentKey = typedValueToKey(val);
  const fallbackKey = valueOptions[0] ? typedValueToKey(valueOptions[0]) : '';
  const selectedKey = currentKey || fallbackKey;

  const handleValueChange = (e) => {
    const raw = e.target.value;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      onUpdateBlock?.({ currentValue: parsed });
    } catch {
      // ignore
    }
  };

  return (
    <div className="object-internals-preview">
      <div className="preview-label">State:</div>
      <div className="object-state-list">
        <div className="object-state-item">
          <span className="state-dot">●</span>
          <span className="state-name">mode</span>
          <span className="state-val-preview">:</span>
          <select className="state-value-select" value={mode} onChange={(e) => onUpdateBlock?.({ mode: e.target.value })} >
            <option value="slot">slot (object state)</option>
            <option value="value">value (typed value)</option>
          </select>
        </div>
        {/* id row */}
        <div className="object-state-item">
          <span className="state-dot">●</span>
          <span className="state-name">id</span>
          <span className="state-val-preview">: {block.id || '-'}</span>
          {isSlotMode ? ( <LinkHandle active={isActiveSource} title="out" onMouseDown={(e) => startOut(e, 'out')} /> ) : null}
        </div>

        {/* owner row */}
        <div className="object-state-item">
          <span className="state-dot">●</span>
          <span className="state-name">owner</span>
          <span className="state-val-preview">: {ownerName || '-'}</span>
          {isSlotMode ? ( <LinkHandle title="in:owner" selectable={isConnectMode ? can('in:owner') : false} dim={isConnectMode ? !can('in:owner') : false} onMouseDown={(e) => clickIn(e, 'in:owner')} /> ) : null}
        </div>

        {/* value row */}
        <div className="object-state-item">
          <span className="state-dot">●</span>
          <span className="state-name">{isSlotMode ? 'current' : 'value'}</span>
          <span className="state-val-preview">:</span>

          <select className="state-value-select" value={selectedKey} onChange={handleValueChange} disabled={!isValueMode}>
            {valueOptions.length === 0 ? (
              <option value="">-</option>
            ) : (
              valueOptions.map((tv, i) => {
                const key = typedValueToKey(tv);
                return (
                  <option key={`${block.uniqueId}-val-${i}-${key}`} value={key}>
                    {displayValueOnly(tv)}
                  </option>
                );
              })
            )}
          </select>

          {isValueMode ? ( <> <LinkHandle title="out:value" onMouseDown={(e) => startOut(e, 'out:value')} /> </> ) : null}
        </div>
      </div>
    </div>
  );
};

/* =========================================
   Condition Content (NEW SCHEMA)
   Ports: in:lvalue / in:rvalue
   ========================================= */
export const ConditionContent = ({ block, blocks, stateDefById, isConnectMode, can, clickIn }) => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const ltext = fmtLValue(block.lvalue, safeBlocks, stateDefById);
  const rtext = fmtRValue(block.rvalue, safeBlocks, stateDefById);

  return (
    <div className="object-internals-preview">
      <div className="preview-label">Slots:</div>

      <div className="object-state-list">
        <div className="object-state-item">
          <span className="state-dot">●</span>
          <span className="state-name">lvalue</span>
          <span className="state-val-preview">: {ltext}</span>
          <LinkHandle
            title="in:lvalue"
            selectable={isConnectMode ? can('in:lvalue') : false}
            dim={isConnectMode ? !can('in:lvalue') : false}
            onMouseDown={(e) => clickIn(e, 'in:lvalue')}
          />
        </div>

        <div className="object-state-item">
          <span className="state-dot">●</span>
          <span className="state-name">rvalue</span>
          <span className="state-val-preview">: {rtext}</span>
          <LinkHandle
            title="in:rvalue"
            selectable={isConnectMode ? can('in:rvalue') : false}
            dim={isConnectMode ? !can('in:rvalue') : false}
            onMouseDown={(e) => clickIn(e, 'in:rvalue')}
          />
        </div>
      </div>
    </div>
  );
};
