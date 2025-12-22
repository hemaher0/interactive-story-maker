// src/components/BlockCanvas.js
import React, { useMemo, useRef, useState, useCallback } from 'react';
import ComponentEditor from './ComponentEditor';
import { useBlockDragger } from './hooks/useBlockDragger';
import BlockCard from './blocks/BlockCard';
import { buildStateDefMap, computeBlockSize, isAllowedConnection } from './blocks/blockGraph';
import { exportCanvasSnapshot } from '../api/exportCanvasSnapshot';
import { buildSceneSpec } from '../api/sceneSpec';
import { generateImagePrompt } from '../api/llmApi';
import { generateSceneImage } from '../api/nanobanana';
import './BlockCanvas.css';

// ... (slotToObjectId, rewriteActionConditionEffectWithBoundObjects 함수는 기존과 동일하므로 생략하지 않고 포함) ...
const slotToObjectId = (actionBlock, slot) => {
  if (slot === 'actor') return actionBlock?.actor?.ref ?? null;
  if (slot === 'target') return actionBlock?.target?.ref ?? null;
  return null;
};

const rewriteActionConditionEffectWithBoundObjects = (actionBlock) => {
  const eff = Array.isArray(actionBlock.effect) ? actionBlock.effect : [];
  const cond = Array.isArray(actionBlock.condition) ? actionBlock.condition : [];

  const mapOne = (x) => {
    if (!x || typeof x !== 'object') return x;
    const next = { ...x };

    if (next.lvalue?.objectRef === 'actor' || next.lvalue?.objectRef === 'target') {
      const resolved = slotToObjectId(actionBlock, next.lvalue.objectRef);
      next.lvalue = { ...next.lvalue, objectRef: resolved ?? next.lvalue.objectRef };
    }

    if (
      next.rvalue?.kind === 'state' &&
      (next.rvalue.objectRef === 'actor' || next.rvalue.objectRef === 'target')
    ) {
      const resolved = slotToObjectId(actionBlock, next.rvalue.objectRef);
      next.rvalue = { ...next.rvalue, objectRef: resolved ?? next.rvalue.objectRef };
    }

    return next;
  };

  return {
    ...actionBlock,
    condition: cond.map(mapOne),
    effect: eff.map(mapOne),
  };
};

