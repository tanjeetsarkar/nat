import { useCallback, useMemo } from "react";
import { gql } from '@apollo/client'
import { useQuery, useMutation } from "@apollo/client/react";

// GraphQL Queries
const GET_APP_DATA = gql`
  query GetAppData($workspaceId: String!) {
    workplace(id: $workspaceId) {
      id
      name
      appData {
        id
        workplaceId
        title
        metadata {
          created
          updated
        }
        blocks {
          id
          appId
          head
          metadata {
            created
            updated
          }
          notes {
            id
            blockId
            priority
            head
            note
            metadata {
              created
              updated
              completed
            }
          }
        }
      }
    }
  }
`;

// GraphQL Mutations
const UPDATE_APP_DATA = gql`
  mutation UpdateAppData($id: ID!, $input: UpdateAppDataInput!) {
    updateAppData(id: $id, input: $input) {
      id
      title
      metadata {
        updated
      }
    }
  }
`;

const CREATE_NOTE_BLOCK = gql`
  mutation CreateNoteBlock($input: CreateNoteBlockInput!) {
    createNoteBlock(input: $input) {
      id
      appId
      head
      metadata {
        created
        updated
      }
    }
  }
`;

const UPDATE_NOTE_BLOCK = gql`
  mutation UpdateNoteBlock($id: ID!, $input: UpdateNoteBlockInput!) {
    updateNoteBlock(id: $id, input: $input) {
      id
      head
      metadata {
        updated
      }
    }
  }
`;

const DELETE_NOTE_BLOCK = gql`
  mutation DeleteNoteBlock($id: ID!) {
    deleteNoteBlock(id: $id)
  }
`;

const CREATE_NOTE = gql`
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      blockId
      priority
      head
      note
      metadata {
        created
        updated
        completed
      }
    }
  }
`;

const UPDATE_NOTE = gql`
  mutation UpdateNote($id: ID!, $input: UpdateNoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      priority
      head
      note
      metadata {
        updated
        completed
      }
    }
  }
`;

