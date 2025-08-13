import { useState } from "react";
import { NoteModal } from "./NoteModal";

export function Note({ block, dataManager }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [isNewNote, setIsNewNote] = useState(false);

    const handleAddNote = () => {
        setEditingNote(null);
        setIsNewNote(true);
        setModalOpen(true);
    };

    const handleEditNote = (note) => {
        setEditingNote(note);
        setIsNewNote(false);
        setModalOpen(true);
    };

    const handleSaveNote = (formData) => {
        if (isNewNote) {
            dataManager.createNote(block.id, formData);
        } else {
            dataManager.updateNote(block.id, editingNote.id, formData);
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

    const getPriorityBorder = (priority) => {
        switch (priority) {
            case 'high': return '#e57373';
            case 'medium': return '#ffb74d';
            case 'low': return '#81c784';
            default: return '#ccc';
        }
    };

    return (
        <>
            <div style={{
                border: '2px solid #999',
                margin: '10px',
                padding: '15px',
                minWidth: '300px',
                width: '300px',
                display: 'inline-block',
                verticalAlign: 'top'
            }}>
                <div style={{
                    marginBottom: '15px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #ccc'
                }}>
                    <input
                        type="text"
                        value={block.head}
                        onChange={(e) => dataManager.updateNoteBlock(block.id, { head: e.target.value })}
                        style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: '1px solid #ccc',
                            padding: '5px',
                            width: '100%',
                            marginBottom: '10px',
                            boxSizing: 'border-box'
                        }}
                    />
                    <div style={{ marginBottom: '10px' }}>
                        <button
                            onClick={handleAddNote}
                            style={{
                                padding: '5px 10px',
                                border: '1px solid #666',
                                backgroundColor: '#f0f8ff',
                                cursor: 'pointer',
                                marginRight: '5px',
                                fontSize: '12px'
                            }}
                        >
                            Add Item
                        </button>
                        <button
                            onClick={() => dataManager.deleteNoteBlock(block.id)}
                            style={{
                                padding: '5px 10px',
                                border: '1px solid #666',
                                backgroundColor: '#ffeeee',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Delete Block
                        </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        Created: {new Date(block.metadata.created).toLocaleString()}
                        {block.metadata.updated !== block.metadata.created && (
                            <><br />Updated: {new Date(block.metadata.updated).toLocaleString()}</>
                        )}
                    </div>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {block.notes.length === 0 ? (
                        <div style={{
                            fontStyle: 'italic',
                            color: '#666',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                            No items in this block
                        </div>
                    ) : (
                        block.notes.map(note => (
                            <div key={note.id}
                                style={{
                                    border: `1px solid ${getPriorityBorder(note.priority)}`,
                                    margin: '8px 0',
                                    padding: '10px',
                                    backgroundColor: note.metadata.completed ? '#f0f8f0' : getPriorityColor(note.priority),
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onClick={() => handleEditNote(note)}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={note.metadata.completed}
                                        onChange={(e) => dataManager.updateNote(block.id, note.id, { completed: e.target.checked })}
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dataManager.deleteNote(block.id, note.id);
                                        }}
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
                        ))
                    )}
                </div>
            </div>

            <NoteModal
                isOpen={modalOpen}
                note={editingNote}
                onSave={handleSaveNote}
                onClose={() => setModalOpen(false)}
                isNew={isNewNote}
            />
        </>
    );
}