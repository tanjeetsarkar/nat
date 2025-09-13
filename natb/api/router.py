from fastapi import APIRouter

from workspace_management.router import router as wm_router



api_router = APIRouter()

api_router.include_router(wm_router)