const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`;

export function useNoteData(workspaceId) {
  // Fetch workspace data
  const { data, loading, error, refetch } = useQuery(GET_APP_DATA, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [updateAppDataMutation] = useMutation(UPDATE_APP_DATA);
  const [createNoteBlockMutation] = useMutation(CREATE_NOTE_BLOCK, {
    refetchQueries: [{ query: GET_APP_DATA, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });
  const [updateNoteBlockMutation] = useMutation(UPDATE_NOTE_BLOCK);
  const [deleteNoteBlockMutation] = useMutation(DELETE_NOTE_BLOCK, {
    refetchQueries: [{ query: GET_APP_DATA, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });
  const [createNoteMutation] = useMutation(CREATE_NOTE, {
    refetchQueries: [{ query: GET_APP_DATA, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });
  const [updateNoteMutation] = useMutation(UPDATE_NOTE);
  const [deleteNoteMutation] = useMutation(DELETE_NOTE, {
    refetchQueries: [{ query: GET_APP_DATA, variables: { workspaceId } }],
    awaitRefetchQueries: true,
  });

  // Extract data from query result
  // IMPORTANT: appData is an array, so we take the first element
  const appData = useMemo(() => {
    // Handle case where appData is an array (from GraphQL response)
    const appDataArray = data?.workplace?.appData;
    const appDataObj = Array.isArray(appDataArray) ? appDataArray[0] : appDataArray;

    if (!appDataObj) {
      return {
        noteBlocks: [],
        appConfig: {
          id: null,
          title: 'Simple Todo App',
          metadata: { created: new Date().toISOString(), updated: new Date().toISOString() }
        }
      };
    }

    return {
      noteBlocks: appDataObj.blocks || [],
      appConfig: {
        id: appDataObj.id,
        title: appDataObj.title,
        metadata: appDataObj.metadata
      }
    };
  }, [data]);

  // App Config operations
  const updateAppConfig = useCallback(async (updates) => {
    // Get fresh appData from query result
    const appDataArray = data?.workplace?.appData;
    const appDataObj = Array.isArray(appDataArray) ? appDataArray[0] : appDataArray;
    const appConfigId = appDataObj?.id;

    if (!appConfigId) {
      console.error('App config ID not found');
      return;
    }

    try {
      await updateAppDataMutation({
        variables: {
          id: parseInt(appConfigId),
          input: updates
        }
      });
    } catch (err) {
      console.error('Error updating app config:', err);
      throw err;
    }
  }, [data, updateAppDataMutation]);

  // Note Block operations
  const createNoteBlock = useCallback(async (blockData) => {
    // Get fresh appData from query result
    const appDataArray = data?.workplace?.appData;
    const appDataObj = Array.isArray(appDataArray) ? appDataArray[0] : appDataArray;
    const appConfigId = appDataObj?.id;

    if (!appConfigId) {
      console.error('App config ID not found. Cannot create note block.');
      return null;
    }

    try {
      const result = await createNoteBlockMutation({
        variables: {
          input: {
            appId: parseInt(appConfigId),
            head: blockData?.head || 'New Note Block'
          }
        }
      });
      return result.data.createNoteBlock;
    } catch (err) {
      console.error('Error creating note block:', err);
      throw err;
    }
  }, [data, createNoteBlockMutation]);

  const updateNoteBlock = useCallback(async (blockId, updates) => {
    try {
      await updateNoteBlockMutation({
        variables: {
          id: parseInt(blockId),
          input: updates
        }
      });
    } catch (err) {
      console.error('Error updating note block:', err);
      throw err;
    }
  }, [updateNoteBlockMutation]);

  const updateNotes = useCallback(async (blockId, newNotesList) => {
    // Get the current block from fresh data
    const appDataArray = data?.workplace?.appData;
    const appDataObj = Array.isArray(appDataArray) ? appDataArray[0] : appDataArray;
    const block = appDataObj?.blocks?.find(b => b.id === blockId);

    if (!block) {
      console.error('Block not found');
      return;
    }
    console.log("newNotesList", newNotesList)
    try {
      // Update each note individually
      for (const newNote of newNotesList) {
        const existingNote = block.notes.find(n => n.id === newNote.id);
        if (existingNote) {
          // Check if note has changed (simple comparison)
          const hasChanged =
            existingNote.priority !== newNote.priority ||
            existingNote.head !== newNote.head ||
            existingNote.note !== newNote.note ||
            existingNote.metadata?.completed !== newNote.metadata?.completed;

          if (hasChanged) {
            await updateNoteMutation({
              variables: {
                id: parseInt(newNote.id),
                input: {
                  priority: newNote.priority,
                  head: newNote.head,
                  note: newNote.note,
                  completed: newNote.metadata?.completed
                }
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Error updating notes:', err);
      throw err;
    }
  }, [data, updateNoteMutation]);

  const deleteNoteBlock = useCallback(async (blockId) => {
    try {
      await deleteNoteBlockMutation({
        variables: { id: parseInt(blockId) }
      });
    } catch (err) {
      console.error('Error deleting note block:', err);
      throw err;
    }
  }, [deleteNoteBlockMutation]);

  // Note operations
  const createNote = useCallback(async (blockId, noteData) => {
    try {
      const result = await createNoteMutation({
        variables: {
          input: {
            blockId: parseInt(blockId),
            priority: noteData?.priority || 'medium',
            head: noteData?.head || 'New Todo Item',
            note: noteData?.note || ''
          }
        }
      });
      return result.data.createNote;
    } catch (err) {
      console.error('Error creating note:', err);
      throw err;
    }
  }, [createNoteMutation]);

  const updateNote = useCallback(async (blockId, noteId, updates) => {
    try {
      await updateNoteMutation({
        variables: {
          id: parseInt(noteId),
          input: {
            priority: updates.priority,
            head: updates.head,
            note: updates.note,
            completed: updates.completed
          }
        }
      });
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  }, [updateNoteMutation]);

  const deleteNote = useCallback(async (blockId, noteId) => {
    try {
      await deleteNoteMutation({
        variables: { id: parseInt(noteId) }
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  }, [deleteNoteMutation]);

  // Utility functions
  const exportData = useCallback(() => {
    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      appConfig: appData.appConfig,
      noteBlocks: appData.noteBlocks
    };
  }, [appData]);

  const importData = useCallback(async (importedData) => {
    // Import would require a custom mutation on the backend
    // This is a placeholder for now
    console.warn('Import functionality requires backend implementation');

    // You would need to implement a backend mutation that handles:
    // 1. Creating/updating appData
    // 2. Creating note blocks
    // 3. Creating notes for each block

    return false;
  }, []);

  return {
    // Data
    noteBlocks: appData.noteBlocks,
    appConfig: appData.appConfig,

    // Loading states
    loading,
    error,
    refetch,

    // App Config operations
    updateAppConfig,

    // Note Block operations
    createNoteBlock,
    updateNoteBlock,
    deleteNoteBlock,

    // Note operations
    createNote,
    updateNote,
    deleteNote,

    // Note List Operations
    updateNotes,

    // Utility operations
    exportData,
    importData
  };
}