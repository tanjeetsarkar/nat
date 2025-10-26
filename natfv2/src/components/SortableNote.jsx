// src/components/SortableNote.jsx
import { useMutation } from '@apollo/client/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UPDATE_NOTE, DELETE_NOTE } from '../graphql/queries';

function SortableNote({ note, blockId, onUpdate, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `note-${note.id}`,
    data: { blockId }
  });

  const [updateNote] = useMutation(UPDATE_NOTE);
  const [deleteNote] = useMutation(DELETE_NOTE);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleComplete = async (e) => {
    e.stopPropagation();
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

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this card?')) return;
    
    try {
      await deleteNote({ variables: { id: note.id } });
      onUpdate();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const getCardStyle = (priority, completed) => {
    if (completed) {
      return {
        backgroundColor: '#d4edda',
        borderColor: '#28a745',
      };
    }
    
    switch (priority) {
      case 'high':
        return {
          backgroundColor: '#ffe0e0',
          borderColor: '#ff4444',
        };
      case 'medium':
        return {
          backgroundColor: '#fff8dc',
          borderColor: '#ffcc00',
        };
      case 'low':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#ddd',
        };
      default:
        return {
          backgroundColor: '#ffffff',
          borderColor: '#ddd',
        };
    }
  };

  const getPriorityBadgeStyle = (priority, completed) => {
    if (completed) {
      return {
        backgroundColor: '#28a745',
        color: '#fff',
      };
    }
    
    switch (priority) {
      case 'high':
        return {
          backgroundColor: '#ff4444',
          color: '#fff',
        };
      case 'medium':
        return {
          backgroundColor: '#ffcc00',
          color: '#000',
        };
      case 'low':
        return {
          backgroundColor: '#fff',
          color: '#666',
          border: '1px solid #ddd',
        };
      default:
        return {
          backgroundColor: '#ddd',
          color: '#666',
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const cardStyle = getCardStyle(note.priority, note.metadata.completed);
  const badgeStyle = getPriorityBadgeStyle(note.priority, note.metadata.completed);

  return (
    <div 
      ref={setNodeRef}
      style={{ 
        ...styles.container, 
        ...style,
        ...cardStyle,
      }}
    >
      {/* Drag handle - only this area triggers dragging */}
      <div {...attributes} {...listeners} style={styles.dragHandle}>
        ⋮⋮
      </div>

      {/* Card content - clicking here opens modal */}
      <div style={styles.content} onClick={onClick}>
        <div style={styles.topRow}>
          <input
            type="checkbox"
            checked={note.metadata.completed || false}
            onChange={handleToggleComplete}
            onClick={(e) => e.stopPropagation()}
            style={styles.checkbox}
          />
          
          <span 
            style={{
              ...styles.priority,
              ...badgeStyle,
            }}
          >
            {note.metadata.completed ? 'Done' : note.priority}
          </span>

          <button 
            onClick={handleDelete}
            style={styles.deleteButton}
          >
            ×
          </button>
        </div>

        {note.head && (
          <div style={{
            ...styles.head,
            textDecoration: note.metadata.completed ? 'line-through' : 'none',
          }}>
            {note.head}
          </div>
        )}

        {note.note && (
          <p style={{
            ...styles.noteText,
            textDecoration: note.metadata.completed ? 'line-through' : 'none',
          }}>
            {note.note}
          </p>
        )}

        {!note.head && !note.note && (
          <div style={styles.emptyText}>Click to edit card</div>
        )}

        {/* Timestamps */}
        <div style={styles.timestamps}>
          <span style={styles.timestamp} title={`Created: ${new Date(note.metadata.created).toLocaleString()}`}>
            📅 {formatDate(note.metadata.created)}
          </span>
          {note.metadata.updated !== note.metadata.created && (
            <span style={styles.timestamp} title={`Updated: ${new Date(note.metadata.updated).toLocaleString()}`}>
              ✏️ {formatDate(note.metadata.updated)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    border: '1px solid',
    borderRadius: '6px',
    transition: 'all 0.2s',
    display: 'flex',
    position: 'relative',
  },
  dragHandle: {
    position: 'absolute',
    left: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'grab',
    fontSize: '12px',
    color: '#ccc',
    userSelect: 'none',
    padding: '4px',
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: '12px 12px 12px 24px',
    cursor: 'pointer',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  priority: {
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    color: '#666',
  },
  head: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '6px',
    wordBreak: 'break-word',
  },
  noteText: {
    fontSize: '13px',
    margin: '0 0 8px 0',
    color: '#555',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  emptyText: {
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: '8px',
  },
  timestamps: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },
  timestamp: {
    fontSize: '10px',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};

export default SortableNote;