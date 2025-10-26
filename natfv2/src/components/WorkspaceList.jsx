// src/components/WorkspaceList.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_WORKPLACES, CREATE_WORKPLACE, DELETE_WORKPLACE } from '../graphql/queries';
import WorkspaceView from './WorkspaceView';
import ImportExport from './ImportExport';

function WorkspaceList() {
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_WORKPLACES);
  const [createWorkplace] = useMutation(CREATE_WORKPLACE);
  const [deleteWorkplace] = useMutation(DELETE_WORKPLACE);

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      await createWorkplace({
        variables: {
          input: {
            id: `workspace_${Date.now()}`,
            name: newWorkspaceName
          }
        }
      });
      setNewWorkspaceName('');
      setIsCreating(false);
      refetch();
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workspace? All data will be lost.')) return;
    
    try {
      await deleteWorkplace({ variables: { id } });
      if (selectedWorkspace?.id === id) {
        setSelectedWorkspace(null);
      }
      refetch();
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  if (selectedWorkspace) {
    return (
      <WorkspaceView 
        workspaceId={selectedWorkspace.id}
        onBack={() => setSelectedWorkspace(null)}
      />
    );
  }

  if (loading) return <div style={styles.loading}>Loading workspaces...</div>;
  if (error) return <div style={styles.error}>Error loading workspaces: {error.message}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Workspaces</h1>
        <div style={styles.headerActions}>
          <ImportExport onImportComplete={refetch} />
          <button 
            onClick={() => setIsCreating(true)}
            style={styles.createButton}
          >
            + New Workspace
          </button>
        </div>
      </div>

      {isCreating && (
        <div style={styles.createForm}>
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name"
            style={styles.input}
            autoFocus
          />
          <div style={styles.formActions}>
            <button onClick={handleCreate} style={styles.saveButton}>
              Create
            </button>
            <button 
              onClick={() => {
                setIsCreating(false);
                setNewWorkspaceName('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={styles.workspaceGrid}>
        {data?.workplaces?.map(workspace => (
          <div key={workspace.id} style={styles.workspaceCard}>
            <div 
              onClick={() => setSelectedWorkspace(workspace)}
              style={styles.workspaceContent}
            >
              <h3 style={styles.workspaceName}>{workspace.name || 'Untitled'}</h3>
              <p style={styles.workspaceDate}>
                Updated: {new Date(workspace.updated).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(workspace.id);
              }}
              style={styles.deleteButton}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {data?.workplaces?.length === 0 && (
        <div style={styles.empty}>
          No workspaces yet. Create one to get started!
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #000',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  createForm: {
    marginBottom: '30px',
    padding: '20px',
    border: '2px solid #000',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #000',
    marginBottom: '10px',
    outline: 'none',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  workspaceCard: {
    border: '2px solid #000',
    padding: '20px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  workspaceContent: {
    marginBottom: '15px',
  },
  workspaceName: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 10px 0',
  },
  workspaceDate: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
  },
  deleteButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '12px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#d00',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '16px',
    color: '#666',
  },
};

export default WorkspaceList;