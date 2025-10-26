// src/components/NoteItem.jsx
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_NOTE, DELETE_NOTE } from '../graphql/queries';

function NoteItem({ note, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [priority, setPriority] = useState(note.priority);
  const [head, setHead] = useState(note.head || '');
  const [noteText, setNoteText] = useState(note.note || '');

  const [updateNote] = useMutation(UPDATE_NOTE);
  const [deleteNote] = useMutation(DELETE_NOTE);

  const handleUpdate = async () => {
    try {
      await updateNote({
        variables: {
          id: note.id,
          input: {
            priority,
            head,
            note: noteText,
          }
        }
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Error updating note:', err);
    }
  };

  const handleToggleComplete = async () => {
    try {
      await updateNote({
        variables: {
          id: note.id,
          input: {
            completed: !note.metadata.completed
          }
        }
      });
      onUpdate();
    } catch (err) {
      console.error('Error toggling complete:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return;
    
    try {
      await deleteNote({ variables: { id: note.id } });
      onUpdate();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#000';
      case 'medium': return '#666';
      case 'low': return '#999';
      default: return '#666';
    }
  };

  if (isEditing) {
    return (
      <div style={styles.editContainer}>
        <div style={styles.editField}>
          <label style={styles.label}>Priority:</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            style={styles.select}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div style={styles.editField}>
          <label style={styles.label}>Title:</label>
          <input
            type="text"
            value={head}
            onChange={(e) => setHead(e.target.value)}
            placeholder="Note title"
            style={styles.input}
          />
        </div>

        <div style={styles.editField}>
          <label style={styles.label}>Description:</label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Note details"
            style={styles.textarea}
            rows={4}
          />
        </div>

        <div style={styles.editActions}>
          <button onClick={handleUpdate} style={styles.saveButton}>
            Save
          </button>
          <button 
            onClick={() => {
              setPriority(note.priority);
              setHead(note.head || '');
              setNoteText(note.note || '');
              setIsEditing(false);
            }}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        ...styles.container,
        opacity: note.metadata.completed ? 0.5 : 1,
      }}
    >
      <div style={styles.content}>
        <div style={styles.leftSection}>
          <input
            type="checkbox"
            checked={note.metadata.completed || false}
            onChange={handleToggleComplete}
            style={styles.checkbox}
          />
          
          <div style={styles.noteInfo}>
            <div style={styles.topRow}>
              <span 
                style={{
                  ...styles.priority,
                  backgroundColor: getPriorityColor(priority),
                }}
              >
                {priority}
              </span>
              {head && (
                <span style={{
                  ...styles.head,
                  textDecoration: note.metadata.completed ? 'line-through' : 'none',
                }}>
                  {head}
                </span>
              )}
            </div>
            {noteText && (
              <p style={{
                ...styles.noteText,
                textDecoration: note.metadata.completed ? 'line-through' : 'none',
              }}>
                {noteText}
              </p>
            )}
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={() => setIsEditing(true)} style={styles.editButton}>
            Edit
          </button>
          <button onClick={handleDelete} style={styles.deleteButton}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    border: '1px solid #000',
    padding: '15px',
    backgroundColor: '#fff',
    cursor: 'move',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    display: 'flex',
    gap: '15px',
    flex: 1,
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    marginTop: '2px',
  },
  noteInfo: {
    flex: 1,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '5px',
  },
  priority: {
    fontSize: '10px',
    color: '#fff',
    padding: '3px 8px',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  head: {
    fontSize: '14px',
    fontWeight: '600',
  },
  noteText: {
    fontSize: '13px',
    margin: '5px 0 0 0',
    color: '#333',
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '11px',
  },
  editContainer: {
    border: '2px solid #000',
    padding: '20px',
    backgroundColor: '#f9f9f9',
  },
  editField: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '5px',
  },
  select: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #000',
    backgroundColor: '#fff',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #000',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #000',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  editActions: {
    display: 'flex',
    gap: '10px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default NoteItem;