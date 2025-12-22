import React from 'react';
import './Icons.css';

export const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
  </svg>
);

export const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="currentColor"/>
  </svg>
);

export const ArrowIcon = ({ isOpen }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="12" 
    height="12" 
    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
  </svg>
);

export const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
  </svg>
);


export const InPortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    {/* 메인 박스: 우측 배치 */}
    <rect x="5" y="3" width="7" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* 진입 화살표: 왼쪽에서 박스 내부로 */}
    <path
      d="M1.5 7h5.5M4.5 4.5L7 7l-2.5 2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// OutPortIcon: 박스 중앙에서 오른쪽으로 나가는 화살표
export const OutPortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    {/* 메인 박스: 좌측 배치 */}
    <rect x="2" y="3" width="7" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* 진출 화살표: 박스 내부에서 오른쪽으로 */}
    <path
      d="M5.5 7h6M9 4.5L11.5 7 9 9.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);