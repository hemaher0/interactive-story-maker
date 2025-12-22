import React, { useState, useEffect, useMemo } from 'react';
import { PencilIcon } from './Icons';
import './ComponentEditor.css';

const isTypedValue = (v) => v && typeof v === 'object' && typeof v.kind === 'string' && 'value' in v;

const normalizeTypedValue = (tv) => {
  if (!isTypedValue(tv)) return { kind: 'literal', value: '' };
  const kind = String(tv.kind);
  const value = tv.value;
  return { kind, value };
};

const stringifyTypedValue = (tv) => {
  if (!isTypedValue(tv)) return '';
  const kind = String(tv.kind);
  const value = tv.value;

  if (kind.toLowerCase() === 'bool') return value ? 'true' : 'false';
  return String(value ?? '');
};

const parseTypedValue = (kind, raw) => {
  const k = String(kind || 'literal');
  const lower = k.toLowerCase();

  if (lower === 'bool') {
    const v = String(raw).trim().toLowerCase();
    return { kind: 'bool', value: v === 'true' || v === '1' || v === 'yes' };
  }

  // object / literal
  return { kind: k, value: raw };
};

// lvalue: { objectRef, stateRef }
const normalizeLValue = (lv) => ({
  objectRef: lv?.objectRef ?? 'actor',
  stateRef: lv?.stateRef ?? ''
});

// rvalue:
// - { kind:'state', objectRef, stateRef }
// - { kind:'object'|'bool'|'literal', value }
const normalizeRValue = (rv) => {
  if (!rv || typeof rv !== 'object') return { kind: 'literal', value: '' };
  const kind = String(rv.kind || 'literal');

  if (kind.toLowerCase() === 'state') {
    return {
      kind: 'state',
      objectRef: rv.objectRef ?? 'target',
      stateRef: rv.stateRef ?? ''
    };
  }

  return { kind, value: rv.value ?? '' };
};

