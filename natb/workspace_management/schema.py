import strawberry
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models import AppData, Note, NoteBlock, WorkPlace


# Strawberry Types
@strawberry.type
class MetadataType:
    created: datetime
    updated: datetime
    completed: Optional[bool] = None


@strawberry.type
class NoteType:
    id: strawberry.ID
    block_id: strawberry.ID
    priority: Optional[str]
    head: Optional[str]
    note: Optional[str]
    # metadata: MetadataType

    @strawberry.field
    def metadata(self) -> MetadataType:
        m = getattr(self, "metadata_col", {})

        return MetadataType(
            created=datetime.fromisoformat(m.get("created")),
            updated=datetime.fromisoformat(m.get("updated")),
            completed=m.get("completed"),
        )

    @strawberry.field
    async def block(self, info) -> "NoteBlockType":
        """Resolver to fetch the parent NoteBlock"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(
            select(NoteBlock).where(NoteBlock.id == self.block_id)
        )
        return result.scalar_one()


@strawberry.type
class NoteBlockType:
    id: strawberry.ID
    app_id: strawberry.ID
    head: str
    # metadata: MetadataType

    @strawberry.field
    def metadata(self) -> MetadataType:
        m = getattr(self, "metadata_col", {})
        return MetadataType(
            created=datetime.fromisoformat(m.get("created")),
            updated=datetime.fromisoformat(m.get("updated")),
        )

    @strawberry.field
    async def notes(self, info) -> List[NoteType]:
        """Resolver to fetch all Notes in this NoteBlock"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(Note).where(Note.block_id == self.id))
        return result.scalars().all()

    @strawberry.field
    async def app_data(self, info) -> "AppDataType":
        """Resolver to fetch the parent AppData"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(AppData).where(AppData.id == self.app_id))
        return result.scalar_one()


@strawberry.type
class AppDataType:
    id: strawberry.ID
    workplace_id: str
    title: Optional[str]
    # metadata: MetadataType

    @strawberry.field
    def metadata(self) -> MetadataType:
        m = getattr(self, "metadata_col", {})
        return MetadataType(
            created=datetime.fromisoformat(m.get("created")),
            updated=datetime.fromisoformat(m.get("updated")),
        )

    @strawberry.field
    async def blocks(self, info) -> List[NoteBlockType]:
        """Resolver to fetch all NoteBlocks in this AppData"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(
            select(NoteBlock).where(NoteBlock.app_id == self.id)
        )
        return result.scalars().all()

    @strawberry.field
    async def workplace(self, info) -> "WorkPlaceType":
        """Resolver to fetch the parent WorkPlace"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(
            select(WorkPlace).where(WorkPlace.id == self.workplace_id)
        )
        return result.scalar_one()


@strawberry.type
class WorkPlaceType:
    id: str
    name: Optional[str]
    created: datetime
    updated: datetime

    @strawberry.field
    async def app_data(self, info) -> List[AppDataType]:
        """Resolver to fetch all AppData in this WorkPlace"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(
            select(AppData).where(AppData.workplace_id == self.id)
        )
        return result.scalars().all()


# Input Types for Mutations
@strawberry.input
class CreateWorkPlaceInput:
    id: str
    name: Optional[str] = None


@strawberry.input
class UpdateWorkPlaceInput:
    name: Optional[str] = None


@strawberry.input
class CreateAppDataInput:
    workplace_id: str
    title: Optional[str] = None


@strawberry.input
class UpdateAppDataInput:
    title: Optional[str] = None


@strawberry.input
class CreateNoteBlockInput:
    app_id: strawberry.ID
    head: str


@strawberry.input
class UpdateNoteBlockInput:
    head: Optional[str] = None


@strawberry.input
class CreateNoteInput:
    block_id: strawberry.ID
    priority: Optional[str] = "medium"
    head: Optional[str] = None
    note: Optional[str] = None


