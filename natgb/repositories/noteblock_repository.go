package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/tanjeetsarkar/nat/models"
)

type noteBlockRepository struct {
	db *sql.DB
}

func NewNoteBlockRepository(db *sql.DB) NoteBlockRepository {
	return &noteBlockRepository{db: db}
}

func (r *noteBlockRepository) Create(ctx context.Context, noteBlock *models.NoteBlock, workspaceID string) error {
	now := time.Now()

	// Set timestamps if not provided
	if noteBlock.Metadata.Created.IsZero() {
		noteBlock.Metadata.Created = now
	}
	if noteBlock.Metadata.Updated.IsZero() {
		noteBlock.Metadata.Updated = now
	}

	query := `INSERT INTO note_blocks (id, head, metadata_created, metadata_updated, workspace_id) 
			  VALUES (?, ?, ?, ?, ?) RETURNING id`

	var returnedID int64
	err := r.db.QueryRowContext(ctx, query,
		noteBlock.ID, noteBlock.Head, noteBlock.Metadata.Created, noteBlock.Metadata.Updated, workspaceID).Scan(&returnedID)

	if err != nil {
		return fmt.Errorf("failed to create note block: %w", err)
	}

	// If ID was 0, use the generated ID
	if noteBlock.ID == 0 {
		noteBlock.ID = returnedID
	}

	return nil
}

func (r *noteBlockRepository) GetByID(ctx context.Context, id int64) (*models.NoteBlock, error) {
	query := `SELECT id, head, metadata_created, metadata_updated 
			  FROM note_blocks WHERE id = ?`

	noteBlock := &models.NoteBlock{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&noteBlock.ID, &noteBlock.Head, &noteBlock.Metadata.Created, &noteBlock.Metadata.Updated,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("note block not found")
		}
		return nil, fmt.Errorf("failed to get note block: %w", err)
	}

	return noteBlock, nil
}

func (r *noteBlockRepository) GetByWorkspaceID(ctx context.Context, workspaceID string) ([]models.NoteBlock, error) {
	query := `SELECT id, head, metadata_created, metadata_updated 
			  FROM note_blocks WHERE workspace_id = ? ORDER BY id ASC`

	rows, err := r.db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get note blocks: %w", err)
	}
	defer rows.Close()

	var noteBlocks []models.NoteBlock
	for rows.Next() {
		var noteBlock models.NoteBlock
		err := rows.Scan(
			&noteBlock.ID, &noteBlock.Head, &noteBlock.Metadata.Created, &noteBlock.Metadata.Updated,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note block: %w", err)
		}
		noteBlocks = append(noteBlocks, noteBlock)
	}

	return noteBlocks, nil
}

func (r *noteBlockRepository) Update(ctx context.Context, noteBlock *models.NoteBlock) error {
	noteBlock.Metadata.Updated = time.Now()

	query := `UPDATE note_blocks SET head = ?, metadata_updated = ? WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, noteBlock.Head, noteBlock.Metadata.Updated, noteBlock.ID)
	if err != nil {
		return fmt.Errorf("failed to update note block: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note block not found")
	}

	return nil
}

func (r *noteBlockRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM note_blocks WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete note block: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note block not found")
	}

	return nil
}

func (r *noteBlockRepository) GetWithNotes(ctx context.Context, id int64) (*models.NoteBlock, error) {
	noteBlock, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Get associated notes - we'll need to implement this in the note repository
	// For now, return empty notes slice
	noteBlock.Notes = []models.Note{}

	return noteBlock, nil
}
