from fastapi import FastAPI
from .routers import telemetry, ml


def include_routers(app: FastAPI) -> None:
	app.include_router(telemetry.router)
	app.include_router(ml.router)



