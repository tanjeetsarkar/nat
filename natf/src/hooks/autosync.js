import { useEffect, useRef, useState } from "react";
import { useWorkspaceManager } from "./workspaceManagement";

export function useAutoSync(workspaceName) {
    const workspaceManager = useWorkspaceManager()
    const [autoSyncPath, setAutoSyncPath] = useState('');
    const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const fileHandleRef = useRef(null);
    const lastSavedDataRef = useRef('');

    const hasFileSystemAccess = 'showSaveFilePicker' in window;

    // Auto-save (only for File System Access API)
    useEffect(() => {
        if (!isAutoSyncEnabled || !fileHandleRef.current || !workspaceManager.workspaces.list.length || !hasFileSystemAccess) {
            return;
        }

        const currentDataJson = JSON.stringify(workspaceManager.exportAllWorkspaces(), null, 2);
        if (currentDataJson === lastSavedDataRef.current) return;

        const saveTimeout = setTimeout(async () => {
            try {
                setSyncStatus('Syncing...');
                await saveToFile(workspaceManager.exportAllWorkspaces());
                lastSavedDataRef.current = currentDataJson;
                setSyncStatus('Synced');
                setTimeout(() => setSyncStatus(''), 2000);
            } catch (error) {
                setSyncStatus('Sync failed');
                setTimeout(() => setSyncStatus(''), 3000);
            }
        }, 5000);

        return () => clearTimeout(saveTimeout);
    }, [workspaceManager.exportAllWorkspaces(), isAutoSyncEnabled, hasFileSystemAccess]);

    // File System Access API save
    const saveToFile = async (data) => {
        const writable = await fileHandleRef.current.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    };

    // Manual download for all browsers
    const downloadToFile = (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workspaceName || 'workspace'}-backup.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const setupAutoSync = async () => {
        if (hasFileSystemAccess) {
            // Use File System Access API for true auto-sync, but only supported by chromium based braowsers
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: `${workspaceName || 'workspace'}-autosync.json`,
                    types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }]
                });
                fileHandleRef.current = fileHandle;
                setAutoSyncPath(fileHandle.name);
                setIsAutoSyncEnabled(true);
                setSyncStatus('Auto-sync enabled');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setSyncStatus('Setup failed');
                }
            }
        } else {
            // Fallback: just enable manual sync
            setIsAutoSyncEnabled(true);
            setSyncStatus('Manual sync ready');
        }
        setTimeout(() => setSyncStatus(''), 2000);
    };

    const manualSync = async () => {
        if (!workspaceManager.workspaces.list.length) return;
        setSyncStatus('Syncing...');
        if (hasFileSystemAccess && fileHandleRef.current) {
            try {
                await saveToFile(workspaceManager.exportAllWorkspaces());
                setSyncStatus('Synced');
            } catch (error) {
                setSyncStatus('Sync failed');
            }
        } else {
            downloadToFile(workspaceManager.exportAllWorkspaces());
            setSyncStatus('Downloaded');
        }
        setTimeout(() => setSyncStatus(''), 2000);
    };

    return {
        autoSyncPath,
        isAutoSyncEnabled,
        syncStatus,
        setupAutoSync,
        disableAutoSync: () => {
            setIsAutoSyncEnabled(false);
            fileHandleRef.current = null;
            setSyncStatus('Disabled');
        },
        manualSync,
        hasFileSystemAccess
    };
}