from fastapi import FastAPI
import strawberry
import uvicorn
from core.config import settings
from starlette.middleware.cors import CORSMiddleware
from api.router import api_router
from models import Base
from core.db import engine
from strawberry.tools import merge_types
from core.graphql_config import get_context
from workspace_management.schema import Query as worksp_query
from workspace_management.schema import Mutation as worksp_mutation
from strawberry.fastapi import GraphQLRouter


Base.metadata.create_all(engine, checkfirst=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


ComboQuery = merge_types(
    "ComboQuery",
    (worksp_query,)
)

ComboMutation = merge_types(
    "ComboMutation",
    (worksp_mutation,)
)

schema = strawberry.Schema(query=ComboQuery, mutation=ComboMutation)

graphql_app = GraphQLRouter(schema, context_getter=get_context)

app.include_router(graphql_app, prefix="/graph")


if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
