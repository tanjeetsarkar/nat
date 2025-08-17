import { useState } from "react";
import { NoteModal } from "./NoteModal";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableNotes } from "./SortableNotes";


export function Note({ block, dataManager }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [isNewNote, setIsNewNote] = useState(false);


    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleAddNote = () => {
        setEditingNote(null);
        setIsNewNote(true);
        setModalOpen(true);
    };

    const handleEditNote = (note) => {
        console.log("Editing Note ID", note.id)
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


    const handleDragEnd = (event) => {
        const { active, over } = event;
        console.log("Moving from", active.id, "to", over.id)
        if (active.id !== over?.id) {
            //   setNotes((items) => {
            //     const oldIndex = items.findIndex((item) => item.id === active.id);
            //     const newIndex = items.findIndex((item) => item.id === over?.id);
            //     return arrayMove(items, oldIndex, newIndex);
            //   });
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
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={block.notes} strategy={verticalListSortingStrategy}>

                                {block.notes.map(note => (
                                    <SortableNotes key={note.id} note={note} dataManager={dataManager} block={block} editNote={handleEditNote} />
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