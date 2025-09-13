package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/tanjeetsarkar/nat/models"
)

type noteRepository struct {
	db *sql.DB
}

func NewNoteRepository(db *sql.DB) NoteRepository {
	return &noteRepository{db: db}
}

func (r *noteRepository) Create(ctx context.Context, note *models.Note, noteBlockID int64) error {
	now := time.Now()

	// Set timestamps if not provided
	if note.Metadata.Created.IsZero() {
		note.Metadata.Created = now
	}
	if note.Metadata.Updated.IsZero() {
		note.Metadata.Updated = now
	}

	// Set default completed status if not provided
	if note.Metadata.Completed == nil {
		completed := false
		note.Metadata.Completed = &completed
	}

	query := `INSERT INTO notes (id, priority, head, note, metadata_created, metadata_updated, metadata_completed, note_block_id) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`

	var returnedID int64
	err := r.db.QueryRowContext(ctx, query,
		note.ID, note.Priority, note.Head, note.Note,
		note.Metadata.Created, note.Metadata.Updated, *note.Metadata.Completed, noteBlockID).Scan(&returnedID)

	if err != nil {
		return fmt.Errorf("failed to create note: %w", err)
	}

	// If ID was 0, use the generated ID
	if note.ID == 0 {
		note.ID = returnedID
	}

	return nil
}

func (r *noteRepository) GetByID(ctx context.Context, id int64) (*models.Note, error) {
	query := `SELECT id, priority, head, note, metadata_created, metadata_updated, metadata_completed 
			  FROM notes WHERE id = ?`

	note := &models.Note{}
	var completed bool

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&note.ID, &note.Priority, &note.Head, &note.Note,
		&note.Metadata.Created, &note.Metadata.Updated, &completed,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("note not found")
		}
		return nil, fmt.Errorf("failed to get note: %w", err)
	}

	note.Metadata.Completed = &completed
	return note, nil
}

func (r *noteRepository) GetByNoteBlockID(ctx context.Context, noteBlockID int64) ([]models.Note, error) {
	query := `SELECT id, priority, head, note, metadata_created, metadata_updated, metadata_completed 
			  FROM notes WHERE note_block_id = ? ORDER BY id ASC`

	rows, err := r.db.QueryContext(ctx, query, noteBlockID)
	if err != nil {
		return nil, fmt.Errorf("failed to get notes: %w", err)
	}
	defer rows.Close()

	var notes []models.Note
	for rows.Next() {
		var note models.Note
		var completed bool

		err := rows.Scan(
			&note.ID, &note.Priority, &note.Head, &note.Note,
			&note.Metadata.Created, &note.Metadata.Updated, &completed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}

		note.Metadata.Completed = &completed
		notes = append(notes, note)
	}

	return notes, nil
}

func (r *noteRepository) Update(ctx context.Context, note *models.Note) error {
	note.Metadata.Updated = time.Now()

	query := `UPDATE notes SET priority = ?, head = ?, note = ?, metadata_updated = ?, metadata_completed = ? 
			  WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query,
		note.Priority, note.Head, note.Note, note.Metadata.Updated, *note.Metadata.Completed, note.ID)

	if err != nil {
		return fmt.Errorf("failed to update note: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note not found")
	}

	return nil
}

func (r *noteRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM notes WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete note: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note not found")
	}

	return nil
}

func (r *noteRepository) ToggleCompleted(ctx context.Context, id int64) error {
	query := `UPDATE notes SET metadata_completed = NOT metadata_completed, metadata_updated = ? WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to toggle completed: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note not found")
	}

	return nil
}

func (r *noteRepository) GetByPriority(ctx context.Context, noteBlockID int64, priority string) ([]models.Note, error) {
	query := `SELECT id, priority, head, note, metadata_created, metadata_updated, metadata_completed 
			  FROM notes WHERE note_block_id = ? AND priority = ? ORDER BY id ASC`

	return r.getNotesByCondition(ctx, query, noteBlockID, priority)
}

func (r *noteRepository) GetCompleted(ctx context.Context, noteBlockID int64) ([]models.Note, error) {
	query := `SELECT id, priority, head, note, metadata_created, metadata_updated, metadata_completed 
			  FROM notes WHERE note_block_id = ? AND metadata_completed = true ORDER BY id ASC`

	return r.getNotesByCondition(ctx, query, noteBlockID)
}

func (r *noteRepository) GetPending(ctx context.Context, noteBlockID int64) ([]models.Note, error) {
	query := `SELECT id, priority, head, note, metadata_created, metadata_updated, metadata_completed 
			  FROM notes WHERE note_block_id = ? AND metadata_completed = false ORDER BY id ASC`

	return r.getNotesByCondition(ctx, query, noteBlockID)
}

func (r *noteRepository) getNotesByCondition(ctx context.Context, query string, args ...interface{}) ([]models.Note, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get notes: %w", err)
	}
	defer rows.Close()

	var notes []models.Note
	for rows.Next() {
		var note models.Note
		var completed bool

		err := rows.Scan(
			&note.ID, &note.Priority, &note.Head, &note.Note,
			&note.Metadata.Created, &note.Metadata.Updated, &completed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}

		note.Metadata.Completed = &completed
		notes = append(notes, note)
	}

	return notes, nil
}
