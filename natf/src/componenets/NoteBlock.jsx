import { useNoteData } from '../hooks/useNoteData';
import { Note } from './Note';

export default function TodoApp({ workspaceId, workspaceManager }) {
  const dataManager = useNoteData(workspaceId);

  const exportToText = () => {
    let text = `${dataManager.appConfig.title.toUpperCase()} - EXPORT\n`;
    text += '='.repeat(Math.max(dataManager.appConfig.title.length + 10, 20)) + '\n\n';

    dataManager.noteBlocks.forEach(block => {
      text += `## ${block.head}\n`;
      text += `Created: ${new Date(block.metadata.created).toLocaleString()}\n`;
      if (block.metadata.updated !== block.metadata.created) {
        text += `Updated: ${new Date(block.metadata.updated).toLocaleString()}\n`;
      }
      text += '\n';

      if (block.notes.length === 0) {
        text += 'No items\n\n';
      } else {
        block.notes.forEach(note => {
          const status = note.metadata.completed ? '[✓]' : '[ ]';
          text += `${status} [${note.priority.toUpperCase()}] ${note.head}\n`;
          if (note.note) {
            text += `${note.note}\n`;
          }
          text += `Created: ${new Date(note.metadata.created).toLocaleString()}\n`;
          if (note.metadata.updated !== note.metadata.created) {
            text += `Updated: ${new Date(note.metadata.updated).toLocaleString()}\n`;
          }
          text += '\n';
        });
      }
      text += '---\n\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCurrentWorkspace = () => {
    const data = dataManager.exportData();
    const currentWorkspace = workspaceManager.workspaces.list.find(ws => ws.id === workspaceId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkspace?.name || 'workspace'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllWorkspaces = () => {
    const data = workspaceManager.exportAllWorkspaces();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-workspaces-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importToCurrentWorkspace = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);

          // Check if it's a single workspace or all workspaces
          if (importedData.workspaces) {
            // This is an all-workspaces export
            const confirmImport = window.confirm(
              'This file contains multiple workspaces. This will replace ALL your current workspaces. Are you sure you want to continue?'
            );

            if (confirmImport) {
              const success = workspaceManager.importAllWorkspaces(importedData);
              if (success) {
                alert('All workspaces imported successfully!');
              } else {
                alert('Failed to import workspaces. Please check the file format.');
              }
            }
          } else {
            // This is a single workspace export
            const confirmImport = window.confirm(
              'This will replace the current workspace data. Are you sure you want to continue?'
            );

            if (confirmImport) {
              const success = dataManager.importData(importedData);
              if (success) {
                alert('Workspace imported successfully!');
                // Update workspace last modified time
                workspaceManager.updateWorkspace(workspaceId, {});
              } else {
                alert('Failed to import data. Please check the file format.');
              }
            }
          }
        } catch (error) {
          console.error('Error importing JSON:', error);
          alert('Error reading the file. Please ensure it\'s a valid JSON file.');
        }
      };

      reader.readAsText(file);
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #ccc'
      }}>
        <input
          type="text"
          value={dataManager.appConfig.title}
          onChange={(e) => dataManager.updateAppConfig({ title: e.target.value })}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            border: '1px solid #ddd',
            padding: '8px 12px',
            marginBottom: '15px',
            backgroundColor: '#f9f9f9',
            width: '400px',
            maxWidth: '100%',
            borderRadius: '4px'
          }}
        />
        {dataManager.appConfig.metadata.updated !== dataManager.appConfig.metadata.created && (
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
            Title last updated: {new Date(dataManager.appConfig.metadata.updated).toLocaleString()}
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => dataManager.createNoteBlock()}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              border: '1px solid #666',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer'
            }}
          >
            Add Note Block
          </button>
          <button
            onClick={exportToText}
            style={{
              padding: '8px 16px',
              border: '1px solid #666',
              backgroundColor: '#e8f4f8',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Export to Text
          </button>
          <button
            onClick={exportCurrentWorkspace}
            style={{
              padding: '8px 16px',
              border: '1px solid #666',
              backgroundColor: '#f0f8e8',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Export Current
          </button>
          <button
            onClick={exportAllWorkspaces}
            style={{
              padding: '8px 16px',
              border: '1px solid #666',
              backgroundColor: '#f8f0e8',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Export All
          </button>
          <button
            onClick={importToCurrentWorkspace}
            style={{
              padding: '8px 16px',
              border: '1px solid #666',
              backgroundColor: '#e8f0f8',
              cursor: 'pointer'
            }}
          >
            Import JSON
          </button>
        </div>
      </div>

      <div style={{
        whiteSpace: 'nowrap',
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        {dataManager.noteBlocks.map(block => (
          <Note
            key={block.id}
            block={block}
            dataManager={dataManager}
          />
        ))}
      </div>
    </div>
  );
}