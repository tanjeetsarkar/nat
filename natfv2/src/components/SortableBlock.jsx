// src/components/SortableBlock.jsx
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  UPDATE_NOTE_BLOCK, 
  DELETE_NOTE_BLOCK, 
  CREATE_NOTE 
} from '../graphql/queries';
import SortableNote from './SortableNote';
import NoteModal from './NoteModal';

function SortableBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [head, setHead] = useState(block.head);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `block-${block.id}` });

  const [updateBlock] = useMutation(UPDATE_NOTE_BLOCK);
  const [deleteBlock] = useMutation(DELETE_NOTE_BLOCK);
  const [createNote] = useMutation(CREATE_NOTE);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = async () => {
    try {
      await updateBlock({
        variables: {
          id: block.id,
          input: { head }
        }
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Error updating block:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this list and all its cards?')) return;
    
    try {
      await deleteBlock({ variables: { id: block.id } });
      onUpdate();
    } catch (err) {
      console.error('Error deleting block:', err);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      await createNote({
        variables: {
          input: {
            blockId: block.id,
            priority: noteData.priority,
            head: noteData.head,
            note: noteData.note
          }
        }
      });
      setShowNoteModal(false);
      onUpdate();
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleNoteClick = (note) => {
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const sortedNotes = [...(block.notes || [])].sort((a, b) => 
    (a.order || 0) - (b.order || 0)
  );

  return (
    <>
      <div ref={setNodeRef} style={{ ...styles.container, ...style }}>
        {/* Block Header - Only drag handle has drag listeners */}
        <div style={styles.header}>
          {isEditing ? (
            <div style={styles.editForm}>
              <input
                type="text"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                style={styles.input}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
              />
              <button onClick={handleUpdate} style={styles.saveButton}>✓</button>
              <button onClick={() => {
                setHead(block.head);
                setIsEditing(false);
              }} style={styles.cancelButton}>×</button>
            </div>
          ) : (
            <div style={styles.headerContent}>
              {/* Drag handle - only this triggers dragging */}
              <div {...attributes} {...listeners} style={styles.dragHandle}>
                ⋮⋮
              </div>
              
              <h3 
                style={styles.title}
                onClick={() => setIsEditing(true)}
              >
                {block.head}
              </h3>
              
              <button 
                onClick={handleDelete} 
                style={styles.deleteButton}
              >
                ⋯
              </button>
            </div>
          )}
        </div>

        {/* Notes List */}
        <div style={styles.notesContainer}>
          <SortableContext
            items={sortedNotes.map(n => `note-${n.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {sortedNotes.map(note => (
              <SortableNote
                key={note.id}
                note={note}
                blockId={block.id}
                onUpdate={onUpdate}
                onClick={() => handleNoteClick(note)}
              />
            ))}
          </SortableContext>

          {/* Add Card Button */}
          <button 
            onClick={() => {
              setEditingNote(null);
              setShowNoteModal(true);
            }}
            style={styles.addCardButton}
          >
            + Add a card
          </button>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal
          note={editingNote}
          blockId={block.id}
          onSave={handleCreateNote}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

const styles = {
  container: {
    width: '280px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    maxHeight: 'calc(100vh - 180px)',
  },
  header: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dragHandle: {
    cursor: 'grab',
    fontSize: '16px',
    color: '#999',
    userSelect: 'none',
    padding: '4px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    flex: 1,
    cursor: 'pointer',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },
  editForm: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '6px 8px',
    fontSize: '14px',
    border: '1px solid #000',
    outline: 'none',
    borderRadius: '4px',
  },
  saveButton: {
    padding: '6px 10px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
  },
  cancelButton: {
    padding: '6px 10px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
  },
  notesContainer: {
    padding: '8px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  addCardButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'transparent',
    color: '#666',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    borderRadius: '4px',
  },
};

export default SortableBlock;