@strawberry.input
class UpdateNoteInput:
    priority: Optional[str] = None
    head: Optional[str] = None
    note: Optional[str] = None
    completed: Optional[bool] = None


# Import Input Types
@strawberry.input
class ImportMetadataInput:
    created: str
    updated: str
    completed: Optional[bool] = None


@strawberry.input
class ImportNoteInput:
    id: strawberry.ID
    priority: str
    head: Optional[str]
    note: Optional[str]
    metadata: ImportMetadataInput


@strawberry.input
class ImportNoteBlockInput:
    id: strawberry.ID
    head: str
    metadata: ImportMetadataInput
    notes: List[ImportNoteInput]


@strawberry.input
class ImportAppConfigInput:
    title: str
    metadata: ImportMetadataInput


@strawberry.input
class ImportDataInput:
    note_blocks: List[ImportNoteBlockInput] = strawberry.field(name="noteBlocks")
    app_config: ImportAppConfigInput = strawberry.field(name="appConfig")


@strawberry.input
class ImportWorkspaceInput:
    id: str
    name: str
    created: str
    last_modified: str = strawberry.field(name="lastModified")
    data: ImportDataInput


@strawberry.input
class ImportInput:
    export_date: str = strawberry.field(name="exportDate")
    version: str
    workspaces: List[ImportWorkspaceInput]


# Queries
@strawberry.type
class Query:
    @strawberry.field
    async def workplace(self, info, id: str) -> Optional[WorkPlaceType]:
        """Get a single workplace by ID"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(WorkPlace).where(WorkPlace.id == id))
        return result.scalar_one_or_none()

    @strawberry.field
    async def workplaces(self, info) -> List[WorkPlaceType]:
        """Get all workplaces"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(WorkPlace))
        return result.scalars().all()

    @strawberry.field
    async def app_data(self, info, id: strawberry.ID) -> Optional[AppDataType]:
        """Get a single app data by ID"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(AppData).where(AppData.id == id))
        return result.scalar_one_or_none()

    @strawberry.field
    async def note_block(self, info, id: strawberry.ID) -> Optional[NoteBlockType]:
        """Get a single note block by ID"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(NoteBlock).where(NoteBlock.id == id))
        return result.scalar_one_or_none()

    @strawberry.field
    async def note(self, info, id: strawberry.ID) -> Optional[NoteType]:
        """Get a single note by ID"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(Note).where(Note.id == id))
        return result.scalar_one_or_none()

    @strawberry.field
    async def notes_by_block(self, info, block_id: strawberry.ID) -> List[NoteType]:
        """Get all notes in a specific block"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(Note).where(Note.block_id == block_id))
        return result.scalars().all()