const ComponentEditor = ({ isOpen, onClose, onSave, item, initialEditMode = true }) => {
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(initialEditMode);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setIsEditing(initialEditMode);
    }
  }, [item, isOpen, initialEditMode]);

  if (!isOpen || !item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  // ---------- Typed State Values Editor Helpers ----------
  const handleStateRowChange = (idx, key, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      const arr = Array.isArray(next.state) ? [...next.state] : [];
      const row = { ...(arr[idx] || {}) };

      if (key === 'ref') row.ref = value;
      if (key === 'kind') row.currentValue = parseTypedValue(value, stringifyTypedValue(row.currentValue));
      if (key === 'value') row.currentValue = parseTypedValue(row.currentValue?.kind || 'literal', value);

      arr[idx] = row;
      next.state = arr;
      return next;
    });
  };

  const addStateRow = () => {
    setFormData((prev) => ({
      ...prev,
      state: [...(Array.isArray(prev.state) ? prev.state : []), { ref: '', currentValue: { kind: 'literal', value: '' } }]
    }));
  };

  const removeStateRow = (idx) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.state) ? [...prev.state] : [];
      arr.splice(idx, 1);
      return { ...prev, state: arr };
    });
  };

  // ---------- State.values Editor Helpers ----------
  const handleStateValuesChange = (idx, key, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      const arr = Array.isArray(next.values) ? [...next.values] : [];
      const tv = normalizeTypedValue(arr[idx]);

      if (key === 'kind') arr[idx] = parseTypedValue(value, stringifyTypedValue(tv));
      if (key === 'value') arr[idx] = parseTypedValue(tv.kind, value);

      next.values = arr;
      return next;
    });
  };

  const addStateValue = () => {
    setFormData((prev) => ({
      ...prev,
      values: [...(Array.isArray(prev.values) ? prev.values : []), { kind: 'literal', value: '' }]
    }));
  };

  const removeStateValue = (idx) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.values) ? [...prev.values] : [];
      arr.splice(idx, 1);
      return { ...prev, values: arr };
    });
  };

  // ---------- Condition / Effect Editor Helpers ----------
  const handleConditionChange = (idx, path, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      const conds = Array.isArray(next.condition) ? [...next.condition] : [];
      const c = { ...(conds[idx] || {}) };

      if (path === 'rel') c.rel = value;

      if (path === 'lvalue.objectRef') c.lvalue = { ...normalizeLValue(c.lvalue), objectRef: value };
      if (path === 'lvalue.stateRef') c.lvalue = { ...normalizeLValue(c.lvalue), stateRef: value };

      if (path === 'rvalue.kind') {
        const rv = normalizeRValue(c.rvalue);
        const newKind = value;

        if (String(newKind).toLowerCase() === 'state') {
          c.rvalue = { kind: 'state', objectRef: 'target', stateRef: '' };
        } else {
          // state -> typed value
          c.rvalue = { kind: newKind, value: '' };
        }
      }

      if (path === 'rvalue.objectRef') {
        const rv = normalizeRValue(c.rvalue);
        c.rvalue = { ...rv, objectRef: value };
      }
      if (path === 'rvalue.stateRef') {
        const rv = normalizeRValue(c.rvalue);
        c.rvalue = { ...rv, stateRef: value };
      }
      if (path === 'rvalue.value') {
        const rv = normalizeRValue(c.rvalue);
        c.rvalue = { ...rv, value: value };
      }

      conds[idx] = c;
      next.condition = conds;
      return next;
    });
  };

  const addConditionRow = () => {
    setFormData((prev) => ({
      ...prev,
      condition: [
        ...(Array.isArray(prev.condition) ? prev.condition : []),
        {
          id: `cond-${Date.now()}`,
          type: 'Condition',
          rel: 'equals',
          lvalue: { objectRef: 'actor', stateRef: '' },
          rvalue: { kind: 'literal', value: '' }
        }
      ]
    }));
  };

  const removeConditionRow = (idx) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.condition) ? [...prev.condition] : [];
      arr.splice(idx, 1);
      return { ...prev, condition: arr };
    });
  };

  const handleEffectChange = (idx, path, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      const effs = Array.isArray(next.effect) ? [...next.effect] : [];
      const e = { ...(effs[idx] || {}) };

      if (path === 'rel') e.rel = value;

      if (path === 'lvalue.objectRef') e.lvalue = { ...normalizeLValue(e.lvalue), objectRef: value };
      if (path === 'lvalue.stateRef') e.lvalue = { ...normalizeLValue(e.lvalue), stateRef: value };

      if (path === 'rvalue.kind') {
        const newKind = value;
        if (String(newKind).toLowerCase() === 'state') {
          e.rvalue = { kind: 'state', objectRef: 'target', stateRef: '' };
        } else {
          e.rvalue = { kind: newKind, value: '' };
        }
      }

      if (path === 'rvalue.objectRef') e.rvalue = { ...normalizeRValue(e.rvalue), objectRef: value };
      if (path === 'rvalue.stateRef') e.rvalue = { ...normalizeRValue(e.rvalue), stateRef: value };
      if (path === 'rvalue.value') e.rvalue = { ...normalizeRValue(e.rvalue), value: value };

      effs[idx] = e;
      next.effect = effs;
      return next;
    });
  };

  const addEffectRow = () => {
    setFormData((prev) => ({
      ...prev,
      effect: [
        ...(Array.isArray(prev.effect) ? prev.effect : []),
        {
          id: `eff-${Date.now()}`,
          type: 'Effect',
          rel: 'set',
          lvalue: { objectRef: 'actor', stateRef: '' },
          rvalue: { kind: 'literal', value: '' }
        }
      ]
    }));
  };

  const removeEffectRow = (idx) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.effect) ? [...prev.effect] : [];
      arr.splice(idx, 1);
      return { ...prev, effect: arr };
    });
  };

  // ---------- View format helpers ----------
  const formatTyped = (tv) => {
    if (!isTypedValue(tv)) return '-';
    const kind = String(tv.kind);
    const value = tv.value;

    if (kind.toLowerCase() === 'bool') return value ? 'true' : 'false';
    return `${kind}:${String(value ?? '')}`;
  };

  const formatLValueView = (lv) => {
    if (!lv) return '-';
    return `${lv.objectRef || '?'} . ${lv.stateRef || '?'}`;
  };

  const formatRValueView = (rv) => {
    if (!rv) return '-';
    if (String(rv.kind).toLowerCase() === 'state') return `${rv.objectRef || '?'} . ${rv.stateRef || '?'}`;
    return formatTyped(rv);
  };

  const renderView = () => {
    const commonRows = (
      <>
        <div className="view-row">
          <strong>Owner:</strong> <span>{item.owner || 'Common Asset'}</span>
        </div>
        <div className="view-row">
          <strong>Name:</strong> <span>{item.name || item.contentName}</span>
        </div>
        {item.description && (
          <div className="view-row">
            <strong>Description:</strong> <p>{item.description}</p>
          </div>
        )}
      </>
    );

    switch (item.type) {
      case 'Object': {
        const st = Array.isArray(item.state) ? item.state : [];
        return (
          <div className="view-content">
            {commonRows}
            <div className="view-row">
              <strong>State:</strong>
              <span>
                {st.length
                  ? st.map((s) => `${s.ref}: ${formatTyped(s.currentValue)}`).join(', ')
                  : '-'}
              </span>
            </div>
          </div>
        );
      }

      case 'State': {
        const vals = Array.isArray(item.values) ? item.values : [];
        return (
          <div className="view-content">
            {commonRows}
            <div className="view-row">
              <strong>Values:</strong> <span>{vals.length ? vals.map(formatTyped).join(', ') : '-'}</span>
            </div>
          </div>
        );
      }

      case 'Action': {
        const conds = Array.isArray(item.condition) ? item.condition : [];
        const effs = Array.isArray(item.effect) ? item.effect : [];
        return (
          <div className="view-content">
            {commonRows}
            <div className="view-row">
              <strong>Actor:</strong> <span>{item.actor?.ref ?? '-'}</span>
            </div>
            <div className="view-row">
              <strong>Target:</strong> <span>{item.target?.ref ?? '-'}</span>
            </div>
            <div className="view-row">
              <strong>Condition:</strong>
              <span>
                {conds.length
                  ? conds.map((c) => `${formatLValueView(c.lvalue)} ${c.rel} ${formatRValueView(c.rvalue)}`).join(' AND ')
                  : '-'}
              </span>
            </div>
            <div className="view-row">
              <strong>Effect:</strong>
              <span>
                {effs.length
                  ? effs.map((e) => `${formatLValueView(e.lvalue)} ${e.rel} ${formatRValueView(e.rvalue)}`).join(', ')
                  : '-'}
              </span>
            </div>
          </div>
        );
      }

      case 'Condition': {
        // 연산자 정의 템플릿
        if (item.lvalue == null && item.rvalue == null) {
          return (
            <div className="view-content">
              <div className="view-row"><strong>Label:</strong> <span>{item.label || '-'}</span></div>
              <div className="view-row"><strong>Rel:</strong> <span>{item.rel || '-'}</span></div>
            </div>
          );
        }

        return (
          <div className="view-content">
            <div className="view-row"><strong>Rel:</strong> <span>{item.rel}</span></div>
            <div className="view-row"><strong>LValue:</strong> <span>{formatLValueView(item.lvalue)}</span></div>
            <div className="view-row"><strong>RValue:</strong> <span>{formatRValueView(item.rvalue)}</span></div>
          </div>
        );
      }

      case 'Goal': {
        const c = item.condition;
        return (
          <div className="view-content">
            <div className="view-row"><strong>Owner:</strong> <span>{item.owner}</span></div>
            <div className="view-row"><strong>Name:</strong> <span>{item.name}</span></div>
            <div className="view-row">
              <strong>Condition:</strong>{' '}
              <span>
                {c ? `${formatLValueView(c.lvalue)} ${c.rel} ${formatRValueView(c.rvalue)}` : '-'}
              </span>
            </div>
            <div className="view-row"><strong>Ending:</strong> <p>{item.endingDescription}</p></div>
          </div>
        );
      }

      case 'Content':
        return (
          <div className="view-content">
            {commonRows}
            <div className="view-row">
              <strong>Characters:</strong> <span>{item.characters ? item.characters.join(', ') : '-'}</span>
            </div>
          </div>
        );

      default:
        return <p>Unknown type data.</p>;
    }
  };

  const renderFields = () => {
    const ownerField = (
      <div className="form-group">
        <label>Owner (Object Name):</label>
        <input
          name="owner"
          value={formData.owner || ''}
          onChange={handleChange}
          placeholder="예: 백설공주, 곰, Scene"
        />
      </div>
    );

    switch (item.type) {
      case 'Object': {
        const st = Array.isArray(formData.state) ? formData.state : [];
        return (
          <>
            {ownerField}
            <div className="form-group"><label>Name:</label><input name="name" value={formData.name || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Description:</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} /></div>

            <div className="form-group">
              <label>State:</label>
              {st.map((row, idx) => {
                const tv = normalizeTypedValue(row?.currentValue);
                return (
                  <div key={`st-${idx}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      style={{ flex: 2 }}
                      value={row?.ref || ''}
                      onChange={(e) => handleStateRowChange(idx, 'ref', e.target.value)}
                      placeholder="stateRef (예: st-loc)"
                    />
                    <select
                      style={{ flex: 1 }}
                      value={tv.kind || 'literal'}
                      onChange={(e) => handleStateRowChange(idx, 'kind', e.target.value)}
                    >
                      <option value="object">object</option>
                      <option value="bool">bool</option>
                      <option value="literal">literal</option>
                    </select>
                    <input
                      style={{ flex: 3 }}
                      value={stringifyTypedValue(tv)}
                      onChange={(e) => handleStateRowChange(idx, 'value', e.target.value)}
                      placeholder="value (예: obj-forest / true / 친구)"
                    />
                    <button type="button" onClick={() => removeStateRow(idx)}>−</button>
                  </div>
                );
              })}
              <button type="button" onClick={addStateRow}>+ Add state</button>
            </div>
          </>
        );
      }

      case 'State': {
        const vals = Array.isArray(formData.values) ? formData.values : [];
        return (
          <>
            {ownerField}
            <div className="form-group"><label>Name:</label><input name="name" value={formData.name || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Description:</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} /></div>

            <div className="form-group">
              <label>Values:</label>
              {vals.map((v, idx) => {
                const tv = normalizeTypedValue(v);
                return (
                  <div key={`val-${idx}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select
                      style={{ flex: 1 }}
                      value={tv.kind || 'literal'}
                      onChange={(e) => handleStateValuesChange(idx, 'kind', e.target.value)}
                    >
                      <option value="object">object</option>
                      <option value="bool">bool</option>
                      <option value="literal">literal</option>
                    </select>
                    <input
                      style={{ flex: 3 }}
                      value={stringifyTypedValue(tv)}
                      onChange={(e) => handleStateValuesChange(idx, 'value', e.target.value)}
                      placeholder="value"
                    />
                    <button type="button" onClick={() => removeStateValue(idx)}>−</button>
                  </div>
                );
              })}
              <button type="button" onClick={addStateValue}>+ Add value</button>
            </div>
          </>
        );
      }

      case 'Action': {
        const conds = Array.isArray(formData.condition) ? formData.condition : [];
        const effs = Array.isArray(formData.effect) ? formData.effect : [];
        return (
          <>
            {ownerField}
            <div className="form-group"><label>Action Name:</label><input name="contentName" value={formData.contentName || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Description:</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} /></div>

            <div className="form-group">
              <label>Actor / Target (ref는 실행 시 바인딩):</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ flex: 1 }}
                  value={formData.actor?.ref ?? ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, actor: { ...(p.actor || {}), type: 'Object', ref: e.target.value || null } }))
                  }
                  placeholder="actor.ref (예: obj-snow) — 보통 비워둠"
                />
                <input
                  style={{ flex: 1 }}
                  value={formData.target?.ref ?? ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, target: { ...(p.target || {}), type: 'Object', ref: e.target.value || null } }))
                  }
                  placeholder="target.ref (예: obj-hut) — 보통 비워둠"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Condition:</label>
              {conds.map((c, idx) => {
                const lv = normalizeLValue(c.lvalue);
                const rv = normalizeRValue(c.rvalue);
                const rvKind = String(rv.kind || 'literal').toLowerCase();

                return (
                  <div key={`cond-${idx}`} style={{ border: '1px solid #eee', padding: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select
                        value={c.rel || 'equals'}
                        onChange={(e) => handleConditionChange(idx, 'rel', e.target.value)}
                      >
                        <option value="equals">equals</option>
                        <option value="not_equals">not_equals</option>
                        <option value="greater">greater</option>
                        <option value="smaller">smaller</option>
                        <option value="contains">contains</option>
                        <option value="has">has</option>
                        <option value="is">is</option>
                        <option value="exist">exist</option>
                        <option value="not_exist">not_exist</option>
                      </select>

                      <button type="button" onClick={() => removeConditionRow(idx)}>Remove</button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select
                        style={{ flex: 1 }}
                        value={lv.objectRef}
                        onChange={(e) => handleConditionChange(idx, 'lvalue.objectRef', e.target.value)}
                      >
                        <option value="actor">actor</option>
                        <option value="target">target</option>
                      </select>
                      <input
                        style={{ flex: 2 }}
                        value={lv.stateRef}
                        onChange={(e) => handleConditionChange(idx, 'lvalue.stateRef', e.target.value)}
                        placeholder="lvalue.stateRef (예: st-loc)"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        style={{ flex: 1 }}
                        value={rvKind}
                        onChange={(e) => handleConditionChange(idx, 'rvalue.kind', e.target.value)}
                      >
                        <option value="literal">literal</option>
                        <option value="bool">bool</option>
                        <option value="object">object</option>
                        <option value="state">state</option>
                      </select>

                      {rvKind === 'state' ? (
                        <>
                          <select
                            style={{ flex: 1 }}
                            value={rv.objectRef || 'target'}
                            onChange={(e) => handleConditionChange(idx, 'rvalue.objectRef', e.target.value)}
                          >
                            <option value="actor">actor</option>
                            <option value="target">target</option>
                          </select>
                          <input
                            style={{ flex: 2 }}
                            value={rv.stateRef || ''}
                            onChange={(e) => handleConditionChange(idx, 'rvalue.stateRef', e.target.value)}
                            placeholder="rvalue.stateRef (예: st-loc)"
                          />
                        </>
                      ) : (
                        <input
                          style={{ flex: 3 }}
                          value={rv.value ?? ''}
                          onChange={(e) => handleConditionChange(idx, 'rvalue.value', e.target.value)}
                          placeholder="rvalue.value"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={addConditionRow}>+ Add condition</button>
            </div>

            <div className="form-group">
              <label>Effect:</label>
              {effs.map((ef, idx) => {
                const lv = normalizeLValue(ef.lvalue);
                const rv = normalizeRValue(ef.rvalue);
                const rvKind = String(rv.kind || 'literal').toLowerCase();

                return (
                  <div key={`eff-${idx}`} style={{ border: '1px solid #eee', padding: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select
                        value={ef.rel || 'set'}
                        onChange={(e) => handleEffectChange(idx, 'rel', e.target.value)}
                      >
                        <option value="set">set</option>
                      </select>
                      <button type="button" onClick={() => removeEffectRow(idx)}>Remove</button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select
                        style={{ flex: 1 }}
                        value={lv.objectRef}
                        onChange={(e) => handleEffectChange(idx, 'lvalue.objectRef', e.target.value)}
                      >
                        <option value="actor">actor</option>
                        <option value="target">target</option>
                      </select>
                      <input
                        style={{ flex: 2 }}
                        value={lv.stateRef}
                        onChange={(e) => handleEffectChange(idx, 'lvalue.stateRef', e.target.value)}
                        placeholder="lvalue.stateRef (예: st-loc)"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        style={{ flex: 1 }}
                        value={rvKind}
                        onChange={(e) => handleEffectChange(idx, 'rvalue.kind', e.target.value)}
                      >
                        <option value="literal">literal</option>
                        <option value="bool">bool</option>
                        <option value="object">object</option>
                        <option value="state">state</option>
                      </select>

                      {rvKind === 'state' ? (
                        <>
                          <select
                            style={{ flex: 1 }}
                            value={rv.objectRef || 'target'}
                            onChange={(e) => handleEffectChange(idx, 'rvalue.objectRef', e.target.value)}
                          >
                            <option value="actor">actor</option>
                            <option value="target">target</option>
                          </select>
                          <input
                            style={{ flex: 2 }}
                            value={rv.stateRef || ''}
                            onChange={(e) => handleEffectChange(idx, 'rvalue.stateRef', e.target.value)}
                            placeholder="rvalue.stateRef (예: st-rel)"
                          />
                        </>
                      ) : (
                        <input
                          style={{ flex: 3 }}
                          value={rv.value ?? ''}
                          onChange={(e) => handleEffectChange(idx, 'rvalue.value', e.target.value)}
                          placeholder="rvalue.value"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={addEffectRow}>+ Add effect</button>
            </div>
          </>
        );
      }

      case 'Goal': {
        const c = formData.condition || {};
        const lv = normalizeLValue(c.lvalue);
        const rv = normalizeRValue(c.rvalue);
        const rvKind = String(rv.kind || 'literal').toLowerCase();

        return (
          <>
            {ownerField}
            <div className="form-group"><label>Name:</label><input name="name" value={formData.name || ''} onChange={handleChange} /></div>

            <div className="form-group">
              <label>Condition:</label>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select
                  value={c.rel || 'equals'}
                  onChange={(e) => setFormData((p) => ({
                    ...p,
                    condition: { ...(p.condition || {}), rel: e.target.value }
                  }))}
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not_equals</option>
                  <option value="greater">greater</option>
                  <option value="smaller">smaller</option>
                  <option value="contains">contains</option>
                  <option value="has">has</option>
                  <option value="is">is</option>
                  <option value="exist">exist</option>
                  <option value="not_exist">not_exist</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select
                  style={{ flex: 1 }}
                  value={lv.objectRef}
                  onChange={(e) => setFormData((p) => ({
                    ...p,
                    condition: { ...(p.condition || {}), lvalue: { ...lv, objectRef: e.target.value } }
                  }))}
                >
                  <option value="actor">actor</option>
                  <option value="target">target</option>
                </select>
                <input
                  style={{ flex: 2 }}
                  value={lv.stateRef}
                  onChange={(e) => setFormData((p) => ({
                    ...p,
                    condition: { ...(p.condition || {}), lvalue: { ...lv, stateRef: e.target.value } }
                  }))}
                  placeholder="lvalue.stateRef"
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  style={{ flex: 1 }}
                  value={rvKind}
                  onChange={(e) => {
                    const newKind = e.target.value;
                    setFormData((p) => ({
                      ...p,
                      condition: {
                        ...(p.condition || {}),
                        rvalue: String(newKind).toLowerCase() === 'state'
                          ? { kind: 'state', objectRef: 'target', stateRef: '' }
                          : { kind: newKind, value: '' }
                      }
                    }));
                  }}
                >
                  <option value="literal">literal</option>
                  <option value="bool">bool</option>
                  <option value="object">object</option>
                  <option value="state">state</option>
                </select>

                {rvKind === 'state' ? (
                  <>
                    <select
                      style={{ flex: 1 }}
                      value={rv.objectRef || 'target'}
                      onChange={(e) => setFormData((p) => ({
                        ...p,
                        condition: { ...(p.condition || {}), rvalue: { ...normalizeRValue(p.condition?.rvalue), objectRef: e.target.value } }
                      }))}
                    >
                      <option value="actor">actor</option>
                      <option value="target">target</option>
                    </select>
                    <input
                      style={{ flex: 2 }}
                      value={rv.stateRef || ''}
                      onChange={(e) => setFormData((p) => ({
                        ...p,
                        condition: { ...(p.condition || {}), rvalue: { ...normalizeRValue(p.condition?.rvalue), stateRef: e.target.value } }
                      }))}
                      placeholder="rvalue.stateRef"
                    />
                  </>
                ) : (
                  <input
                    style={{ flex: 3 }}
                    value={rv.value ?? ''}
                    onChange={(e) => setFormData((p) => ({
                      ...p,
                      condition: { ...(p.condition || {}), rvalue: { ...normalizeRValue(p.condition?.rvalue), value: e.target.value } }
                    }))}
                    placeholder="rvalue.value"
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Ending Description:</label>
              <textarea name="endingDescription" value={formData.endingDescription || ''} onChange={handleChange} rows={3} />
            </div>
          </>
        );
      }

      case 'Content':
        return (
          <>
            {ownerField}
            <div className="form-group"><label>Name:</label><input name="name" value={formData.name || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Description:</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} /></div>
            <div className="form-group"><label>Characters (comma separated):</label><input name="characters" value={formData.characters ? formData.characters.join(', ') : ''} onChange={(e) => setFormData((p) => ({ ...p, characters: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} /></div>
          </>
        );

      // Condition 단독 편집도 필요하면 여기 추가 가능
      default:
        return <p>Unknown type data.</p>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}
        >
          <h3 style={{ margin: 0 }}>{isEditing ? `Edit ${item.type}` : `${item.type} Properties`}</h3>
          {!isEditing && (
            <span
              onClick={() => setIsEditing(true)}
              style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#666' }}
              title="Edit"
            >
              <PencilIcon />
            </span>
          )}
        </div>

        {isEditing ? renderFields() : renderView()}

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button onClick={onClose}>{isEditing ? 'Cancel' : 'Close'}</button>
          {isEditing && (
            <button onClick={handleSave} className="primary-btn">
              Save
            </button>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .view-row {
          margin-bottom: 8px;
          font-size: 13px;
        }
        .view-row strong {
          display: inline-block;
          width: 100px;
          color: #555;
          vertical-align: top;
        }
        .view-row span,
        .view-row p {
          display: inline-block;
          margin: 0;
          color: #000;
          max-width: calc(100% - 110px);
        }
        .view-row p {
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default ComponentEditor;
