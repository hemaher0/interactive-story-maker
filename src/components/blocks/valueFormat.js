export const isTypedValue = (v) =>
  v && typeof v === 'object' && typeof v.kind === 'string' && Object.prototype.hasOwnProperty.call(v, 'value');

export const formatTypedValue = (v, { getObjectName } = {}) => {
  if (v === null || v === undefined) return '?';

  // typed value
  if (isTypedValue(v)) {
    const kind = String(v.kind).toLowerCase();
    const value = v.value;

    if (kind === 'bool') return value ? 'true' : 'false';
    if (kind === 'object') return typeof getObjectName === 'function' ? getObjectName(value) : String(value ?? '?');
    // literal/string
    return String(value ?? '?');
  }

  // primitive
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;

  // 다른 객체는 렌더링 금지
  return JSON.stringify(v);
};
