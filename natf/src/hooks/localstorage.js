import { useCallback, useEffect, useState } from "react";

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

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            const value = item ? JSON.parse(item) : initialValue;
            setStoredValue(value);
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            setStoredValue(initialValue);
        }
    }, [key]);

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

export function useNoteData(workspaceId) {
    const storageKey = `workspace_data_${workspaceId}`;


    const initialData = {
        noteBlocks: [
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
        ],
        appConfig: {
            title: 'Simple Todo App',
            metadata: { created: new Date().toISOString(), updated: new Date().toISOString() }
        }
    };

    const [workspaceData, setWorkspaceData] = useLocalStorage(storageKey, initialData);

    const updateAppConfig = useCallback((updates) => {
        setWorkspaceData(prev => ({
            ...prev,
            appConfig: {
                ...prev.appConfig,
                ...updates,
                metadata: {
                    ...prev.appConfig.metadata,
                    updated: new Date().toISOString()
                }
            }
        }));
    }, [setWorkspaceData]);

    // Note Block operations
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

        setWorkspaceData(prev => ({
            ...prev,
            noteBlocks: [...prev.noteBlocks, newBlock]
        }));
        return newBlock;
    }, [setWorkspaceData]);

    const updateNoteBlock = useCallback((blockId, updates) => {
        setWorkspaceData(prev => ({
            ...prev,
            noteBlocks: prev.noteBlocks.map(block =>
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
            )
        }));
    }, [setWorkspaceData]);

    const deleteNoteBlock = useCallback((blockId) => {
        setWorkspaceData(prev => ({
            ...prev,
            noteBlocks: prev.noteBlocks.filter(block => block.id !== blockId)
        }));
    }, [setWorkspaceData]);

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

        setWorkspaceData(prev => ({
            ...prev,
            noteBlocks: prev.noteBlocks.map(block =>
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
            )
        }));
        return newNote;
    }, [setWorkspaceData]);

    const updateNote = useCallback((blockId, noteId, updates) => {
        setWorkspaceData(prev => ({
            ...prev,
            noteBlocks: prev.noteBlocks.map(block =>
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
            )
        }));
    }, [setWorkspaceData]);

    const deleteNote = useCallback((blockId, noteId) => {
        setWorkspaceData(prev => ({
            ...prev,
            noteBlocks: prev.noteBlocks.map(block =>
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
            )
        }));
    }, [setWorkspaceData]);

    // Utility functions
    const exportData = useCallback(() => {
        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            appConfig: workspaceData.appConfig,
            noteBlocks: workspaceData.noteBlocks
        };
    }, [workspaceData]);

    const importData = useCallback((data) => {
        if (data.noteBlocks && Array.isArray(data.noteBlocks)) {
            setWorkspaceData({
                noteBlocks: data.noteBlocks,
                appConfig: data.appConfig || workspaceData.appConfig
            });
            return true;
        }
        return false;
    }, [setWorkspaceData, workspaceData.appConfig]);

    return {
        // Data
        noteBlocks: workspaceData.noteBlocks,
        appConfig: workspaceData.appConfig,

        // App Config operations
        updateAppConfig,

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
        importData
    };
}