# Mutations
@strawberry.type
class Mutation:
    # WorkPlace Mutations
    @strawberry.mutation
    async def create_workplace(
        self, info, input: CreateWorkPlaceInput
    ) -> WorkPlaceType:
        """Create a new workplace"""
        session: AsyncSession = info.context["session"]
        workplace = WorkPlace(
            id=input.id, name=input.name, created=datetime.now(), updated=datetime.now()
        )
        session.add(workplace)
        await session.commit()
        await session.refresh(workplace)
        return workplace

    @strawberry.mutation
    async def update_workplace(
        self, info, id: str, input: UpdateWorkPlaceInput
    ) -> Optional[WorkPlaceType]:
        """Update an existing workplace"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(WorkPlace).where(WorkPlace.id == id))
        workplace = result.scalar_one_or_none()

        if not workplace:
            return None

        if input.name is not None:
            workplace.name = input.name
        workplace.updated = datetime.now()

        await session.commit()
        await session.refresh(workplace)
        return workplace

    @strawberry.mutation
    async def delete_workplace(self, info, id: str) -> bool:
        """Delete a workplace"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(WorkPlace).where(WorkPlace.id == id))
        workplace = result.scalar_one_or_none()

        if not workplace:
            return False

        await session.delete(workplace)
        await session.commit()
        return True

    # AppData Mutations
    @strawberry.mutation
    async def create_app_data(self, info, input: CreateAppDataInput) -> AppDataType:
        """Create new app data"""
        session: AsyncSession = info.context["session"]
        app_data = AppData(
            workplace_id=input.workplace_id,
            title=input.title,
            metadata_col={
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat(),
            },
        )
        session.add(app_data)
        await session.commit()
        await session.refresh(app_data)
        return app_data

    @strawberry.mutation
    async def update_app_data(
        self, info, id: strawberry.ID, input: UpdateAppDataInput
    ) -> Optional[AppDataType]:
        """Update existing app data"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(AppData).where(AppData.id == id))
        app_data = result.scalar_one_or_none()

        if not app_data:
            return None

        if input.title is not None:
            app_data.title = input.title
        app_data.metadata_col["updated"] = datetime.now()

        await session.commit()
        await session.refresh(app_data)
        return app_data

    @strawberry.mutation
    async def delete_app_data(self, info, id: strawberry.ID) -> bool:
        """Delete app data"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(AppData).where(AppData.id == id))
        app_data = result.scalar_one_or_none()

        if not app_data:
            return False

        await session.delete(app_data)
        await session.commit()
        return True

    # NoteBlock Mutations
    @strawberry.mutation
    async def create_note_block(
        self, info, input: CreateNoteBlockInput
    ) -> NoteBlockType:
        """Create a new note block"""
        session: AsyncSession = info.context["session"]
        note_block = NoteBlock(
            app_id=input.app_id,
            head=input.head,
            metadata_col={
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat(),
            },
        )
        session.add(note_block)
        await session.commit()
        await session.refresh(note_block)
        return note_block

    @strawberry.mutation
    async def update_note_block(
        self, info, id: strawberry.ID, input: UpdateNoteBlockInput
    ) -> Optional[NoteBlockType]:
        """Update an existing note block"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(NoteBlock).where(NoteBlock.id == id))
        note_block = result.scalar_one_or_none()

        if not note_block:
            return None

        if input.head is not None:
            note_block.head = input.head
        note_block.metadata_col["updated"] = datetime.now()

        await session.commit()
        await session.refresh(note_block)
        return note_block

    @strawberry.mutation
    async def delete_note_block(self, info, id: strawberry.ID) -> bool:
        """Delete a note block"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(NoteBlock).where(NoteBlock.id == id))
        note_block = result.scalar_one_or_none()

        if not note_block:
            return False

        await session.delete(note_block)
        await session.commit()
        return True

    # Note Mutations
    @strawberry.mutation
    async def create_note(self, info, input: CreateNoteInput) -> NoteType:
        """Create a new note"""
        session: AsyncSession = info.context["session"]
        note = Note(
            block_id=input.block_id,
            priority=input.priority,
            head=input.head,
            note=input.note,
            metadata_col={
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat(),
                "completed": False,
            },
        )
        session.add(note)
        await session.commit()
        await session.refresh(note)
        return note

    @strawberry.mutation
    async def update_note(
        self, info, id: strawberry.ID, input: UpdateNoteInput
    ) -> Optional[NoteType]:
        """Update an existing note"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(Note).where(Note.id == id))
        note = result.scalar_one_or_none()

        if not note:
            return None

        if input.priority is not None:
            note.priority = input.priority
        if input.head is not None:
            note.head = input.head
        if input.note is not None:
            note.note = input.note
        if input.completed is not None:
            note.metadata_col["completed"] = input.completed

        note.metadata_col["updated"] = datetime.now()

        await session.commit()
        await session.refresh(note)
        return note

    @strawberry.mutation
    async def delete_note(self, info, id: strawberry.ID) -> bool:
        """Delete a note"""
        session: AsyncSession = info.context["session"]
        result = await session.execute(select(Note).where(Note.id == id))
        note = result.scalar_one_or_none()

        if not note:
            return False

        await session.delete(note)
        await session.commit()
        return True

    # Import Mutation
    @strawberry.mutation
    async def import_workspaces(self, info, input: ImportInput) -> List[WorkPlaceType]:
        """Import workspaces from JSON export"""
        session: AsyncSession = info.context["session"]
        imported_workplaces = []

        for workspace_input in input.workspaces:
            # Check if workplace already exists
            result = await session.execute(
                select(WorkPlace).where(WorkPlace.id == workspace_input.id)
            )
            existing_workplace = result.scalar_one_or_none()

            if existing_workplace:
                # Update existing workplace
                workplace = existing_workplace
                workplace.name = workspace_input.name
                workplace.updated = datetime.fromisoformat(
                    workspace_input.last_modified.replace("Z", "+00:00")
                )
            else:
                # Create new workplace
                workplace = WorkPlace(
                    id=workspace_input.id,
                    name=workspace_input.name,
                    created=datetime.fromisoformat(
                        workspace_input.created.replace("Z", "+00:00")
                    ),
                    updated=datetime.fromisoformat(
                        workspace_input.last_modified.replace("Z", "+00:00")
                    ),
                )
                session.add(workplace)

            # Flush to get workplace ID available for relationships
            await session.flush()

            # Create or update AppData
            result = await session.execute(
                select(AppData).where(AppData.workplace_id == workplace.id)
            )
            existing_app_data = result.scalar_one_or_none()

            if existing_app_data:
                app_data = existing_app_data
                app_data.title = workspace_input.data.app_config.title
                app_data.metadata_col = {
                    "created": workspace_input.data.app_config.metadata.created,
                    "updated": workspace_input.data.app_config.metadata.updated,
                }
            else:
                app_data = AppData(
                    workplace_id=workplace.id,
                    title=workspace_input.data.app_config.title,
                    metadata_col={
                        "created": workspace_input.data.app_config.metadata.created,
                        "updated": workspace_input.data.app_config.metadata.updated,
                    },
                )
                session.add(app_data)

            await session.flush()

            # Process NoteBlocks
            for block_input in workspace_input.data.note_blocks:
                # Check if note block exists
                result = await session.execute(
                    select(NoteBlock).where(
                        NoteBlock.id == int(block_input.id),
                        NoteBlock.app_id == app_data.id,
                    )
                )
                existing_block = result.scalar_one_or_none()

                if existing_block:
                    note_block = existing_block
                    note_block.head = block_input.head
                    note_block.metadata_col = {
                        "created": block_input.metadata.created,
                        "updated": block_input.metadata.updated,
                    }
                else:
                    note_block = NoteBlock(
                        id=int(block_input.id),
                        app_id=app_data.id,
                        head=block_input.head,
                        metadata_col={
                            "created": block_input.metadata.created,
                            "updated": block_input.metadata.updated,
                        },
                    )
                    session.add(note_block)

                await session.flush()

                # Process Notes
                for note_input in block_input.notes:
                    # Check if note exists
                    result = await session.execute(
                        select(Note).where(
                            Note.id == int(note_input.id),
                            Note.block_id == note_block.id,
                        )
                    )
                    existing_note = result.scalar_one_or_none()

                    if existing_note:
                        note = existing_note
                        note.priority = note_input.priority
                        note.head = note_input.head
                        note.note = note_input.note
                        note.metadata_col = {
                            "created": note_input.metadata.created,
                            "updated": note_input.metadata.updated,
                            "completed": note_input.metadata.completed or False,
                        }
                    else:
                        note = Note(
                            id=int(note_input.id),
                            block_id=note_block.id,
                            priority=note_input.priority,
                            head=note_input.head,
                            note=note_input.note,
                            metadata_col={
                                "created": note_input.metadata.created,
                                "updated": note_input.metadata.updated,
                                "completed": note_input.metadata.completed or False,
                            },
                        )
                        session.add(note)

            imported_workplaces.append(workplace)

        await session.commit()

        # Refresh all workplaces to get updated data
        for workplace in imported_workplaces:
            await session.refresh(workplace)

        return imported_workplaces
