// ============================================================================
// main.go - Complete implementation with HTTP handlers
// ============================================================================
package main

import (
	"log"
	"net/http"

	"github.com/tanjeetsarkar/nat/database"
	"github.com/tanjeetsarkar/nat/handlers"
	"github.com/tanjeetsarkar/nat/repositories"

	"github.com/gorilla/mux"
)

func main() {
	// Initialize database
	db, err := database.NewDatabase("todo.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize repositories
	noteBlockRepo := repositories.NewNoteBlockRepository(db.Conn)
	noteRepo := repositories.NewNoteRepository(db.Conn)
	workspaceRepo := repositories.NewWorkspaceRepository(db.Conn, noteBlockRepo, noteRepo)

	repos := &repositories.Repositories{
		Workspace: workspaceRepo,
		NoteBlock: noteBlockRepo,
		Note:      noteRepo,
	}

	server := &handlers.Server{Repos: repos}

	// Set up router
	router := mux.NewRouter()

	// Enable CORS
	router.Use(corsMiddleware)

	// API routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Workspace routes
	api.HandleFunc("/workspaces", server.HandleGetWorkspaces).Methods("GET")
	api.HandleFunc("/workspaces", server.HandleCreateWorkspace).Methods("POST")
	api.HandleFunc("/workspaces/{id}", server.HandleGetWorkspace).Methods("GET")
	api.HandleFunc("/workspaces/{id}", server.HandleUpdateWorkspace).Methods("PUT")
	api.HandleFunc("/workspaces/{id}", server.HandleDeleteWorkspace).Methods("DELETE")
	api.HandleFunc("/workspaces/{id}/full", server.HandleGetWorkspaceWithHierarchy).Methods("GET")

	// Note block routes
	api.HandleFunc("/workspaces/{workspaceId}/noteblocks", server.HandleGetNoteBlocks).Methods("GET")
	api.HandleFunc("/workspaces/{workspaceId}/noteblocks", server.HandleCreateNoteBlock).Methods("POST")
	api.HandleFunc("/noteblocks/{id}", server.HandleGetNoteBlock).Methods("GET")
	api.HandleFunc("/noteblocks/{id}", server.HandleUpdateNoteBlock).Methods("PUT")
	api.HandleFunc("/noteblocks/{id}", server.HandleDeleteNoteBlock).Methods("DELETE")
	api.HandleFunc("/noteblocks/{id}/notes", server.HandleGetNotes).Methods("GET")

	// Note routes
	api.HandleFunc("/noteblocks/{noteBlockId}/notes", server.HandleCreateNote).Methods("POST")
	api.HandleFunc("/notes/{id}", server.HandleGetNote).Methods("GET")
	api.HandleFunc("/notes/{id}", server.HandleUpdateNote).Methods("PUT")
	api.HandleFunc("/notes/{id}", server.HandleDeleteNote).Methods("DELETE")
	api.HandleFunc("/notes/{id}/toggle", server.HandleToggleNoteCompleted).Methods("PATCH")

	// Filtering routes
	api.HandleFunc("/noteblocks/{noteBlockId}/notes/priority/{priority}", server.HandleGetNotesByPriority).Methods("GET")
	api.HandleFunc("/noteblocks/{noteBlockId}/notes/completed", server.HandleGetCompletedNotes).Methods("GET")
	api.HandleFunc("/noteblocks/{noteBlockId}/notes/pending", server.HandleGetPendingNotes).Methods("GET")

	// Import/Export routes
	api.HandleFunc("/export", server.HandleExportData).Methods("GET")
	api.HandleFunc("/import", server.HandleImportData).Methods("POST")

	// Health check
	router.HandleFunc("/health", server.HandleHealthCheck).Methods("GET")

	// Start server
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, router))
}

// Middleware for CORS
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
