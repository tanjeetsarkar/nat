import './App.css'
import TodoApp from './componenets/NoteBlock'
import { WorkspaceTabs } from './componenets/WorkspaceTabs'
import { useWorkspaceManager } from './hooks/workspaceManagement';
import { AutoSyncSettings } from './componenets/AutosyncSettings';

function App() {
  const workspaceManager = useWorkspaceManager();
  return (
    <>
      <div style={{
        fontFamily: 'Arial, sans-serif',
        maxHeight: '100vh',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderBottom: '2px solid #eee',
          padding: '5px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px'}}>
            <h1 style={{
              margin: '0 0 5px 0',
              fontSize: '28px',
              color: '#333'
            }}>
              Workspace Manager
            </h1>
            <AutoSyncSettings
              workspaceName={"workspace-backup"}
            />
          </div>
          <WorkspaceTabs workspaceManager={workspaceManager} />
        </div>

        <TodoApp
          workspaceId={workspaceManager.workspaces.active}
          workspaceManager={workspaceManager}
        />
      </div>
    </>
  )
}

export default App
