// src/components/TrelloBoard.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  GET_WORKPLACES, 
  GET_WORKPLACE,
  CREATE_WORKPLACE,
  DELETE_WORKPLACE,
  CREATE_APP_DATA,
  UPDATE_APP_DATA,
  CREATE_NOTE_BLOCK,
  UPDATE_NOTE_BLOCK,
  UPDATE_NOTE
} from '../graphql/queries';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableBlock from './SortableBlock';
import SortableNote from './SortableNote';
import ImportExport from './ImportExport';

function TrelloBoard() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [appTitle, setAppTitle] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const { data: workspacesData, refetch: refetchWorkspaces } = useQuery(GET_WORKPLACES);
  const { data: workplaceData, refetch: refetchWorkplace } = useQuery(GET_WORKPLACE, {
    variables: { id: selectedWorkspaceId },
    skip: !selectedWorkspaceId,
  });

  const [createWorkspace] = useMutation(CREATE_WORKPLACE);
  const [deleteWorkspace] = useMutation(DELETE_WORKPLACE);
  const [createAppData] = useMutation(CREATE_APP_DATA);
  const [updateAppData] = useMutation(UPDATE_APP_DATA);
  const [createNoteBlock] = useMutation(CREATE_NOTE_BLOCK);
  const [updateNoteBlock] = useMutation(UPDATE_NOTE_BLOCK);
  const [updateNote] = useMutation(UPDATE_NOTE);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-select first workspace
  useEffect(() => {
    if (workspacesData?.workplaces?.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspacesData.workplaces[0].id);
    }
  }, [workspacesData, selectedWorkspaceId]);

  // Update app title when workspace changes
  useEffect(() => {
    if (workplaceData?.workplace?.appData?.[0]) {
      setAppTitle(workplaceData.workplace.appData[0].title || '');
    }
  }, [workplaceData]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      const result = await createWorkspace({
        variables: {
          input: {
            id: `workspace_${Date.now()}`,
            name: newWorkspaceName
          }
        }
      });
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
      setSelectedWorkspaceId(result.data.createWorkplace.id);
      refetchWorkspaces();
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm('Delete this workspace?')) return;
    
    try {
      await deleteWorkspace({ variables: { id } });
      if (selectedWorkspaceId === id) {
        setSelectedWorkspaceId(workspacesData?.workplaces?.[0]?.id || null);
      }
      refetchWorkspaces();
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  const handleUpdateAppTitle = async () => {
    try {
      const appData = workplaceData?.workplace?.appData?.[0];
      if (appData) {
        await updateAppData({
          variables: { id: appData.id, input: { title: appTitle } }
        });
      } else {
        await createAppData({
          variables: {
            input: { workplaceId: selectedWorkspaceId, title: appTitle }
          }
        });
      }
      setIsEditingTitle(false);
      refetchWorkplace();
    } catch (err) {
      console.error('Error updating app title:', err);
    }
  };

  const handleCreateBlock = async () => {
    const appData = workplaceData?.workplace?.appData?.[0];
    if (!appData) {
      alert('Please set an app title first');
      return;
    }

    try {
      await createNoteBlock({
        variables: {
          input: { appId: appData.id, head: 'New Block' }
        }
      });
      refetchWorkplace();
    } catch (err) {
      console.error('Error creating block:', err);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Determine if dragging a block or note
    if (active.id.toString().startsWith('block-')) {
      setActiveType('block');
    } else if (active.id.toString().startsWith('note-')) {
      setActiveType('note');
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Handle note reordering within and between blocks
    if (activeType === 'note') {
      const activeBlockId = active.data.current?.blockId;
      const overBlockId = over.data.current?.blockId;

      if (activeBlockId && overBlockId && activeBlockId !== overBlockId) {
        // Moving note to different block - handle if needed
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    const appData = workplaceData?.workplace?.appData?.[0];
    if (!appData) return;

    // Handle block reordering
    if (activeType === 'block') {
      const blocks = [...(appData.blocks || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      const oldIndex = blocks.findIndex(b => `block-${b.id}` === active.id);
      const newIndex = blocks.findIndex(b => `block-${b.id}` === over.id);

      if (oldIndex !== newIndex) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        
        // Update order for all blocks
        for (let i = 0; i < newBlocks.length; i++) {
          await updateNoteBlock({
            variables: {
              id: newBlocks[i].id,
              input: { order: i }
            }
          });
        }
        refetchWorkplace();
      }
    }

    // Handle note reordering
    if (activeType === 'note') {
      const activeBlockId = active.data.current?.blockId;
      const overBlockId = over.data.current?.blockId;

      if (activeBlockId === overBlockId) {
        const block = appData.blocks.find(b => b.id === activeBlockId);
        const notes = [...(block?.notes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const oldIndex = notes.findIndex(n => `note-${n.id}` === active.id);
        const newIndex = notes.findIndex(n => `note-${n.id}` === over.id);

        if (oldIndex !== newIndex) {
          const newNotes = arrayMove(notes, oldIndex, newIndex);
          
          // Update order for all notes
          for (let i = 0; i < newNotes.length; i++) {
            await updateNote({
              variables: {
                id: newNotes[i].id,
                input: { order: i }
              }
            });
          }
          refetchWorkplace();
        }
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  const appData = workplaceData?.workplace?.appData?.[0];
  const blocks = appData?.blocks ? [...appData.blocks].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];

  return (
    <div style={styles.container}>
      {/* Workspaces Bar */}
      <div style={styles.workspacesBar}>
        <div style={styles.workspaceTabs}>
          {workspacesData?.workplaces?.map(workspace => (
            <div
              key={workspace.id}
              onClick={() => setSelectedWorkspaceId(workspace.id)}
              style={{
                ...styles.workspaceTab,
                ...(selectedWorkspaceId === workspace.id ? styles.workspaceTabActive : {})
              }}
            >
              {workspace.name || 'Untitled'}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteWorkspace(workspace.id);
                }}
                style={styles.deleteTabButton}
              >
                ×
              </button>
            </div>
          ))}
          
          {isCreatingWorkspace ? (
            <div style={styles.createWorkspaceForm}>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                style={styles.workspaceInput}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              />
              <button onClick={handleCreateWorkspace} style={styles.saveTabButton}>✓</button>
              <button onClick={() => {
                setIsCreatingWorkspace(false);
                setNewWorkspaceName('');
              }} style={styles.cancelTabButton}>×</button>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreatingWorkspace(true)}
              style={styles.addWorkspaceButton}
            >
              + New Workspace
            </button>
          )}
        </div>

        <div style={styles.headerActions}>
          <ImportExport onImportComplete={() => {
            refetchWorkspaces();
            refetchWorkplace();
          }} />
        </div>
      </div>

      {/* App Title Bar */}
      {selectedWorkspaceId && (
        <div style={styles.appTitleBar}>
          {isEditingTitle ? (
            <div style={styles.editTitleForm}>
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="Board title"
                style={styles.titleInput}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleUpdateAppTitle()}
              />
              <button onClick={handleUpdateAppTitle} style={styles.saveTitleButton}>Save</button>
              <button onClick={() => {
                setAppTitle(appData?.title || '');
                setIsEditingTitle(false);
              }} style={styles.cancelTitleButton}>Cancel</button>
            </div>
          ) : (
            <h2 
              style={styles.appTitle}
              onClick={() => setIsEditingTitle(true)}
            >
              {appData?.title || 'Click to set board title'} ✎
            </h2>
          )}

          <button onClick={handleCreateBlock} style={styles.createBlockButton}>
            + Add List
          </button>
        </div>
      )}

      {/* Board - Horizontal Scrolling Blocks */}
      {selectedWorkspaceId && appData && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={styles.board}>
            <SortableContext
              items={blocks.map(b => `block-${b.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {blocks.map(block => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={refetchWorkplace}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeId && activeType === 'block' && (
              <div style={styles.dragOverlay}>
                Dragging Block...
              </div>
            )}
            {activeId && activeType === 'note' && (
              <div style={styles.dragOverlay}>
                Dragging Note...
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {!selectedWorkspaceId && (
        <div style={styles.emptyState}>
          Create a workspace to get started!
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
  },
  workspacesBar: {
    backgroundColor: '#fff',
    borderBottom: '2px solid #000',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  workspaceTabs: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    overflowX: 'auto',
    flex: 1,
  },
  workspaceTab: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  workspaceTabActive: {
    backgroundColor: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  deleteTabButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  createWorkspaceForm: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  workspaceInput: {
    padding: '6px 10px',
    fontSize: '14px',
    border: '1px solid #000',
    outline: 'none',
    width: '150px',
  },
  saveTabButton: {
    padding: '6px 10px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelTabButton: {
    padding: '6px 10px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
  },
  addWorkspaceButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  appTitleBar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  appTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    cursor: 'pointer',
  },
  editTitleForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  titleInput: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #000',
    outline: 'none',
    width: '300px',
  },
  saveTitleButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelTitleButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
  },
  createBlockButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  board: {
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '20px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#666',
  },
  dragOverlay: {
    padding: '20px',
    backgroundColor: '#fff',
    border: '2px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default TrelloBoard;