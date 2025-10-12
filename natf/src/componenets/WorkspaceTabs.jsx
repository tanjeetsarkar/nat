import { useState } from "react";

export function WorkspaceTabs({ workspaceManager }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  console.log("workspaceManager.workspaces.", workspaceManager.workspaces)
  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim()) {
      try {
        await workspaceManager.createWorkspace(newWorkspaceName.trim());
        setNewWorkspaceName('');
        setIsCreating(false);
      } catch (error) {
        console.error('Error creating workspace:', error);
        alert('Failed to create workspace. Please try again.');
      }
    }
  };

  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    if (window.confirm(`Are you sure you want to delete "${workspaceName}"? This cannot be undone.`)) {
      try {
        await workspaceManager.deleteWorkspace(workspaceId);
      } catch (error) {
        console.error('Error deleting workspace:', error);
        alert('Failed to delete workspace. Please try again.');
      }
    }
  };

  if (workspaceManager.loading) {
    return <div style={{ padding: '10px' }}>Loading workspaces...</div>;
  }

  if (workspaceManager.error) {
    return <div style={{ padding: '10px', color: 'red' }}>Error loading workspaces</div>;
  }

  return (
    <div style={{
      paddingBottom: '10px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '5px',
        marginBottom: '10px'
      }}>
        {workspaceManager.workspaces.list.map(workspace => (
          <div key={workspace.id} style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: workspace.id === workspaceManager.workspaces.active ? '#e8f4f8' : '#f5f5f5',
            border: `1px solid ${workspace.id === workspaceManager.workspaces.active ? '#4a90a4' : '#ccc'}`,
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => workspaceManager.switchWorkspace(workspace.id)}
              style={{
                padding: '6px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: workspace.id === workspaceManager.workspaces.active ? 'bold' : 'normal'
              }}
            >
              {workspace.name}
            </button>
            {workspaceManager.workspaces.list.length > 1 && (
              <button
                onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                style={{
                  padding: '6px 8px',
                  border: 'none',
                  backgroundColor: '#ffeeee',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#cc0000'
                }}
                title="Delete workspace"
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        {isCreating ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              placeholder="Workspace name"
              style={{
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                fontSize: '13px',
                width: '150px'
              }}
              autoFocus
            />
            <button
              onClick={handleCreateWorkspace}
              style={{
                padding: '6px 10px',
                border: '1px solid #666',
                backgroundColor: '#e8f4f8',
                cursor: 'pointer',
                fontSize: '11px',
                borderRadius: '3px'
              }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewWorkspaceName('');
              }}
              style={{
                padding: '6px 10px',
                border: '1px solid #666',
                backgroundColor: '#ffeeee',
                cursor: 'pointer',
                fontSize: '11px',
                borderRadius: '3px'
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '6px 12px',
              border: '1px solid #666',
              backgroundColor: '#f0f8ff',
              cursor: 'pointer',
              fontSize: '13px',
              borderRadius: '4px'
            }}
          >
            + New Workspace
          </button>
        )}
      </div>
      
      <div style={{ fontSize: '11px', color: '#666' }}>
        {workspaceManager.workspaces.list.find(ws => ws.id === workspaceManager.workspaces.active)?.updated && (
          <>Last modified: {new Date(workspaceManager.workspaces.list.find(ws => ws.id === workspaceManager.workspaces.active).updated).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}