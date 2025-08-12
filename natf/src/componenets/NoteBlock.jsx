import { Note } from './Note';
import { useNoteData } from '../hooks/localstorage';
import { EditableText } from './EditableText';

export default function TodoApp() {
  const dataManager = useNoteData();

  const exportToText = () => {
    let text = 'TODO APP EXPORT\n';
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
            text += `    ${note.note}\n`;
          }
          text += `    Created: ${new Date(note.metadata.created).toLocaleString()}\n`;
          if (note.metadata.updated !== note.metadata.created) {
            text += `    Updated: ${new Date(note.metadata.updated).toLocaleString()}\n`;
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
        <EditableText as='h1' initialValue='Simple Todo App' style={{ margin: '0 0 10px 0' }} />
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
            cursor: 'pointer'
          }}
        >
          Export JSON
        </button>
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