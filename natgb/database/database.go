package database

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	Conn *sql.DB
}

func NewDatabase(dbPath string) (*Database, error) {
	conn, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db := &Database{Conn: conn}

	if err := db.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return db, nil
}

func (db *Database) createTables() error {
	queries := []string{
		// Workspaces table - matches frontend structure
		`CREATE TABLE IF NOT EXISTS workspaces (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			created DATETIME NOT NULL,
			last_modified DATETIME NOT NULL,
			app_config_title TEXT DEFAULT 'Simple Todo App',
			app_config_created DATETIME,
			app_config_updated DATETIME
		)`,

		// Note blocks table - belongs to workspace via app_id
		`CREATE TABLE IF NOT EXISTS note_blocks (
			id INTEGER PRIMARY KEY,
			head TEXT NOT NULL DEFAULT '',
			metadata_created DATETIME NOT NULL,
			metadata_updated DATETIME NOT NULL,
			workspace_id TEXT NOT NULL,
			FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
		)`,

		// Notes table - belongs to note_blocks
		`CREATE TABLE IF NOT EXISTS notes (
			id INTEGER PRIMARY KEY,
			priority TEXT DEFAULT 'medium',
			head TEXT NOT NULL,
			note TEXT DEFAULT '',
			metadata_created DATETIME NOT NULL,
			metadata_updated DATETIME NOT NULL,
			metadata_completed BOOLEAN DEFAULT FALSE,
			note_block_id INTEGER NOT NULL,
			FOREIGN KEY (note_block_id) REFERENCES note_blocks(id) ON DELETE CASCADE
		)`,
	}

	for _, query := range queries {
		if _, err := db.Conn.Exec(query); err != nil {
			return fmt.Errorf("failed to execute query: %w", err)
		}
	}

	return db.createIndexes()
}

func (db *Database) createIndexes() error {
	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_note_blocks_workspace ON note_blocks(workspace_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notes_note_block ON notes(note_block_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notes_priority ON notes(priority)`,
		`CREATE INDEX IF NOT EXISTS idx_notes_completed ON notes(metadata_completed)`,
	}

	for _, index := range indexes {
		if _, err := db.Conn.Exec(index); err != nil {
			return fmt.Errorf("failed to create index: %w", err)
		}
	}

	return nil
}

func (db *Database) Close() error {
	return db.Conn.Close()
}
