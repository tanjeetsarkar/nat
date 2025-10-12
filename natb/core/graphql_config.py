from fastapi import Depends

from core.db import get_async_db


async def get_context(db=Depends(get_async_db)):
    return {"session": db}
