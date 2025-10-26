// src/components/NoteModal.jsx
import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_NOTE } from '../graphql/queries';

function NoteModal({ note, blockId, onSave, onClose, onUpdate }) {
  const [priority, setPriority] = useState(note?.priority || 'medium');
  const [head, setHead] = useState(note?.head || '');
  const [noteText, setNoteText] = useState(note?.note || '');

  const [updateNote] = useMutation(UPDATE_NOTE);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSave = async () => {
    if (note) {
      // Update existing note
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
        onUpdate();
        onClose();
      } catch (err) {
        console.error('Error updating note:', err);
      }
    } else {
      // Create new note
      onSave({
        priority,
        head,
        note: noteText,
      });
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{note ? 'Edit Card' : 'Create Card'}</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Priority</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              style={styles.select}
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={head}
              onChange={(e) => setHead(e.target.value)}
              placeholder="Enter card title"
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter card description"
              style={styles.textarea}
              rows={6}
            />
          </div>

          {note && (
            <div style={styles.metadata}>
              <div style={styles.metadataItem}>
                <span style={styles.metadataLabel}>Created:</span>
                <span style={styles.metadataValue}>
                  {new Date(note.metadata.created).toLocaleString()}
                </span>
              </div>
              <div style={styles.metadataItem}>
                <span style={styles.metadataLabel}>Updated:</span>
                <span style={styles.metadataValue}>
                  {new Date(note.metadata.updated).toLocaleString()}
                </span>
              </div>
              {note.metadata.completed && (
                <div style={styles.metadataItem}>
                  <span style={styles.completedBadge}>✓ Completed</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={handleSave} style={styles.saveButton}>
            {note ? 'Save Changes' : 'Create Card'}
          </button>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    color: '#666',
  },
  body: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
    color: '#555',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  metadata: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  metadataItem: {
    marginBottom: '8px',
    fontSize: '12px',
  },
  metadataLabel: {
    fontWeight: '600',
    color: '#666',
    marginRight: '8px',
  },
  metadataValue: {
    color: '#333',
  },
  completedBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#28a745',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #ddd',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default NoteModal;