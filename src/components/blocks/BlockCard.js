// src/components/blocks/BlockCard.js
import React, { useMemo } from 'react';
import { PencilIcon, TrashIcon } from '../Icons';
import LinkHandle from './LinkHandle';
import { ObjectContent, ActionContent, StateContent, ConditionContent } from './BlockContents';
import './BlockCard.css';

const BlockCard = ({
  block,
  title,
  stateDefById,
  blocks,
  connections,
  isActiveSource,
  isConnectMode,
  isPortSelectable,
  onMouseDown,
  onStartConnect,
  onConnectTo,
  onEdit,
  onDelete,
  onUpdateBlock,
}) => {
  const can = (port) => (typeof isPortSelectable === 'function' ? !!isPortSelectable(port) : false);

  const startOut = (e, port = 'out') => {
    e.stopPropagation();
    onStartConnect(e, block.uniqueId, port);
  };

  const clickIn = (e, port) => {
    e.stopPropagation();
    onConnectTo(e, block.uniqueId, port);
  };

  const targetPortsByType = useMemo(() => {
    switch (block.type) {
      case 'Object':
        return ['in:states'];
      case 'State':
        return ['in:value', 'in:owner', 'in:effect'];
      case 'Condition':
        return ['in:lvalue', 'in:rvalue'];
      case 'Action':
        return ['in:actor', 'in:target', 'in:conditions'];
      default:
        return [];
    }
  }, [block.type]);

  const isSelectableTarget = isConnectMode && targetPortsByType.some((p) => can(p));

  const commonProps = {
    block,
    blocks,
    stateDefById,
    isConnectMode,
    can,
    clickIn,
    startOut,
    onUpdateBlock,
  };

  return (
    <div
      className={[
        `canvas-block block-${String(block.type || '').toLowerCase()}`,
        isActiveSource ? 'source-active' : '',
        isSelectableTarget ? 'connect-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: block.x, top: block.y }}
      onMouseDown={(e) => onMouseDown(e, block.uniqueId)}
    >
      <div className="block-controls">
        <span
          className="control-icon"
          onMouseDown={(e) => {
            e.stopPropagation();
            onEdit(block);
          }}
        >
          <PencilIcon />
        </span>

        <span
          className="control-icon delete-icon"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDelete(e, block.uniqueId);
          }}
        >
          <TrashIcon />
        </span>
      </div>

      <div className="block-header">{block.type}</div>

      <div className="block-main-text block-title-row">
        <span className="block-title-text">{title}</span>

        {/* Object/State/Condition 은 기본 out */}
        {(block.type === 'Object' || block.type === 'State' || block.type === 'Condition') && (
          <LinkHandle active={isActiveSource} title="out" onMouseDown={(e) => startOut(e, 'out')} />
        )}

        {/* Action 은 effects를 out으로 */}
        {block.type === 'Action' && (
          <LinkHandle active={isActiveSource} title="out:effects" onMouseDown={(e) => startOut(e, 'out:effects')} />
        )}
      </div>

      {block.type === 'Object' && <ObjectContent {...commonProps} />}
      {block.type === 'Action' && <ActionContent {...commonProps} connections={connections} />}
      {block.type === 'State' && <StateContent {...commonProps} isActiveSource={isActiveSource} />}
      {block.type === 'Condition' && <ConditionContent {...commonProps} />}
    </div>
  );
};

export default BlockCard;
