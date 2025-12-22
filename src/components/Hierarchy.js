// src/components/Hierarchy.js
import React, { useState, useMemo } from 'react';
import FileGenerator from './FileGenerator';
import ComponentEditor from './ComponentEditor';
import { PencilIcon, ArrowIcon } from './Icons';
import { INITIAL_FILES } from '../data/initialData';
import './Hierarchy.css';

const Hierarchy = ({ files, setFiles, onUpdateFile }) => {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(true);

  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (type) => {
    setCollapsedSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleFileGenerated = (newFile) => setFiles((prev) => [...prev, newFile]);

  const handleItemClick = (file) => {
    setEditingItem(file);
    setInitialEditMode(false);
    setIsEditorOpen(true);
  };

  const handleEditClick = (e, file) => {
    e.stopPropagation();
    setEditingItem(file);
    setInitialEditMode(true);
    setIsEditorOpen(true);
  };

  const handleSaveEdit = (updatedItem) => onUpdateFile(updatedItem);

  const handleDragStart = (e, file) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const safeFiles = Array.isArray(files) ? files : [];

  // INITIAL_FILES 안의 "연산자 정의 Condition" (lvalue/rvalue가 비어있는 템플릿)
  const staticRelConditions = useMemo(() => {
    const list = Array.isArray(INITIAL_FILES) ? INITIAL_FILES : [];
    return list.filter(
      (f) => f?.type === 'Condition' && f?.lvalue == null && f?.rvalue == null
    );
  }, []);

  // Condition 섹션: (1) files 내 Condition + (2) INITIAL_FILES의 연산자 정의 Condition
  const conditionFiles = useMemo(() => {
    const dynamic = safeFiles.filter((f) => f?.type === 'Condition');
    const dynamicIds = new Set(dynamic.map((d) => d?.id).filter(Boolean));
    const mergedStatic = staticRelConditions.filter((s) => s?.id && !dynamicIds.has(s.id));
    return [...dynamic, ...mergedStatic];
  }, [safeFiles, staticRelConditions]);

  const getStateName = (stateId) => {
    const st = safeFiles.find((f) => f?.type === 'State' && f?.id === stateId);
    return st?.name || stateId || '?';
  };

  const getObjectName = (objectId) => {
    const obj = safeFiles.find((f) => f?.type === 'Object' && f?.id === objectId);
    return obj?.name || objectId || '?';
  };

  // objectRef가 슬롯(actor/target)인지 실제 object id인지 구분해 표시
  const formatObjectRef = (ref) => {
    if (!ref) return '?';
    if (ref === 'actor' || ref === 'target') return ref;
    return getObjectName(ref);
  };

  // {kind, value} 또는 원시값을 표시용 문자열로 변환
  const formatTypedValue = (v) => {
    if (v === null || v === undefined) return '?';

    // typed value
    if (typeof v === 'object' && v?.kind) {
      const kind = String(v.kind).toLowerCase();
      const value = v.value;

      if (kind === 'bool') return value ? 'true' : 'false';

      // object ref
      if (kind === 'object') return getObjectName(value);

      // string-like
      if (kind === 'literal' || kind === 'string') return value ?? '?';

      // fallback
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return '?';
    }

    // primitive
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') {
      // 값이 object id일 수도 있으니 이름으로 표시
      const obj = safeFiles.find((f) => f?.type === 'Object' && f?.id === v);
      return obj?.name || v;
    }

    return '?';
  };

  const getRelLabel = (rel) => {
    const def = conditionFiles.find(
      (c) =>
        c?.type === 'Condition' &&
        c?.rel === rel &&
        c?.lvalue == null &&
        c?.rvalue == null &&
        typeof c?.label === 'string'
    );
    return def?.label || rel || '?';
  };

  // lvalue: { objectRef, stateRef }
  const formatLValue = (lv) => {
    if (!lv) return '?';
    const o = formatObjectRef(lv.objectRef);
    const s = getStateName(lv.stateRef);
    return `${o}.${s}`;
  };

  // rvalue:
  // - { kind:'state', objectRef, stateRef }
  // - { kind:'object'|'bool'|'literal', value }
  const formatRValue = (rv) => {
    if (!rv) return '?';
    if (rv.kind && String(rv.kind).toLowerCase() === 'state') {
      return formatLValue({ objectRef: rv.objectRef, stateRef: rv.stateRef });
    }
    // literal/bool/object
    return formatTypedValue(rv);
  };

  const formatCondition = (cond) => {
    if (!cond) return '?';
    const left = formatLValue(cond.lvalue);
    const rel = getRelLabel(cond.rel);
    const right = formatRValue(cond.rvalue);
    return `${left} ${rel} ${right}`;
  };

  const formatEffect = (eff) => {
    if (!eff) return '?';
    const left = formatLValue(eff.lvalue);
    const right = formatRValue(eff.rvalue);
    // Effect는 rel이 보통 set
    return `${left} ← ${right}`;
  };

  const renderFileDetails = (file) => {
    switch (file.type) {
      case 'Object': {
        const states = Array.isArray(file.state) ? file.state : [];
        return (
          <div className="item-details">
            <div className="detail-desc">{file.description}</div>
            {states.length > 0 && (
              <div className="detail-text">
                {states.map((s) => (
                  <div key={`${file.id}-${s?.ref || Math.random()}`}>
                    {getStateName(s?.ref)}: {formatTypedValue(s?.currentValue)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'State':
        return (
          <div className="item-details">
            <span className="detail-text">
              Values: {(file.values || []).map(formatTypedValue).join(', ')}
            </span>
          </div>
        );

      case 'Action': {
        const conds = Array.isArray(file.condition) ? file.condition : [];
        const effs = Array.isArray(file.effect) ? file.effect : [];
        return (
          <div className="item-details transition-flow">
            <span className="trans-node">
              {conds.length ? conds.map(formatCondition).join(' AND ') : '조건 없음'}
            </span>
            <span className="trans-arrow">→</span>
            <span className="trans-node">
              {effs.length ? effs.map(formatEffect).join(', ') : '효과 없음'}
            </span>
          </div>
        );
      }

      case 'Condition': {
        // 연산자 정의 템플릿은 상세 표시 없음
        if (file.lvalue == null && file.rvalue == null) return null;

        const left = formatLValue(file.lvalue);
        const rel = getRelLabel(file.rel);
        const right = formatRValue(file.rvalue);

        return (
          <div className="item-details">
            <div className="condition-tag-group">
              <span className="cond-part var">{left}</span>
              <span className="cond-part rel">{rel}</span>
              <span className="cond-part val">{right}</span>
            </div>
          </div>
        );
      }

      case 'Goal':
        return (
          <div className="item-details">
            <div className="detail-desc">Goal: {formatCondition(file.condition)}</div>
          </div>
        );

      default:
        return null;
    }
  };

  const getItemTitle = (file) => {
    if (file?.type === 'Condition') {
      // 연산자 정의 템플릿: label만
      if (file.lvalue == null && file.rvalue == null) return file.label || getRelLabel(file.rel) || 'Condition';
      // 실제 조건: rel 라벨
      return getRelLabel(file.rel) || 'Condition';
    }
    return file?.name || file?.contentName || file?.targetContent || file?.label || 'Untitled';
  };

  const getSectionFiles = (type) => {
    if (type === 'Condition') return conditionFiles;
    return safeFiles.filter((f) => f?.type === type);
  };

  const types = ['Goal', 'Object', 'Action', 'State', 'Condition'];

  return (
    <div className="files-container">
      <div className="files-header">
        <h2>Assets</h2>
        <button className="add-btn" onClick={() => setIsGeneratorOpen(true)}>
          +
        </button>
      </div>

      <div className="hierarchy-content">
        {types.map((type) => {
          const sectionFiles = getSectionFiles(type);
          const isCollapsed = collapsedSections[type];

          return (
            <div key={type} className="hierarchy-section">
              <div className="section-header" onClick={() => toggleSection(type)}>
                <span className="section-toggle-icon">
                  <ArrowIcon isOpen={!isCollapsed} />
                </span>
                <span className="section-title">{type}</span>
                <span className="section-count">({sectionFiles.length})</span>
              </div>

              {!isCollapsed && (
                <div className="section-body">
                  {sectionFiles.length === 0 ? (
                    <div className="empty-section-msg">Empty</div>
                  ) : (
                    sectionFiles.map((file) => (
                      <div
                        key={file.id}
                        className="file-item"
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, file)}
                        onClick={() => handleItemClick(file)}
                      >
                        <div className="item-controls">
                          <span className="control-icon edit-icon" onClick={(e) => handleEditClick(e, file)}>
                            <PencilIcon />
                          </span>
                        </div>

                        <div className="file-item-header">
                          {file.type !== 'Object' && file.owner && <span className="owner-badge">{file.owner}</span>}

                          <span className={`file-tag tag-${file.type.toLowerCase()}`}>{file.type.charAt(0)}</span>

                          <div className="file-title">
                            <strong>{getItemTitle(file)}</strong>
                          </div>
                        </div>

                        {renderFileDetails(file)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FileGenerator
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onGenerate={handleFileGenerated}
      />

      <ComponentEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEdit}
        item={editingItem}
        initialEditMode={initialEditMode}
      />
    </div>
  );
};

export default Hierarchy;
