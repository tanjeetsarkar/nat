import { useCallback } from "react";
import { useLocalStorage } from "./localstorage";

export function useWorkspaceManager() {
    const [workspaces, setWorkspaces, clearWorkspaces] = useLocalStorage('workspaces', {
        list: [
            {
                id: 'default',
                name: 'My Workspace',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        ],
        active: 'default'
    });

    const createWorkspace = useCallback((name) => {
        const newId = `workspace_${Date.now()}`;
        const newWorkspace = {
            id: newId,
            name: name || 'New Workspace',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        setWorkspaces(prev => ({
            list: [...prev.list, newWorkspace],
            active: newId
        }));

        return newId;
    }, [setWorkspaces]);

    const deleteWorkspace = useCallback((workspaceId) => {
        if (workspaces.list.length <= 1) {
            alert('Cannot delete the last workspace');
            return false;
        }

        setWorkspaces(prev => {
            const newList = prev.list.filter(ws => ws.id !== workspaceId);
            const newActive = prev.active === workspaceId ? newList[0].id : prev.active;
            return {
                list: newList,
                active: newActive
            };
        });

        // Clear the workspace data
        try {
            window.localStorage.removeItem(`workspace_data_${workspaceId}`);
        } catch (error) {
            console.error('Error deleting workspace data:', error);
        }

        return true;
    }, [workspaces.list.length, setWorkspaces]);

    const switchWorkspace = useCallback((workspaceId) => {
        setWorkspaces(prev => ({
            ...prev,
            active: workspaceId
        }));
    }, [setWorkspaces]);

    const updateWorkspace = useCallback((workspaceId, updates) => {
        setWorkspaces(prev => ({
            ...prev,
            list: prev.list.map(ws =>
                ws.id === workspaceId
                    ? { ...ws, ...updates, lastModified: new Date().toISOString() }
                    : ws
            )
        }));
    }, [setWorkspaces]);

    const exportAllWorkspaces = useCallback(() => {
        const allData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            workspaces: workspaces.list.map(ws => {
                try {
                    const workspaceData = JSON.parse(window.localStorage.getItem(`workspace_data_${ws.id}`) || '{}');
                    return {
                        ...ws,
                        data: workspaceData
                    };
                } catch (error) {
                    console.error(`Error loading workspace ${ws.id}:`, error);
                    return { ...ws, data: {} };
                }
            })
        };

        return allData;
    }, [workspaces.list]);

    const importAllWorkspaces = useCallback((data) => {
        if (!data.workspaces || !Array.isArray(data.workspaces)) {
            return false;
        }

        try {
            // Import workspace metadata
            const workspaceList = data.workspaces.map(ws => ({
                id: ws.id || `imported_${Date.now()}_${Math.random()}`,
                name: ws.name || 'Imported Workspace',
                created: ws.created || new Date().toISOString(),
                lastModified: new Date().toISOString()
            }));

            setWorkspaces({
                list: workspaceList,
                active: workspaceList[0]?.id || 'default'
            });

            // Import workspace data
            data.workspaces.forEach(ws => {
                if (ws.data) {
                    window.localStorage.setItem(`workspace_data_${ws.id}`, JSON.stringify(ws.data));
                }
            });

            return true;
        } catch (error) {
            console.error('Error importing workspaces:', error);
            return false;
        }
    }, [setWorkspaces]);

    return {
        workspaces,
        createWorkspace,
        deleteWorkspace,
        switchWorkspace,
        updateWorkspace,
        exportAllWorkspaces,
        importAllWorkspaces,
    };
}