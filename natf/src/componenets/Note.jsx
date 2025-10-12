import { useState } from "react";
import { NoteModal } from "./NoteModal";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableNotes } from "./SortableNotes";

export function Note({ block, dataManager }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [isNewNote, setIsNewNote] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

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

    const handleSaveNote = async (formData) => {
        try {
            if (isNewNote) {
                await dataManager.createNote(block.id, formData);
            } else {
                await dataManager.updateNote(block.id, editingNote.id, {
                    priority: formData.priority,
                    head: formData.head,
                    note: formData.note,
                    completed: editingNote.metadata.completed
                });
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = block.notes.findIndex((item) => item.id === active.id);
            const newIndex = block.notes.findIndex((item) => item.id === over?.id);
            const newNotesList = arrayMove(block.notes, oldIndex, newIndex);
            
            try {
                await dataManager.updateNotes(block.id, newNotesList);
            } catch (error) {
                console.error('Error reordering notes:', error);
            }
        }
    };

    const handleDeleteBlock = async () => {
        if (window.confirm(`Are you sure you want to delete "${block.head}"? This will delete all notes in this block.`)) {
            try {
                await dataManager.deleteNoteBlock(block.id);
            } catch (error) {
                console.error('Error deleting note block:', error);
                alert('Failed to delete note block. Please try again.');
            }
        }
    };

    const handleUpdateBlockHead = async (newHead) => {
        try {
            await dataManager.updateNoteBlock(block.id, { head: newHead });
        } catch (error) {
            console.error('Error updating note block:', error);
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
                        onChange={(e) => handleUpdateBlockHead(e.target.value)}
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
                            onClick={handleDeleteBlock}
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
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={block.notes} strategy={verticalListSortingStrategy}>
                                {block.notes.map(note => (
                                    <SortableNotes
                                        key={note.id}
                                        note={note}
                                        dataManager={dataManager}
                                        block={block}
                                        editNote={handleEditNote}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
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