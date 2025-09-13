from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    PROJECT_NAME: str = "Workspace"
    LOCAL_DB: str = "workspace.db"


settings = Settings()