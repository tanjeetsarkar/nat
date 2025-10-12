import { useCallback, useMemo, useState, useEffect } from "react";
import { gql } from '@apollo/client'
import { useQuery, useMutation } from "@apollo/client/react";

// GraphQL Queries
const GET_ALL_WORKPLACES = gql`
  query GetAllWorkplaces {
    workplaces {
      id
      name
      created
      updated
      appData {
        id
        title
        metadata {
          created
          updated
        }
      }
    }
  }
`;

// GraphQL Mutations
const CREATE_WORKPLACE = gql`
  mutation CreateWorkplace($input: CreateWorkplaceInput!) {
    createWorkplace(input: $input) {
      id
      name
      created
      updated
    }
  }
`;

const UPDATE_WORKPLACE = gql`
  mutation UpdateWorkplace($id: String!, $input: UpdateWorkplaceInput!) {
    updateWorkplace(id: $id, input: $input) {
      id
      name
      updated
    }
  }
`;

const DELETE_WORKPLACE = gql`
  mutation DeleteWorkplace($id: String!) {
    deleteWorkplace(id: $id)
  }
`;

const CREATE_APP_DATA = gql`
  mutation CreateAppData($input: CreateAppDataInput!) {
    createAppData(input: $input) {
      id
      workplaceId
      title
      metadata {
        created
        updated
      }
    }
  }
`;

const IMPORT_WORKSPACES = gql`
  mutation ImportWorkspaces($input: ImportWorkspacesInput!) {
    importWorkspaces(input: $input) {
      id
      name
      created
      updated
      appData {
        id
        title
        blocks {
          id
          head
          notes {
            id
            priority
            head
            note
            metadata {
              completed
            }
          }
        }
      }
    }
  }
`;

