// src/components/ImportExport.jsx
import { useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { IMPORT_WORKSPACES, GET_WORKPLACES } from '../graphql/queries';

function ImportExport({ onImportComplete }) {
  const fileInputRef = useRef(null);
  const { data } = useQuery(GET_WORKPLACES,);
  const [importWorkspaces] = useMutation(IMPORT_WORKSPACES);

  const removeTypename = (value) => {
    if (value === null || value === undefined) {
      return value;
    } else if (Array.isArray(value)) {
      return value.map(v => removeTypename(v));
    } else if (typeof value === 'object') {
      const newObj = {};
      Object.entries(value).forEach(([key, v]) => {
        if (key !== '__typename') {
          newObj[key] = removeTypename(v);
        }
      });
      return newObj;
    }
    return value;
  };

  const handleExport = () => {
    if (!data?.workplaces || data.workplaces.length === 0) {
      alert('No workspaces to export');
      return;
    }



    // Create export data structure
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      workspaces: removeTypename(data.workplaces)
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = removeTypename(JSON.parse(text));

      await importWorkspaces({
        variables: {
          input: importData
        }
      });

      alert('Import successful!');
      onImportComplete();
    } catch (err) {
      console.error('Error importing:', err);
      alert('Import failed: ' + err.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={handleExport} style={styles.button}>
        📤 Export
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={styles.fileInput}
        id="import-file"
      />
      <label htmlFor="import-file" style={styles.button}>
        📥 Import
      </label>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    padding: '8px 14px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '4px',
  },
  fileInput: {
    display: 'none',
  },
};

export default ImportExport;