// src/components/blocks/LinkHandle.js
import React, { useMemo } from 'react';
import { LinkIcon, InPortIcon, OutPortIcon } from '../Icons';

const LinkHandle = ({ active, selectable, dim, title, direction = null, onMouseDown }) => {
  const dir = useMemo(() => {
    if (direction === 'in' || direction === 'out') return direction;
    if (typeof title !== 'string') return null;

    if (title.startsWith('in:')) return 'in';
    if (title === 'out' || title.startsWith('out:')) return 'out';

    return null;
  }, [direction, title]);

  const className = [
    'link-handle',
    active ? 'active' : '',
    selectable ? 'selectable' : '',
    dim ? 'dim' : '',
    dir ? `dir-${dir}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={className} title={title} onMouseDown={onMouseDown}>
      {dir === 'in' ? <InPortIcon /> : dir === 'out' ? <OutPortIcon /> : <LinkIcon />}
    </span>
  );
};

export default LinkHandle;