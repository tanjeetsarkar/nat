package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/tanjeetsarkar/nat/models"
)

type workspaceRepository struct {
	db            *sql.DB
	noteBlockRepo NoteBlockRepository
	noteRepo      NoteRepository
}

func NewWorkspaceRepository(db *sql.DB, noteBlockRepo NoteBlockRepository, noteRepo NoteRepository) WorkspaceRepository {
	return &workspaceRepository{
		db:            db,
		noteBlockRepo: noteBlockRepo,
		noteRepo:      noteRepo,
	}
}

func (r *workspaceRepository) Create(ctx context.Context, workspace *models.Workspace) error {
	now := time.Now()
	workspace.Created = now
	workspace.LastModified = now

	// Set default app config if not provided
	if workspace.Data.AppConfig.Title == "" {
		workspace.Data.AppConfig.Title = "Simple Todo App"
		workspace.Data.AppConfig.Metadata.Created = now
		workspace.Data.AppConfig.Metadata.Updated = now
	}

	query := `INSERT INTO workspaces (id, name, created, last_modified, app_config_title, app_config_created, app_config_updated) 
			  VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		workspace.ID, workspace.Name, workspace.Created, workspace.LastModified,
		workspace.Data.AppConfig.Title, workspace.Data.AppConfig.Metadata.Created, workspace.Data.AppConfig.Metadata.Updated)

	if err != nil {
		return fmt.Errorf("failed to create workspace: %w", err)
	}

	// Create note blocks if provided
	for _, noteBlock := range workspace.Data.NoteBlocks {
		if err := r.noteBlockRepo.Create(ctx, &noteBlock, workspace.ID); err != nil {
			return fmt.Errorf("failed to create note block: %w", err)
		}
	}

	return nil
}

func (r *workspaceRepository) GetByID(ctx context.Context, id string) (*models.Workspace, error) {
	query := `SELECT id, name, created, last_modified, app_config_title, app_config_created, app_config_updated 
			  FROM workspaces WHERE id = ?`

	workspace := &models.Workspace{}
	var appConfigCreated, appConfigUpdated sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&workspace.ID, &workspace.Name, &workspace.Created, &workspace.LastModified,
		&workspace.Data.AppConfig.Title, &appConfigCreated, &appConfigUpdated,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("workspace not found")
		}
		return nil, fmt.Errorf("failed to get workspace: %w", err)
	}

	// Handle nullable timestamps
	if appConfigCreated.Valid {
		workspace.Data.AppConfig.Metadata.Created = appConfigCreated.Time
	}
	if appConfigUpdated.Valid {
		workspace.Data.AppConfig.Metadata.Updated = appConfigUpdated.Time
	}

	return workspace, nil
}

func (r *workspaceRepository) GetAll(ctx context.Context) ([]models.Workspace, error) {
	query := `SELECT id, name, created, last_modified, app_config_title, app_config_created, app_config_updated 
			  FROM workspaces ORDER BY created ASC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get workspaces: %w", err)
	}
	defer rows.Close()

	var workspaces []models.Workspace
	for rows.Next() {
		var workspace models.Workspace
		var appConfigCreated, appConfigUpdated sql.NullTime

		err := rows.Scan(
			&workspace.ID, &workspace.Name, &workspace.Created, &workspace.LastModified,
			&workspace.Data.AppConfig.Title, &appConfigCreated, &appConfigUpdated,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan workspace: %w", err)
		}

		// Handle nullable timestamps
		if appConfigCreated.Valid {
			workspace.Data.AppConfig.Metadata.Created = appConfigCreated.Time
		}
		if appConfigUpdated.Valid {
			workspace.Data.AppConfig.Metadata.Updated = appConfigUpdated.Time
		}

		workspaces = append(workspaces, workspace)
	}

	return workspaces, nil
}

func (r *workspaceRepository) Update(ctx context.Context, workspace *models.Workspace) error {
	workspace.LastModified = time.Now()
	workspace.Data.AppConfig.Metadata.Updated = workspace.LastModified

	query := `UPDATE workspaces SET name = ?, last_modified = ?, app_config_title = ?, app_config_updated = ? 
			  WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query,
		workspace.Name, workspace.LastModified,
		workspace.Data.AppConfig.Title, workspace.Data.AppConfig.Metadata.Updated,
		workspace.ID)

	if err != nil {
		return fmt.Errorf("failed to update workspace: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("workspace not found")
	}

	return nil
}

func (r *workspaceRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM workspaces WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete workspace: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("workspace not found")
	}

	return nil
}

func (r *workspaceRepository) GetWithFullHierarchy(ctx context.Context, id string) (*models.Workspace, error) {
	// Get workspace first
	workspace, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Get note blocks with notes
	noteBlocks, err := r.noteBlockRepo.GetByWorkspaceID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Load notes for each note block
	for i := range noteBlocks {
		notes, err := r.noteRepo.GetByNoteBlockID(ctx, noteBlocks[i].ID)
		if err != nil {
			return nil, err
		}
		noteBlocks[i].Notes = notes
	}

	workspace.Data.NoteBlocks = noteBlocks
	return workspace, nil
}

func (r *workspaceRepository) ImportWorkspaces(ctx context.Context, workspaces []models.Workspace) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, workspace := range workspaces {
		if err := r.Create(ctx, &workspace); err != nil {
			return fmt.Errorf("failed to import workspace %s: %w", workspace.ID, err)
		}
	}

	return tx.Commit()
}

func (r *workspaceRepository) ExportAll(ctx context.Context) (*models.ExportData, error) {
	workspaces, err := r.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	// Load full hierarchy for each workspace
	for i := range workspaces {
		fullWorkspace, err := r.GetWithFullHierarchy(ctx, workspaces[i].ID)
		if err != nil {
			return nil, err
		}
		workspaces[i] = *fullWorkspace
	}

	return &models.ExportData{
		ExportDate: time.Now(),
		Version:    "1.0",
		Workspaces: workspaces,
	}, nil
}
