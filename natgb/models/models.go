package models

import "time"

// Note represents individual todo items
type Note struct {
	ID       int64    `json:"id" db:"id"`
	Priority string   `json:"priority" db:"priority"` // high, medium, low
	Head     string   `json:"head" db:"head"`         // Title/summary
	Note     string   `json:"note" db:"note"`         // Description/content
	Metadata Metadata `json:"metadata" db:"metadata"`
}

// NoteBlock represents a collection of notes (what frontend calls noteBlocks)
type NoteBlock struct {
	ID       int64    `json:"id" db:"id"`
	Head     string   `json:"head" db:"head"` // Title
	Metadata Metadata `json:"metadata" db:"metadata"`
	Notes    []Note   `json:"notes,omitempty"`
	AppID    string   `json:"-" db:"app_id"` // Hidden from JSON, used for DB relations
}

// AppConfig represents the app configuration within a workspace
type AppConfig struct {
	Title    string   `json:"title" db:"title"`
	Metadata Metadata `json:"metadata" db:"metadata"`
}

// AppData represents the data section of a workspace (renamed from App)
type AppData struct {
	NoteBlocks []NoteBlock `json:"noteBlocks" db:"note_blocks"`
	AppConfig  AppConfig   `json:"appConfig" db:"app_config"`
}

// Workspace represents the top-level container
type Workspace struct {
	ID           string    `json:"id" db:"id"` // String ID like "default" or "workspace_123"
	Name         string    `json:"name" db:"name"`
	Created      time.Time `json:"created" db:"created"`
	LastModified time.Time `json:"lastModified" db:"last_modified"`
	Data         AppData   `json:"data" db:"data"`
}

// Metadata represents the metadata structure used throughout
type Metadata struct {
	Created   time.Time `json:"created" db:"created"`
	Updated   time.Time `json:"updated" db:"updated"`
	Completed *bool     `json:"completed,omitempty" db:"completed"` // Only for notes
}

// ExportData represents the complete export structure
type ExportData struct {
	ExportDate time.Time   `json:"exportDate"`
	Version    string      `json:"version"`
	Workspaces []Workspace `json:"workspaces"`
}
