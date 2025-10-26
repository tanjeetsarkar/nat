// src/graphql/queries.js
import { gql } from '@apollo/client';

// Queries
export const GET_WORKPLACES = gql`
  query GetWorkplaces {
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
      blocks {
        id
        head
        order
        metadata {
          created
          updated
          completed
        }
        notes {
          id
          priority
          note
          head
          order
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

export const GET_WORKPLACE = gql`
  query GetWorkplace($id: String!) {
    workplace(id: $id) {
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
        blocks {
          id
          head
          order
          metadata {
            created
            updated
          }
          notes {
            id
            priority
            head
            note
            order
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

// Workplace Mutations
export const CREATE_WORKPLACE = gql`
  mutation CreateWorkplace($input: CreateWorkPlaceInput!) {
    createWorkplace(input: $input) {
      id
      name
      created
      updated
    }
  }
`;

export const UPDATE_WORKPLACE = gql`
  mutation UpdateWorkplace($id: String!, $input: UpdateWorkPlaceInput!) {
    updateWorkplace(id: $id, input: $input) {
      id
      name
      updated
    }
  }
`;

export const DELETE_WORKPLACE = gql`
  mutation DeleteWorkplace($id: String!) {
    deleteWorkplace(id: $id)
  }
`;

// AppData Mutations
export const CREATE_APP_DATA = gql`
  mutation CreateAppData($input: CreateAppDataInput!) {
    createAppData(input: $input) {
      id
      workplaceId
      title
    }
  }
`;

export const UPDATE_APP_DATA = gql`
  mutation UpdateAppData($id: ID!, $input: UpdateAppDataInput!) {
    updateAppData(id: $id, input: $input) {
      id
      title
    }
  }
`;

// NoteBlock Mutations
export const CREATE_NOTE_BLOCK = gql`
  mutation CreateNoteBlock($input: CreateNoteBlockInput!) {
    createNoteBlock(input: $input) {
      id
      appId
      head
      order
      metadata {
        created
        updated
      }
    }
  }
`;

export const UPDATE_NOTE_BLOCK = gql`
  mutation UpdateNoteBlock($id: ID!, $input: UpdateNoteBlockInput!) {
    updateNoteBlock(id: $id, input: $input) {
      id
      head
      order
    }
  }
`;

export const DELETE_NOTE_BLOCK = gql`
  mutation DeleteNoteBlock($id: ID!) {
    deleteNoteBlock(id: $id)
  }
`;

// Note Mutations
export const CREATE_NOTE = gql`
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      blockId
      priority
      head
      note
      order
      metadata {
        created
        updated
        completed
      }
    }
  }
`;

export const UPDATE_NOTE = gql`
  mutation UpdateNote($id: ID!, $input: UpdateNoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      priority
      head
      note
      order
      metadata {
        completed
        updated
      }
    }
  }
`;

export const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`;

// Import/Export
export const IMPORT_WORKSPACES = gql`
  mutation ImportWorkspaces($input: ImportInput!) {
    importWorkspaces(input: $input) {
      id
      name
      created
      updated
    }
  }
`;