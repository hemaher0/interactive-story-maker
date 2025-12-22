import React from 'react';
import './Scene.css';

const Scene = ({ height, imageUrl }) => {
  return (
    <div className="scene-container" style={{ height: height }}>
      <div className="scene-header">
        <h2>Scene (Stage)</h2>
      </div>
      <div className="scene-content">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Generated Scene" 
            className="scene-image" 
          />
        ) : (
          <div className="scene-placeholder">
            <p>No scene generated yet.</p>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              Create logic in BlockCanvas and click "Visualize Scene"
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scene;