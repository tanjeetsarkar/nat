// src/components/NoteBlockList.jsx
import { useState } from 'react';
import NoteBlock from './NoteBlock';

function NoteBlockList({ blocks, appId, onUpdate }) {
  const [sortedBlocks, setSortedBlocks] = useState([...blocks].sort((a, b) => (a.order || 0) - (b.order || 0)));
  const [draggedBlock, setDraggedBlock] = useState(null);

  // Update sorted blocks when blocks prop changes
  useState(() => {
    setSortedBlocks([...blocks].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, [blocks]);

  const handleDragStart = (e, block) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetBlock) => {
    e.preventDefault();
    
    if (!draggedBlock || draggedBlock.id === targetBlock.id) return;

    const newBlocks = [...sortedBlocks];
    const draggedIndex = newBlocks.findIndex(b => b.id === draggedBlock.id);
    const targetIndex = newBlocks.findIndex(b => b.id === targetBlock.id);

    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);

    setSortedBlocks(newBlocks);
    setDraggedBlock(null);

    // Update order on backend
    // Note: You'll need to add an order field to NoteBlock model and update mutation
    onUpdate();
  };

  return (
    <div style={styles.container}>
      {sortedBlocks.length === 0 ? (
        <div style={styles.empty}>
          No blocks yet. Create one to start organizing your notes!
        </div>
      ) : (
        sortedBlocks.map(block => (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(e, block)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, block)}
            style={styles.blockWrapper}
          >
            <NoteBlock 
              block={block} 
              onUpdate={onUpdate}
            />
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  blockWrapper: {
    cursor: 'move',
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '16px',
    color: '#666',
    border: '2px dashed #ccc',
  },
};

export default NoteBlockList;