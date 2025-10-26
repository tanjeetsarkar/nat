// src/components/WorkspaceView.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  GET_WORKPLACE, 
  UPDATE_WORKPLACE, 
  CREATE_APP_DATA, 
  UPDATE_APP_DATA,
  CREATE_NOTE_BLOCK 
} from '../graphql/queries';
import NoteBlockList from './NoteBlockList';

function WorkspaceView({ workspaceId, onBack }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [appTitle, setAppTitle] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_WORKPLACE, {
    variables: { id: workspaceId }
  });

  const [updateWorkplace] = useMutation(UPDATE_WORKPLACE);
  const [createAppData] = useMutation(CREATE_APP_DATA);
  const [updateAppData] = useMutation(UPDATE_APP_DATA);
  const [createNoteBlock] = useMutation(CREATE_NOTE_BLOCK);

  useEffect(() => {
    if (data?.workplace) {
      setWorkspaceName(data.workplace.name || '');
      setAppTitle(data.workplace.appData?.[0]?.title || '');
    }
  }, [data]);

  const handleUpdateWorkspaceName = async () => {
    try {
      await updateWorkplace({
        variables: {
          id: workspaceId,
          input: { name: workspaceName }
        }
      });
      setIsEditingName(false);
      refetch();
    } catch (err) {
      console.error('Error updating workspace:', err);
    }
  };

  const handleUpdateAppTitle = async () => {
    try {
      const appData = data?.workplace?.appData?.[0];
      if (appData) {
        await updateAppData({
          variables: {
            id: appData.id,
            input: { title: appTitle }
          }
        });
      } else {
        await createAppData({
          variables: {
            input: {
              workplaceId: workspaceId,
              title: appTitle
            }
          }
        });
      }
      setIsEditingTitle(false);
      refetch();
    } catch (err) {
      console.error('Error updating app title:', err);
    }
  };

  const handleCreateBlock = async () => {
    const appData = data?.workplace?.appData?.[0];
    if (!appData) {
      alert('Please set an app title first');
      return;
    }

    try {
      await createNoteBlock({
        variables: {
          input: {
            appId: appData.id,
            head: 'New Block'
          }
        }
      });
      refetch();
    } catch (err) {
      console.error('Error creating block:', err);
    }
  };

  if (loading) return <div style={styles.loading}>Loading workspace...</div>;
  if (error) return <div style={styles.error}>Error: {error.message}</div>;

  const workplace = data?.workplace;
  const appData = workplace?.appData?.[0];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Workspaces
        </button>
      </div>

      <div style={styles.workspaceHeader}>
        {isEditingName ? (
          <div style={styles.editForm}>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <button onClick={handleUpdateWorkspaceName} style={styles.saveButton}>
              Save
            </button>
            <button 
              onClick={() => {
                setWorkspaceName(workplace.name || '');
                setIsEditingName(false);
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        ) : (
          <h1 
            style={styles.workspaceName}
            onClick={() => setIsEditingName(true)}
          >
            {workplace.name || 'Untitled Workspace'} ✎
          </h1>
        )}

        {isEditingTitle ? (
          <div style={styles.editForm}>
            <input
              type="text"
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              placeholder="App title"
              style={styles.input}
              autoFocus
            />
            <button onClick={handleUpdateAppTitle} style={styles.saveButton}>
              Save
            </button>
            <button 
              onClick={() => {
                setAppTitle(appData?.title || '');
                setIsEditingTitle(false);
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        ) : (
          <h2 
            style={styles.appTitle}
            onClick={() => setIsEditingTitle(true)}
          >
            {appData?.title || 'Set App Title'} ✎
          </h2>
        )}
      </div>

      {appData && (
        <>
          <div style={styles.actions}>
            <button onClick={handleCreateBlock} style={styles.createButton}>
              + Add Block
            </button>
          </div>

          <NoteBlockList 
            blocks={appData.blocks || []} 
            appId={appData.id}
            onUpdate={refetch}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    marginBottom: '20px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
  },
  workspaceHeader: {
    borderBottom: '2px solid #000',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  workspaceName: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    cursor: 'pointer',
  },
  appTitle: {
    fontSize: '20px',
    fontWeight: '400',
    margin: 0,
    cursor: 'pointer',
    color: '#666',
  },
  editForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #000',
    outline: 'none',
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
  actions: {
    marginBottom: '20px',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
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
  },
};

export default WorkspaceView;