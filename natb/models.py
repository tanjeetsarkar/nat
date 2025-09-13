from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship


class Base(DeclarativeBase):
    pass


class Note(Base):
    __tablename__ = "tbl_note"

    id: Mapped[int] = mapped_column(primary_key=True)
    block_id: Mapped[int] = mapped_column(ForeignKey("tbl_note_block.id"))
    priority: Mapped[Optional[str]] = mapped_column(default="medium")
    head: Mapped[Optional[str]]
    note: Mapped[Optional[str]]
    metadata_col: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        default=lambda: {
            "created": datetime.now(),
            "updated": datetime.now(),
            "completed": False,
        },
    )
    block: Mapped["NoteBlock"] = relationship(back_populates="note")


class NoteBlock(Base):
    __tablename__ = "tbl_note_block"

    id: Mapped[int] = mapped_column(primary_key=True)
    app_id: Mapped[int] = mapped_column(ForeignKey("tbl_app_data.id"))
    head: Mapped[str]
    metadata_col: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        default=lambda: {
            "created": datetime.now(),
            "updated": datetime.now(),
        },
    )
    notes: Mapped[List["Note"]] = relationship(back_populates="block")
    app_data: Mapped["AppData"] = relationship(back_populates="app")


class AppData(Base):
    __tablename__ = "tbl_app_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    worplace_id: Mapped[str] = mapped_column(ForeignKey("tbl_workplace.id"))
    title: Mapped[Optional[str]]
    metadata_col: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        default=lambda: {
            "created": datetime.now(),
            "updated": datetime.now(),
        },
    )
    blocks: Mapped[List["NoteBlock"]] = relationship(back_populates="app")
    workplace: Mapped["WorkPlace"] = relationship(back_populates="app_data")


class WorkPlace(Base):
    __tablename__ = "tbl_workplace"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[Optional[str]]
    created: Mapped[datetime] = mapped_column(default=datetime.now())
    updated: Mapped[datetime] = mapped_column(default=datetime.now())
    app_data: Mapped["AppData"] = relationship(back_populates="workplace")
