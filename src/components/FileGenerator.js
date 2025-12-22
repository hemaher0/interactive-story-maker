import React, { useState } from 'react';
import { FILE_TYPES, generateGameElement } from '../api/llmApi';
import './FileGenerator.css';

const FileGenerator = ({ isOpen, onClose, onGenerate }) => {
  const [selectedType, setSelectedType] = useState(FILE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateGameElement(selectedType, description);
      
      if (result.error) {
        alert(result.message);
        return;
      }

      if (result.isBundle) {
        // Object + State 세트가 반환된 경우 순차적으로 추가
        result.items.forEach(item => onGenerate(item));
        alert(`Object '${result.items[0].name}'와 초기 State가 생성되었습니다.`);
      } else {
        // 단일 아이템 반환
        onGenerate(result.item);
      }
      
      setDescription('');
      onClose();
    } catch (error) {
      console.error("Generation logic error", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create New Hierarchy Item (Gemini AI)</h3>
        <p className="modal-desc">
          {selectedType === 'Object' 
            ? "Object를 생성하면 AI가 적절한 초기 State를 자동으로 함께 만듭니다." 
            : "선택한 타입의 데이터를 생성합니다."}
        </p>
        <div className="form-group">
          <label>Type:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {FILE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Description (Prompt):</label>
          <textarea
            placeholder={selectedType === 'Object' ? "예: 숲속의 곰" : "예: 곰과 친구가 되는 조건"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} disabled={isLoading}>Cancel</button>
          <button onClick={handleGenerate} disabled={isLoading} className="primary-btn">
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileGenerator;