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
        minHeight: '100vh',
        backgroundColor: '#fafafa'
      }}>
        <AutoSyncSettings
          workspaceName={"workspace-backup"}
        />
        <div style={{
          backgroundColor: 'white',
          borderBottom: '2px solid #eee',
          padding: '15px 20px'
        }}>
          <h1 style={{
            margin: '0 0 15px 0',
            fontSize: '28px',
            color: '#333'
          }}>
            Workspace Manager
          </h1>
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
