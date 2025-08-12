import { useCallback, useState } from "react";

export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

// Data management hook - designed to be easily replaceable with API calls later
export function useNoteData() {
    const initialListName = 'Simple Todo App'
    const initialData = [
        {
            id: 1,
            head: 'Sample Note Block',
            metadata: { created: new Date().toISOString(), updated: new Date().toISOString() },
            notes: [
                {
                    id: 1,
                    priority: 'high',
                    head: 'Sample Todo Item',
                    note: 'This is a sample todo item description',
                    metadata: {
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                        completed: false
                    }
                }
            ]
        }
    ];

    const [noteBlocks, setNoteBlocks, clearNoteBlocks] = useLocalStorage('noteBlocks', initialData);
    const [appConfig, setAppConfig, clearAppConfig] = useLocalStorage('appConfig', {
        title: 'Simple Todo App',
        metadata: { created: new Date().toISOString(), updated: new Date().toISOString() }
    });

    const updateAppConfig = useCallback((updates) => {
        setAppConfig(prev => ({
            ...prev,
            ...updates,
            metadata: {
                ...prev.metadata,
                updated: new Date().toISOString()
            }
        }));
    }, [setAppConfig]);

    const createNoteBlock = useCallback((blockData) => {
        const newId = Date.now();
        const newBlock = {
            id: newId,
            head: blockData?.head || 'New Note Block',
            metadata: {
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            },
            notes: []
        };
        setNoteBlocks(prev => [...prev, newBlock]);
        return newBlock;
    }, [setNoteBlocks]);

    const updateNoteBlock = useCallback((blockId, updates) => {
        setNoteBlocks(prev => prev.map(block =>
            block.id === blockId
                ? {
                    ...block,
                    ...updates,
                    metadata: {
                        ...block.metadata,
                        updated: new Date().toISOString()
                    }
                }
                : block
        ));
    }, [setNoteBlocks]);

    const deleteNoteBlock = useCallback((blockId) => {
        setNoteBlocks(prev => prev.filter(block => block.id !== blockId));
    }, [setNoteBlocks]);

    // Note operations
    const createNote = useCallback((blockId, noteData) => {
        const newId = Date.now();
        const newNote = {
            id: newId,
            priority: noteData?.priority || 'medium',
            head: noteData?.head || 'New Todo Item',
            note: noteData?.note || '',
            metadata: {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                completed: false
            }
        };

        setNoteBlocks(prev => prev.map(block =>
            block.id === blockId
                ? {
                    ...block,
                    notes: [...block.notes, newNote],
                    metadata: {
                        ...block.metadata,
                        updated: new Date().toISOString()
                    }
                }
                : block
        ));
        return newNote;
    }, [setNoteBlocks]);

    const updateNote = useCallback((blockId, noteId, updates) => {
        setNoteBlocks(prev => prev.map(block =>
            block.id === blockId
                ? {
                    ...block,
                    notes: block.notes.map(note =>
                        note.id === noteId
                            ? {
                                ...note,
                                ...updates,
                                metadata: {
                                    ...note.metadata,
                                    ...((updates.completed !== undefined) ? { completed: updates.completed } : {}),
                                    updated: new Date().toISOString()
                                }
                            }
                            : note
                    ),
                    metadata: {
                        ...block.metadata,
                        updated: new Date().toISOString()
                    }
                }
                : block
        ));
    }, [setNoteBlocks]);

    const deleteNote = useCallback((blockId, noteId) => {
        setNoteBlocks(prev => prev.map(block =>
            block.id === blockId
                ? {
                    ...block,
                    notes: block.notes.filter(note => note.id !== noteId),
                    metadata: {
                        ...block.metadata,
                        updated: new Date().toISOString()
                    }
                }
                : block
        ));
    }, [setNoteBlocks]);

    // Utility functions
    const exportData = useCallback(() => {
        return {
            appConfig,
            exportDate: new Date().toISOString(),
            version: '1.0',
            noteBlocks: noteBlocks
        };
    }, [noteBlocks,appConfig]);

    const importData = useCallback((data) => {
        if (data.noteBlocks && Array.isArray(data.noteBlocks)) {
            setNoteBlocks(data.noteBlocks);
            if (data.appConfig) {
                setAppConfig(data.appConfig)
            }
            return true;
        }
        return false;
    }, [setNoteBlocks,setAppConfig]);

    const clearAllData = useCallback(() => {
        clearAppConfig()
        clearNoteBlocks();
    }, [clearNoteBlocks, clearAppConfig]);

    return {
        //app config
        appConfig,
        updateAppConfig,

        // Data
        noteBlocks,

        // Note Block operations
        createNoteBlock,
        updateNoteBlock,
        deleteNoteBlock,

        // Note operations
        createNote,
        updateNote,
        deleteNote,

        // Utility operations
        exportData,
        importData,
        clearAllData
    };
}
