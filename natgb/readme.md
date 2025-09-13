# Todo Backend Setup Guide

## Prerequisites
- Go 1.19+ installed
- Git (optional)

## Quick Start

### 1. Create Project Structure
```bash
mkdir todo-backend
cd todo-backend

# Create package directories
mkdir models database repositories services handlers

# Initialize Go module
go mod init todo-backend
```

### 2. Install Dependencies
```bash
# SQLite driver
go get github.com/mattn/go-sqlite3

# HTTP router (Gorilla Mux)
go get github.com/gorilla/mux
```

### 3. Create go.mod File
```go
module todo-backend

go 1.21

require (
    github.com/gorilla/mux v1.8.0
    github.com/mattn/go-sqlite3 v1.14.17
)
```

### 4. Create Each File
Copy the code sections from the artifact into their respective files:

- `models/models.go`
- `database/database.go` 
- `repositories/interfaces.go`
- `repositories/workspace_repository.go`
- `repositories/app_repository.go`
- `repositories/noteblock_repository.go`
- `repositories/note_repository.go`
- `services/services.go`
- `handlers/handlers.go`
- `main.go`

### 5. Run the Server
```bash
go run main.go
```

## Workspaces:

- `GET /api/v1/workspaces` - List all workspaces
- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces/{id}` - Get workspace
- `PUT /api/v1/workspaces/{id}` - Update workspace
- `DELETE /api/v1/workspaces/{id}` - Delete workspace
- `GET /api/v1/workspaces/{id}/full` - Get workspace with all note blocks and notes

## Note Blocks:

- `GET /api/v1/workspaces/{workspaceId}/noteblocks` - List note blocks
- `POST /api/v1/workspaces/{workspaceId}/noteblocks` - Create note block
- `GET /api/v1/noteblocks/{id}` - Get note block
- `PUT /api/v1/noteblocks/{id}` - Update note block
- `DELETE /api/v1/noteblocks/{id}` - Delete note block
- `GET /api/v1/noteblocks/{id}/notes` - Get notes in a note block

## Notes:

- `POST /api/v1/noteblocks/{noteBlockId}/notes` - Create note
- `GET /api/v1/notes/{id}` - Get note
- `PUT /api/v1/notes/{id}` - Update note
- `DELETE /api/v1/notes/{id}` - Delete note
- `PATCH /api/v1/notes/{id}/toggle` - Toggle note completion

## Filtering:

- `GET /api/v1/noteblocks/{noteBlockId}/notes/priority/{priority}` - Filter by priority
- `GET /api/v1/noteblocks/{noteBlockId}/notes/completed` - Get completed notes
- `GET /api/v1/noteblocks/{noteBlockId}/notes/pending` - Get pending notes

## Import/Export:

- `GET /api/v1/export` - Export all data
- `POST /api/v1/import` - Import data

## Health Check:

- `GET /health` - Health check endpoint

## Example API Calls

### Create Workspace
```bash
curl -X POST http://localhost:8080/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Work Tasks", "description": "Professional todo items"}'
```

### Get Workspace with Full Hierarchy
```bash
curl http://localhost:8080/api/v1/workspaces/1
```

### Create App
```bash
curl -X POST http://localhost:8080/api/v1/apps \
  -H "Content-Type: application/json" \
  -d '{"name": "Project Alpha", "description": "Main project tasks", "workspace_id": 1, "position": 0}'
```

## Database Schema

The SQLite database will be created automatically with these tables:

- **workspaces** - Top-level containers
- **apps** - Belong to workspaces
- **note_blocks** - Belong to apps  
- **notes** - Individual todo items, belong to note_blocks

All tables include:
- Auto-increment IDs
- Created/updated timestamps
- Foreign key constraints
- Cascade deletes
- Position fields for ordering

## Testing

Test your setup by:

1. **Starting the server** - Should see "Server starting on :8080"
2. **Creating a workspace** - Use the curl example above
3. **Checking the database** - A `todo.db` file should be created
4. **Accessing the API** - Try GET requests to verify data

## Frontend Integration

Your Vite frontend can now:
- Replace local JSON storage with API calls
- Use the same data structure (models match your frontend)
- Import/export via the API endpoints
- Maintain the same user experience with persistent storage

## Next Steps

To extend the backend:
- Add authentication/authorization
- Implement full CRUD for all entities
- Add data validation
- Create backup/restore endpoints
- Add search functionality
- Implement real-time updates with WebSockets