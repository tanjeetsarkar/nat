package repositories

import (
	"context"

	"github.com/tanjeetsarkar/nat/models"
)

type WorkspaceRepository interface {
	Create(ctx context.Context, workspace *models.Workspace) error
	GetByID(ctx context.Context, id string) (*models.Workspace, error)
	GetAll(ctx context.Context) ([]models.Workspace, error)
	Update(ctx context.Context, workspace *models.Workspace) error
	Delete(ctx context.Context, id string) error
	GetWithFullHierarchy(ctx context.Context, id string) (*models.Workspace, error)
	ImportWorkspaces(ctx context.Context, workspaces []models.Workspace) error
	ExportAll(ctx context.Context) (*models.ExportData, error)
}

type NoteBlockRepository interface {
	Create(ctx context.Context, noteBlock *models.NoteBlock, workspaceID string) error
	GetByID(ctx context.Context, id int64) (*models.NoteBlock, error)
	GetByWorkspaceID(ctx context.Context, workspaceID string) ([]models.NoteBlock, error)
	Update(ctx context.Context, noteBlock *models.NoteBlock) error
	Delete(ctx context.Context, id int64) error
	GetWithNotes(ctx context.Context, id int64) (*models.NoteBlock, error)
}

type NoteRepository interface {
	Create(ctx context.Context, note *models.Note, noteBlockID int64) error
	GetByID(ctx context.Context, id int64) (*models.Note, error)
	GetByNoteBlockID(ctx context.Context, noteBlockID int64) ([]models.Note, error)
	Update(ctx context.Context, note *models.Note) error
	Delete(ctx context.Context, id int64) error
	ToggleCompleted(ctx context.Context, id int64) error
	GetByPriority(ctx context.Context, noteBlockID int64, priority string) ([]models.Note, error)
	GetCompleted(ctx context.Context, noteBlockID int64) ([]models.Note, error)
	GetPending(ctx context.Context, noteBlockID int64) ([]models.Note, error)
}

// Repository container
type Repositories struct {
	Workspace WorkspaceRepository
	NoteBlock NoteBlockRepository
	Note      NoteRepository
}