const BlockCanvas = ({ files = [], onSceneGenerated }) => {
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);

  const [isGenerating, setIsGenerating] = useState(false);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const { draggingId, startDrag, updateDrag, endDrag } = useBlockDragger(setBlocks);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  const [connectionSource, setConnectionSource] = useState(null);

  const canvasRef = useRef(null);
  const stateDefById = useMemo(() => buildStateDefMap(files), [files]);

  const fromBlock = useMemo(() => {
    if (!connectionSource) return null;
    return blocks.find((b) => b.uniqueId === connectionSource.blockId) || null;
  }, [connectionSource, blocks]);

  const isConnectMode = !!connectionSource;

  // ... (이벤트 핸들러들: handleMouseDown, handleMouseMoveGlobal, handleMouseUpGlobal, handleBlockMouseDown, handleDrop, handleDragOver, handleDeleteBlock 유지) ...
  const handleMouseDown = (e) => {
    if (e.button === 0 && connectionSource) {
      setConnectionSource(null);
      return;
    }
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMoveGlobal = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    if (draggingId !== null) updateDrag(e, pan);
  };

  const handleMouseUpGlobal = () => {
    setIsPanning(false);
    endDrag();
  };

  const handleBlockMouseDown = (e, blockId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (connectionSource) return;

    const block = blocks.find((b) => b.uniqueId === blockId);
    if (!block) return;
    startDrag(e, blockId, { x: block.x, y: block.y }, pan);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const item = JSON.parse(data);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - pan.x;
    const y = e.clientY - rect.top - pan.y;

    const type = item.type === 'Transition' ? 'Action' : item.type;
    const isState = type === 'State';
    const def = isState ? stateDefById.get(item.id) : null;

    const mainBlock = {
      ...item,
      type,
      uniqueId: Date.now(),
      x,
      y,
      owner: item.owner ?? null,
      state: type === 'Object'
          ? Array.isArray(item.state)
            ? item.state.map((s) => ({ ref: s.ref, currentValue: s.currentValue ?? null }))
            : []
          : item.state,
      ...(isState ? {
            mode: item.mode ?? 'slot',
            values: Array.isArray(item.values) ? item.values : (def?.values ?? []),
            currentValue: item.currentValue ?? (Array.isArray(item.values) ? item.values[0] : def?.values?.[0]) ?? null,
          } : {}),
    };

    if (type === 'Condition') {
      mainBlock.lvalue = item.lvalue ?? null;
      mainBlock.rvalue = item.rvalue ?? null;
    }

    if (type === 'Action') {
      mainBlock.actor = item.actor ?? { type: 'Object', ref: null };
      mainBlock.target = item.target ?? { type: 'Object', ref: null };
      mainBlock.condition = Array.isArray(item.condition) ? item.condition : [];
      mainBlock.effect = Array.isArray(item.effect) ? item.effect : [];
      Object.assign(mainBlock, rewriteActionConditionEffectWithBoundObjects(mainBlock));
    }

    setBlocks((prev) => [...prev, mainBlock]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDeleteBlock = (e, blockId) => {
    e.stopPropagation();
    setBlocks((prev) => prev.filter((b) => b.uniqueId !== blockId));
    setConnections((prev) => prev.filter((c) => c.from.blockId !== blockId && c.to.blockId !== blockId));
    if (connectionSource?.blockId === blockId) setConnectionSource(null);
  };

  // ... (Connection helpers: removeExistingIncomingToPort, startConnectFrom, connectTo 등 유지) ...
  const removeExistingIncomingToPort = (toBlockId, toPort) => {
    setConnections((prev) => prev.filter((c) => !(c.to.blockId === toBlockId && c.to.port === toPort)));
  };

  const startConnectFrom = (e, blockId, port) => {
    e.stopPropagation();
    setConnectionSource({ blockId, port });
  };

  const connectTo = (e, toBlockId, toPort) => {
    e.stopPropagation();
    if (!connectionSource) return;

    const from = connectionSource;
    const to = { blockId: toBlockId, port: toPort };

    const fromB = blocks.find((b) => b.uniqueId === from.blockId);
    const toB = blocks.find((b) => b.uniqueId === to.blockId);

    const getStateOutMode = (stBlock, fromPort) => {
      if (fromPort === 'out:value') return 'value';
      return stBlock?.mode || 'slot';
    };

    const resolveStateTypedValue = (stBlock) => {
      const srcDef = stateDefById.get(stBlock.id);
      return stBlock.currentValue ?? srcDef?.values?.[0] ?? null;
    };

    if (!isAllowedConnection(fromB, from.port, toB, to.port)) {
      setConnectionSource(null);
      return;
    }

    const isSingleIncomingPort =
      (toB?.type === 'State' && to.port === 'in:owner') ||
      (toB?.type === 'State' && to.port === 'in:value') ||
      (toB?.type === 'Condition' && (to.port === 'in:lvalue' || to.port === 'in:rvalue')) ||
      (toB?.type === 'Action' && (to.port === 'in:actor' || to.port === 'in:target'));

    if (isSingleIncomingPort) {
      removeExistingIncomingToPort(to.blockId, to.port);
    }

    const exists = connections.some(
      (c) => c.from.blockId === from.blockId && c.from.port === from.port && c.to.blockId === to.blockId && c.to.port === to.port
    );

    if (!exists) {
      setConnections((prev) => [...prev, { id: Date.now(), from, to }]);
    }
    const syncActionEffectObjectRefs = (action) => {
      const actorId = action?.actor?.ref ?? null;
      const targetId = action?.target?.ref ?? null;

      const nextEffects = (Array.isArray(action.effect) ? action.effect : []).map((e) => {
        const ownerId = e?._srcOwnerId ?? null;
        if (!ownerId) return e;

        const nextObjectRef =
          actorId && ownerId === actorId ? 'actor' :
          targetId && ownerId === targetId ? 'target' :
          ownerId;

        if (!e?.lvalue) return e;
        return { ...e, lvalue: { ...e.lvalue, objectRef: nextObjectRef } };
      });

      return { ...action, effect: nextEffects };
    };
    // Side effects (1~6번 로직 유지)
    if (fromB?.type === 'State' && (from.port === 'out' || from.port === 'out:value') && toB?.type === 'Condition') {
      const mode = getStateOutMode(fromB, from.port);
      if (to.port === 'in:lvalue') {
        if (mode !== 'slot') { setConnectionSource(null); return; }
        const payload = { objectRef: 'target', stateRef: fromB.id };
        setBlocks((prev) => prev.map((b) => (b.uniqueId === to.blockId ? { ...b, lvalue: payload } : b)));
      }
      if (to.port === 'in:rvalue') {
        const payload = mode === 'slot'
            ? { kind: 'state', objectRef: 'target', stateRef: fromB.id }
            : resolveStateTypedValue(fromB);
        setBlocks((prev) => prev.map((b) => (b.uniqueId === to.blockId ? { ...b, rvalue: payload } : b)));
      }
    }
    if (fromB?.type === 'Object' && typeof from.port === 'string' && from.port.startsWith('out:state:') && toB?.type === 'Condition') {
      const stateRef = from.port.replace('out:state:', '');
      if (to.port === 'in:lvalue') {
        setBlocks((prev) =>
          prev.map((b) =>
            b.uniqueId === to.blockId ? { ...b, lvalue: { objectRef: fromB.id, stateRef } } : b
          )
        );
      }
      if (to.port === 'in:rvalue') {
        setBlocks((prev) =>
          prev.map((b) =>
            b.uniqueId === to.blockId ? { ...b, rvalue: { kind: 'state', objectRef: fromB.id, stateRef } } : b
          )
        );
      }
    }
    if (fromB?.type === 'Object' && from.port === 'out' && toB?.type === 'State' && to.port === 'in:owner') {
      setBlocks((prev) => prev.map((b) => (b.uniqueId === to.blockId ? { ...b, owner: fromB.id } : b)));
    }
    if (fromB?.type === 'State' && from.port === 'out' && toB?.type === 'Object' && to.port === 'in:states') {
      setBlocks((prev) => prev.map((b) => (b.uniqueId === from.blockId ? { ...b, owner: toB.id } : b)));
    }
    if (fromB?.type === 'Object' && from.port === 'out' && toB?.type === 'Action') {
      const payload = { type: 'Object', ref: fromB.id };
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.uniqueId !== to.blockId) return b;

          let next = b;
          if (to.port === 'in:actor') next = { ...b, actor: payload };
          if (to.port === 'in:target') next = { ...b, target: payload };

          next = syncActionEffectObjectRefs(next);
          return next;
        })
      );
    }
    if (fromB?.type === 'Condition' && from.port === 'out' && toB?.type === 'Action' && to.port === 'in:conditions') {
      setBlocks((prev) => prev.map((b) => {
          if (b.uniqueId !== to.blockId) return b;
          const list = Array.isArray(b.condition) ? b.condition : [];
          const payload = {
            id: `use-${fromB.id}-${Date.now()}`,
            type: 'Condition',
            rel: fromB.rel,
            lvalue: fromB.lvalue ?? null,
            rvalue: fromB.rvalue ?? null,
          };
          return { ...b, condition: [...list, payload] };
        })
      );
    }
    if (fromB?.type === 'State' && (from.port === 'out:value' || from.port === 'out') && toB?.type === 'State' && to.port === 'in:value') {
      const mode = getStateOutMode(fromB, from.port);
      if (mode !== 'value') { setConnectionSource(null); return; }
      const resolved = resolveStateTypedValue(fromB);
      setBlocks((prev) => prev.map((b) => (b.uniqueId === to.blockId ? { ...b, currentValue: resolved } : b)));
    }
    setConnectionSource(null);

    if (fromB?.type === 'State' && (from.port === 'out' || from.port === 'out:value') && toB?.type === 'Action' && to.port === 'in:effects') {
      const mode = getStateOutMode(fromB, from.port);
      setBlocks((prev) => prev.map((b) => {
          if (b.uniqueId !== to.blockId) return b;
          const list = Array.isArray(b.effect) ? b.effect : [];
          if (mode === 'slot') {
            const payload = { id: `eff-${fromB.id}-${Date.now()}`, rel: 'set', lvalue: { objectRef: 'target', stateRef: fromB.id }, rvalue: null };
            return { ...b, effect: [...list, payload] };
          }
          const tv = resolveStateTypedValue(fromB);
          const idx = [...list].reverse().findIndex((e) => e?.lvalue && (e?.rvalue == null));
          if (idx !== -1) {
            const realIdx = list.length - 1 - idx;
            const next = list.map((e, i) => (i === realIdx ? { ...e, rvalue: tv } : e));
            return { ...b, effect: next };
          }
          const payload = { id: `effv-${fromB.id}-${Date.now()}`, rel: 'set', lvalue: null, rvalue: tv };
          return { ...b, effect: [...list, payload] };
        })
      );
    }
    if (fromB?.type === 'Action' && from.port === 'out:effects' && toB?.type === 'State' && to.port === 'in:effect') {
      const stateId = toB.id;
      const ownerId = toB.owner ?? null;

      // ownerId가 actor/target 중 누구인지 추정해서 objectRef 결정
      const actorId = fromB.actor?.ref ?? null;
      const targetId = fromB.target?.ref ?? null;

      const objectRef =
        ownerId && actorId && ownerId === actorId ? 'actor' :
        ownerId && targetId && ownerId === targetId ? 'target' :
        (ownerId || 'target'); // fallback: objectId 또는 target

      const def = stateDefById.get(stateId);
      const rvalue = toB.currentValue ?? def?.values?.[0] ?? null;

      const payload = {
        id: `eff-${stateId}-${Date.now()}`,
        type: 'Effect',
        rel: 'set',
        lvalue: { objectRef, stateRef: stateId },
        rvalue, // typed value 그대로
        _srcOwnerId: ownerId, // 나중에 actor/target 바뀌면 재계산용
      };

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.uniqueId !== from.blockId) return b;
          const list = Array.isArray(b.effect) ? b.effect : [];
          // 같은 stateId로 중복 추가 방지(원하면 제거 가능)
          const exists = list.some((e) => e?.lvalue?.stateRef === stateId);
          return exists ? b : { ...b, effect: [...list, payload] };
        })
      );
    }
  };

  const isPortSelectable = useCallback(
    (toBlockId, toPort) => {
      if (!connectionSource) return false;
      const toBlock = blocks.find((b) => b.uniqueId === toBlockId);
      if (!fromBlock || !toBlock) return false;
      return isAllowedConnection(fromBlock, connectionSource.port, toBlock, toPort);
    },
    [connectionSource, blocks, fromBlock]
  );

  const getRelLabel = (rel) => {
    const list = Array.isArray(files) ? files : [];
    const def = list.find((f) => f?.type === 'Condition' && f?.rel === rel && f?.lvalue == null && f?.rvalue == null && typeof f?.label === 'string');
    return def?.label || rel || '?';
  };

  const getBlockTitle = (block) => {
    if (block?.type === 'Condition') {
      if (block.lvalue == null && block.rvalue == null) return block.label || getRelLabel(block.rel) || 'Condition';
      return getRelLabel(block.rel) || 'Condition';
    }
    return block?.name || block?.contentName || block?.label || 'Untitled';
  };

  const handleGenerateSnapshot = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const snapshot = exportCanvasSnapshot({ blocks, connections, stateDefById });
      const sceneSpec = buildSceneSpec(snapshot);
      const imagePrompt = await generateImagePrompt(sceneSpec);
      console.log("Generated Prompt:", imagePrompt);
      const imageUrl = await generateSceneImage(imagePrompt);

      if (onSceneGenerated) {
        onSceneGenerated(imageUrl);
      }
    } catch (e) {
      console.error("Snapshot generation failed:", e);
      alert("Snapshot 생성 실패");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="canvas-container"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveGlobal}
      onMouseUp={handleMouseUpGlobal}
      onMouseLeave={handleMouseUpGlobal}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isPanning ? 'grabbing' : connectionSource ? 'crosshair' : 'default' }}
    >
      <div className="canvas-content-layer" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
        <svg className="connections-layer">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
            </marker>
          </defs>
          {connections.map((conn) => {
            const from = blocks.find((b) => b.uniqueId === conn.from.blockId);
            const to = blocks.find((b) => b.uniqueId === conn.to.blockId);
            if (!from || !to) return null;
            const { w: fromW, h: fromH } = computeBlockSize(from);
            const { w: toW, h: toH } = computeBlockSize(to);
            return (
              <line
                key={conn.id}
                x1={from.x + fromW / 2}
                y1={from.y + fromH / 2}
                x2={to.x + toW / 2}
                y2={to.y + toH / 2}
                className="connection-line"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {blocks.map((block) => (
          <BlockCard
            key={block.uniqueId}
            block={block}
            title={getBlockTitle(block)}
            stateDefById={stateDefById}
            blocks={blocks}
            connections={connections}
            isActiveSource={connectionSource?.blockId === block.uniqueId}
            isConnectMode={isConnectMode}
            isPortSelectable={(port) => isPortSelectable(block.uniqueId, port)}
            onMouseDown={handleBlockMouseDown}
            onStartConnect={startConnectFrom}
            onConnectTo={connectTo}
            onEdit={(b) => {
              setEditingBlock(b);
              setIsEditorOpen(true);
            }}
            onDelete={handleDeleteBlock}
            onUpdateBlock={(patch) =>
              setBlocks((prev) =>
                prev.map((b) => (b.uniqueId === block.uniqueId ? { ...b, ...patch } : b))
              )
            }
          />
        ))}
      </div>

      <div className="canvas-ui-layer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Global Canvas (Wheel-click to Pan)</h2>
          {/* [수정] Step 5 버튼 스타일 반영 */}
          <button 
            onClick={handleGenerateSnapshot}
            disabled={isGenerating}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: isGenerating ? '#ccc' : '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              pointerEvents: 'auto',
              transition: 'background-color 0.2s'
            }}
          >
            {isGenerating ? 'Generating...' : 'Visualize Scene'}
          </button>
        </div>
        {connectionSource && <div className="conn-hint">Select target port to connect</div>}
      </div>

      <ComponentEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(updated) =>
          setBlocks((prev) =>
            prev.map((b) => {
              if (b.uniqueId !== updated.uniqueId) return b;
              if (updated.type !== 'Action') return updated;
              return rewriteActionConditionEffectWithBoundObjects(updated);
            })
          )
        }
        item={editingBlock}
      />
    </div>
  );
};

export default BlockCanvas;