// src/components/NoteBlock.jsx
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { 
  UPDATE_NOTE_BLOCK, 
  DELETE_NOTE_BLOCK, 
  CREATE_NOTE 
} from '../graphql/queries';
import NoteItem from './NoteItem';

function NoteBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [head, setHead] = useState(block.head);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [draggedNote, setDraggedNote] = useState(null);

  const [updateBlock] = useMutation(UPDATE_NOTE_BLOCK);
  const [deleteBlock] = useMutation(DELETE_NOTE_BLOCK);
  const [createNote] = useMutation(CREATE_NOTE);

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
    if (!window.confirm('Delete this block and all its notes?')) return;
    
    try {
      await deleteBlock({ variables: { id: block.id } });
      onUpdate();
    } catch (err) {
      console.error('Error deleting block:', err);
    }
  };

  const handleCreateNote = async () => {
    try {
      const maxOrder = block.notes?.reduce((max, note) => 
        Math.max(max, note.order || 0), 0) || 0;
      
      await createNote({
        variables: {
          input: {
            blockId: block.id,
            priority: 'medium',
            head: '',
            note: '',
            order: maxOrder + 1
          }
        }
      });
      setIsCreatingNote(false);
      onUpdate();
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const sortedNotes = [...(block.notes || [])].sort((a, b) => 
    (a.order || 0) - (b.order || 0)
  );

  const handleNoteDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNoteDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleNoteDrop = async (e, targetNote) => {
    e.preventDefault();
    
    if (!draggedNote || draggedNote.id === targetNote.id) return;

    // This will be handled by reordering logic
    setDraggedNote(null);
    onUpdate();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {isEditing ? (
          <div style={styles.editForm}>
            <input
              type="text"
              value={head}
              onChange={(e) => setHead(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <button onClick={handleUpdate} style={styles.saveButton}>
              Save
            </button>
            <button 
              onClick={() => {
                setHead(block.head);
                setIsEditing(false);
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={styles.headerContent}>
            <h3 
              style={styles.title}
              onClick={() => setIsEditing(true)}
            >
              {block.head} ✎
            </h3>
            <div style={styles.headerActions}>
              <button 
                onClick={() => setIsCreatingNote(true)}
                style={styles.addButton}
              >
                + Add Note
              </button>
              <button onClick={handleDelete} style={styles.deleteButton}>
                Delete Block
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.notesContainer}>
        {sortedNotes.map(note => (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => handleNoteDragStart(e, note)}
            onDragOver={handleNoteDragOver}
            onDrop={(e) => handleNoteDrop(e, note)}
          >
            <NoteItem 
              note={note} 
              onUpdate={onUpdate}
            />
          </div>
        ))}

        {isCreatingNote && (
          <div style={styles.createNoteForm}>
            <p>Create new note?</p>
            <button onClick={handleCreateNote} style={styles.confirmButton}>
              Yes, Create
            </button>
            <button 
              onClick={() => setIsCreatingNote(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        )}

        {sortedNotes.length === 0 && !isCreatingNote && (
          <div style={styles.emptyNotes}>
            No notes in this block yet.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    border: '2px solid #000',
    padding: '20px',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: '20px',
    borderBottom: '1px solid #000',
    paddingBottom: '15px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    cursor: 'pointer',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '12px',
  },
  editForm: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #000',
    outline: 'none',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '12px',
  },
  notesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  createNoteForm: {
    padding: '15px',
    border: '1px dashed #000',
    textAlign: 'center',
  },
  confirmButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '10px',
  },
  emptyNotes: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
};

export default NoteBlock;