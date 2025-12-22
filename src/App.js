// src/App.js
import React, { useState, useCallback, useEffect } from 'react';
import Scene from './components/Scene';
import Hierarchy from './components/Hierarchy';
import BlockCanvas from './components/BlockCanvas';
import { INITIAL_FILES } from './data/initialData';
import './App.css';

function App() {
  const [leftWidth, setLeftWidth] = useState(300);
  const [sceneHeight, setSceneHeight] = useState(300);

  const [files, setFiles] = useState(INITIAL_FILES);
  const [sceneImage, setSceneImage] = useState(null);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const handleUpdateFile = (updatedFile) => {
    setFiles(prevFiles =>
      prevFiles.map(file => (file.id === updatedFile.id ? updatedFile : file))
    );
  };

  const handleMouseDownWidth = (e) => {
    e.preventDefault();
    setIsResizingWidth(true);
  };

  const handleMouseDownHeight = (e) => {
    e.preventDefault();
    setIsResizingHeight(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (isResizingWidth) {
      const newWidth = Math.max(200, Math.min(e.clientX, window.innerWidth - 300));
      setLeftWidth(newWidth);
    }
    if (isResizingHeight) {
      const newHeight = Math.max(150, Math.min(e.clientY, window.innerHeight - 150));
      setSceneHeight(newHeight);
    }
  }, [isResizingWidth, isResizingHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizingWidth(false);
    setIsResizingHeight(false);
  }, []);

  useEffect(() => {
    if (isResizingWidth || isResizingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingWidth, isResizingHeight, handleMouseMove, handleMouseUp]);

  return (
    <div className="app-container">
      <div className="left-column" style={{ width: leftWidth }}>
        <Scene height={sceneHeight} imageUrl={sceneImage} />
        <div
          className="resizer-horizontal"
          onMouseDown={handleMouseDownHeight}
        ></div>

        <Hierarchy files={files} setFiles={setFiles} onUpdateFile={handleUpdateFile} />
      </div>

      <div
        className="resizer-vertical"
        onMouseDown={handleMouseDownWidth}
      ></div>

      <div className="right-column">
        <BlockCanvas 
          files={files} 
          onSceneGenerated={setSceneImage} 
        />
      </div>
    </div>
  );
}

export default App;
