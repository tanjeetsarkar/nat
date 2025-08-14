import { useAutoSync } from "../hooks/autosync";

export function AutoSyncSettings({ workspaceData, workspaceId, workspaceName }) {
  const { isAutoSyncEnabled, syncStatus, setupAutoSync, disableAutoSync, manualSync } = useAutoSync(workspaceData, workspaceId, workspaceName);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      fontSize: '12px'
    }}>
      <span style={{ color: isAutoSyncEnabled ? '#28a745' : '#6c757d' }}>
        {isAutoSyncEnabled ? '🔄' : '⏸️'}
      </span>
      
      {!isAutoSyncEnabled ? (
        <button onClick={setupAutoSync} style={{
          padding: '2px 6px', border: 'none', backgroundColor: 'transparent',
          cursor: 'pointer', fontSize: '11px', color: '#007bff'
        }}>
          Enable Auto-Sync
        </button>
      ) : (
        <>
          <button onClick={manualSync} style={{
            padding: '2px 6px', border: 'none', backgroundColor: 'transparent',
            cursor: 'pointer', fontSize: '11px', color: '#28a745'
          }}>
            Sync
          </button>
          <button onClick={disableAutoSync} style={{
            padding: '2px 6px', border: 'none', backgroundColor: 'transparent',
            cursor: 'pointer', fontSize: '11px', color: '#dc3545'
          }}>
            Disable
          </button>
        </>
      )}
      
      {syncStatus && (
        <span style={{ 
          fontSize: '10px', 
          color: syncStatus.includes('failed') ? '#dc3545' : '#28a745',
          fontWeight: '500'
        }}>
          {syncStatus}
        </span>
      )}
    </div>
  );
}