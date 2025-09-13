package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/tanjeetsarkar/nat/models"
	"github.com/tanjeetsarkar/nat/repositories"
)

type Server struct {
	Repos *repositories.Repositories
}

// ============================================================================
// Workspace Handlers
// ============================================================================

func (s *Server) HandleGetWorkspaces(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	workspaces, err := s.Repos.Workspace.GetAll(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get workspaces: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workspaces)
}

func (s *Server) HandleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var workspace models.Workspace
	if err := json.NewDecoder(r.Body).Decode(&workspace); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.Workspace.Create(ctx, &workspace); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create workspace: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(workspace)
}

func (s *Server) HandleGetWorkspace(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	ctx := context.Background()
	workspace, err := s.Repos.Workspace.GetByID(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Workspace not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get workspace: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workspace)
}

func (s *Server) HandleGetWorkspaceWithHierarchy(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	ctx := context.Background()
	workspace, err := s.Repos.Workspace.GetWithFullHierarchy(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Workspace not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get workspace: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workspace)
}

func (s *Server) HandleUpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var workspace models.Workspace
	if err := json.NewDecoder(r.Body).Decode(&workspace); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	workspace.ID = id // Ensure ID matches the URL parameter

	ctx := context.Background()
	if err := s.Repos.Workspace.Update(ctx, &workspace); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Workspace not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to update workspace: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workspace)
}

func (s *Server) HandleDeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	ctx := context.Background()
	if err := s.Repos.Workspace.Delete(ctx, id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Workspace not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to delete workspace: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ============================================================================
// Note Block Handlers
// ============================================================================

func (s *Server) HandleGetNoteBlocks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	workspaceID := vars["workspaceId"]

	ctx := context.Background()
	noteBlocks, err := s.Repos.NoteBlock.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get note blocks: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(noteBlocks)
}

func (s *Server) HandleCreateNoteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	workspaceID := vars["workspaceId"]

	var noteBlock models.NoteBlock
	if err := json.NewDecoder(r.Body).Decode(&noteBlock); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.NoteBlock.Create(ctx, &noteBlock, workspaceID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create note block: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(noteBlock)
}

func (s *Server) HandleGetNoteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	noteBlock, err := s.Repos.NoteBlock.GetByID(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note block not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get note block: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(noteBlock)
}

func (s *Server) HandleUpdateNoteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	var noteBlock models.NoteBlock
	if err := json.NewDecoder(r.Body).Decode(&noteBlock); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	noteBlock.ID = id // Ensure ID matches the URL parameter

	ctx := context.Background()
	if err := s.Repos.NoteBlock.Update(ctx, &noteBlock); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note block not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to update note block: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(noteBlock)
}

func (s *Server) HandleDeleteNoteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.NoteBlock.Delete(ctx, id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note block not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to delete note block: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) HandleGetNotes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	notes, err := s.Repos.Note.GetByNoteBlockID(ctx, id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get notes: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

// ============================================================================
// Note Handlers
// ============================================================================

func (s *Server) HandleCreateNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	noteBlockIDStr := vars["noteBlockId"]

	noteBlockID, err := strconv.ParseInt(noteBlockIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	var note models.Note
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.Note.Create(ctx, &note, noteBlockID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create note: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(note)
}

func (s *Server) HandleGetNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	note, err := s.Repos.Note.GetByID(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get note: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func (s *Server) HandleUpdateNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	var note models.Note
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	note.ID = id // Ensure ID matches the URL parameter

	ctx := context.Background()
	if err := s.Repos.Note.Update(ctx, &note); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to update note: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func (s *Server) HandleDeleteNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.Note.Delete(ctx, id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to delete note: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) HandleToggleNoteCompleted(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.Note.ToggleCompleted(ctx, id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Note not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to toggle note completion: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Return the updated note
	note, err := s.Repos.Note.GetByID(ctx, id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get updated note: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

// ============================================================================
// Filtering Handlers
// ============================================================================

func (s *Server) HandleGetNotesByPriority(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	noteBlockIDStr := vars["noteBlockId"]
	priority := vars["priority"]

	noteBlockID, err := strconv.ParseInt(noteBlockIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	notes, err := s.Repos.Note.GetByPriority(ctx, noteBlockID, priority)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get notes by priority: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

func (s *Server) HandleGetCompletedNotes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	noteBlockIDStr := vars["noteBlockId"]

	noteBlockID, err := strconv.ParseInt(noteBlockIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	notes, err := s.Repos.Note.GetCompleted(ctx, noteBlockID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get completed notes: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

func (s *Server) HandleGetPendingNotes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	noteBlockIDStr := vars["noteBlockId"]

	noteBlockID, err := strconv.ParseInt(noteBlockIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid note block ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	notes, err := s.Repos.Note.GetPending(ctx, noteBlockID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get pending notes: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

// ============================================================================
// Import/Export Handlers
// ============================================================================

func (s *Server) HandleExportData(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	exportData, err := s.Repos.Workspace.ExportAll(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to export data: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=todo-export-%s.json",
		time.Now().Format("2006-01-02-15-04-05")))
	json.NewEncoder(w).Encode(exportData)
}

func (s *Server) HandleImportData(w http.ResponseWriter, r *http.Request) {
	var importData models.ExportData
	if err := json.NewDecoder(r.Body).Decode(&importData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := s.Repos.Workspace.ImportWorkspaces(ctx, importData.Workspaces); err != nil {
		http.Error(w, fmt.Sprintf("Failed to import data: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":             "Data imported successfully",
		"imported_workspaces": len(importData.Workspaces),
	})
}

// ============================================================================
// Health Check Handler
// ============================================================================

func (s *Server) HandleHealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "todo-backend",
	})
}
