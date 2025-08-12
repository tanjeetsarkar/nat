import { useEffect, useState } from "react";

export function NoteModal({ isOpen, note, onSave, onClose, isNew = false }) {
    const [formData, setFormData] = useState({
        head: note?.head || '',
        note: note?.note || '',
        priority: note?.priority || 'medium'
    });

    useEffect(() => {
        if (isOpen && note) {
            setFormData({
                head: note.head || '',
                note: note.note || '',
                priority: note.priority || 'medium'
            });
        } else if (isOpen && isNew) {
            setFormData({
                head: '',
                note: '',
                priority: 'medium'
            });
        }
    }, [isOpen, note, isNew]);

    const handleSave = () => {
        if (!formData.head.trim()) {
            alert('Title is required');
            return;
        }
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                border: '2px solid #666',
                padding: '20px',
                width: '400px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <h3 style={{ margin: '0 0 20px 0' }}>
                    {isNew ? 'Add New Note' : 'Edit Note'}
                </h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Title *
                    </label>
                    <input
                        type="text"
                        value={formData.head}
                        onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            boxSizing: 'border-box',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Priority
                    </label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            fontSize: '14px'
                        }}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Description
                    </label>
                    <textarea
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '8px',
                            border: '1px solid #ccc',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                        placeholder="Enter note description..."
                    />
                </div>

                <div style={{ textAlign: 'right' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            marginRight: '10px',
                            border: '1px solid #666',
                            backgroundColor: '#f5f5f5',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #666',
                            backgroundColor: '#e8f4f8',
                            cursor: 'pointer'
                        }}
                    >
                        {isNew ? 'Add Note' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}