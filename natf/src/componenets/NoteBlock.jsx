import { Note } from './Note';
import { useNoteData } from '../hooks/localstorage';

export default function TodoApp() {
  const dataManager = useNoteData();

  const exportToText = () => {
    let text = `${dataManager.listName}\n`;
    text += '================\n\n';

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

  const exportToJSON = () => {
    const data = dataManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const importFromJSON = () => {
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

          // Validate the imported data structure
          if (!importedData.noteBlocks || !Array.isArray(importedData.noteBlocks)) {
            alert('Invalid JSON format. Please ensure the file contains valid todo app data.');
            return;
          }

          // Confirm before importing (this will replace all current data)
          const confirmImport = window.confirm(
            'This will replace all your current data with the imported data. Are you sure you want to continue?'
          );

          if (confirmImport) {
            const success = dataManager.importData(importedData);
            if (success) {
              alert('Data imported successfully!');
            } else {
              alert('Failed to import data. Please check the file format.');
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
            onClick={exportToJSON}
            style={{
              padding: '8px 16px',
              border: '1px solid #666',
              backgroundColor: '#f0f8e8',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Export JSON
          </button>
          <button
            onClick={importFromJSON}
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
        {dataManager.appConfig.metadata.updated !== dataManager.appConfig.metadata.created && (
          <div style={{ fontSize: '12px', color: '#888' }}>
            Title last updated: {new Date(dataManager.appConfig.metadata.updated).toLocaleString()}
          </div>
        )}
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