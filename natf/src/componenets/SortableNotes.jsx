import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const SortableNotes = ({ note, dataManager, block, editNote }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const getPriorityBorder = (priority) => {
        switch (priority) {
            case 'high': return '#e57373';
            case 'medium': return '#ffb74d';
            case 'low': return '#81c784';
            default: return '#ccc';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ffebee';
            case 'medium': return '#fff3e0';
            case 'low': return '#e8f5e8';
            default: return '#f5f5f5';
        }
    };

    const handleCheckboxChange = async (e) => {
        e.stopPropagation();
        try {
            await dataManager.updateNote(block.id, note.id, {
                priority: note.priority,
                head: note.head,
                note: note.note,
                completed: e.target.checked
            });
        } catch (error) {
            console.error('Error updating note completion:', error);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await dataManager.deleteNote(block.id, note.id);
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                border: `1px solid ${getPriorityBorder(note.priority)}`,
                margin: '8px 0',
                padding: '10px',
                backgroundColor: note.metadata.completed ? '#f0f8f0' : getPriorityColor(note.priority),
                cursor: 'pointer',
                boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onClick={() => editNote(note)}
        >
            <div
                {...attributes}
                {...listeners}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                    cursor: 'grab',
                    touchAction: 'none',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                }}>
                    <input
                        type="checkbox"
                        checked={note.metadata.completed || false}
                        onChange={handleCheckboxChange}
                        style={{ marginRight: '8px' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            textDecoration: note.metadata.completed ? 'line-through' : 'none',
                            marginBottom: '2px'
                        }}>
                            {note.head}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#666',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                        }}>
                            {note.priority}
                        </div>
                    </div>
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: '2px 6px',
                            border: '1px solid #666',
                            backgroundColor: '#ffeeee',
                            cursor: 'pointer',
                            fontSize: '10px'
                        }}
                    >
                        Del
                    </button>
                </div>

                {note.note && (
                    <div style={{
                        fontSize: '12px',
                        color: '#555',
                        marginBottom: '6px',
                        lineHeight: '1.3',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: note.metadata.completed ? 'line-through' : 'none'
                    }}>
                        {note.note}
                    </div>
                )}

                <div style={{ fontSize: '10px', color: '#888' }}>
                    Created: {new Date(note.metadata.created).toLocaleString()}
                    {note.metadata.updated !== note.metadata.created && (
                        <><br />Updated: {new Date(note.metadata.updated).toLocaleString()}</>
                    )}
                </div>
            </div>
        </div>
    );
};