export function useWorkspaceManager() {
  // Local state for active workspace (persisted in localStorage)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem('activeWorkspaceId') || null;
  });

  // Fetch all workplaces
  const { data, loading, error, refetch } = useQuery(GET_ALL_WORKPLACES, {
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [createWorkplaceMutation] = useMutation(CREATE_WORKPLACE, {
    refetchQueries: [{ query: GET_ALL_WORKPLACES }],
    awaitRefetchQueries: true,
  });
  
  const [updateWorkplaceMutation] = useMutation(UPDATE_WORKPLACE);
  
  const [deleteWorkplaceMutation] = useMutation(DELETE_WORKPLACE, {
    refetchQueries: [{ query: GET_ALL_WORKPLACES }],
    awaitRefetchQueries: true,
  });

  const [createAppDataMutation] = useMutation(CREATE_APP_DATA, {
    refetchQueries: [{ query: GET_ALL_WORKPLACES }],
    awaitRefetchQueries: true,
  });

  const [importWorkspacesMutation] = useMutation(IMPORT_WORKSPACES, {
    refetchQueries: [{ query: GET_ALL_WORKPLACES }],
    awaitRefetchQueries: true,
  });

  // Memoized workspaces object
  const workspaces = useMemo(() => {
    if (!data?.workplaces) {
      return {
        list: [],
        active: activeWorkspaceId
      };
    }

    return {
      list: data.workplaces,
      active: activeWorkspaceId
    };
  }, [data, activeWorkspaceId]);

  // Auto-set active workspace if none is set or if current one doesn't exist
  useEffect(() => {
    if (!loading && data?.workplaces) {
      const workspaceExists = data.workplaces.some(ws => ws.id === activeWorkspaceId);
      
      // If no active workspace or active workspace doesn't exist, set to first one
      if (!activeWorkspaceId || !workspaceExists) {
        const firstWorkspace = data.workplaces[0];
        if (firstWorkspace) {
          setActiveWorkspaceId(firstWorkspace.id);
          localStorage.setItem('activeWorkspaceId', firstWorkspace.id);
        }
      }
    }
  }, [loading, data, activeWorkspaceId]);

  // Create workspace
  const createWorkspace = useCallback(async (name) => {
    const newId = `workspace_${Date.now()}`;
    
    try {
      // Create workplace
      await createWorkplaceMutation({
        variables: {
          input: {
            id: newId,
            name: name || 'New Workspace'
          }
        }
      });

      // Create associated app data
      await createAppDataMutation({
        variables: {
          input: {
            workplaceId: newId,
            title: 'Simple Todo App'
          }
        }
      });

      // Set as active workspace
      setActiveWorkspaceId(newId);
      localStorage.setItem('activeWorkspaceId', newId);

      return newId;
    } catch (err) {
      console.error('Error creating workspace:', err);
      throw err;
    }
  }, [createWorkplaceMutation, createAppDataMutation]);

  // Delete workspace
  const deleteWorkspace = useCallback(async (workspaceId) => {
    // Get fresh list from data instead of memoized workspaces
    const currentWorkspaces = data?.workplaces || [];
    
    if (currentWorkspaces.length <= 1) {
      alert('Cannot delete the last workspace');
      return false;
    }

    try {
      await deleteWorkplaceMutation({
        variables: { id: workspaceId }
      });

      // If deleting active workspace, switch to first remaining workspace
      if (activeWorkspaceId === workspaceId) {
        const remainingWorkspaces = currentWorkspaces.filter(ws => ws.id !== workspaceId);
        const newActive = remainingWorkspaces[0]?.id;
        if (newActive) {
          setActiveWorkspaceId(newActive);
          localStorage.setItem('activeWorkspaceId', newActive);
        }
      }

      return true;
    } catch (err) {
      console.error('Error deleting workspace:', err);
      throw err;
    }
  }, [data, activeWorkspaceId, deleteWorkplaceMutation]);

  // Switch workspace
  const switchWorkspace = useCallback((workspaceId) => {
    setActiveWorkspaceId(workspaceId);
    localStorage.setItem('activeWorkspaceId', workspaceId);
  }, []);

  // Update workspace
  const updateWorkspace = useCallback(async (workspaceId, updates) => {
    try {
      await updateWorkplaceMutation({
        variables: {
          id: workspaceId,
          input: updates
        }
      });
    } catch (err) {
      console.error('Error updating workspace:', err);
      throw err;
    }
  }, [updateWorkplaceMutation]);

  // Export all workspaces (basic version - doesn't include full note data)
  const exportAllWorkspaces = useCallback(() => {
    const currentWorkspaces = data?.workplaces || [];
    
    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      workspaces: currentWorkspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        created: ws.created,
        lastModified: ws.updated,
        data: ws.appData ? {
          appConfig: {
            title: ws.appData.title,
            metadata: ws.appData.metadata
          },
          noteBlocks: [] // Would need to fetch full data for complete export
        } : {}
      }))
    };
  }, [data]);

  // Import all workspaces
  const importAllWorkspaces = useCallback(async (importData) => {
    if (!importData.workspaces || !Array.isArray(importData.workspaces)) {
      console.error('Invalid import data format');
      return false;
    }

    try {
      const result = await importWorkspacesMutation({
        variables: {
          input: importData
        }
      });

      // Set first imported workspace as active
      if (result.data?.importWorkspaces?.length > 0) {
        const firstWorkspaceId = result.data.importWorkspaces[0].id;
        setActiveWorkspaceId(firstWorkspaceId);
        localStorage.setItem('activeWorkspaceId', firstWorkspaceId);
      }

      return true;
    } catch (err) {
      console.error('Error importing workspaces:', err);
      return false;
    }
  }, [importWorkspacesMutation]);

  return {
    workspaces,
    loading,
    error,
    refetch,
    createWorkspace,
    deleteWorkspace,
    switchWorkspace,
    updateWorkspace,
    exportAllWorkspaces,
    importAllWorkspaces,
  };
}