from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import include_routers


def create_app() -> FastAPI:
	app = FastAPI(title="F1 Race Analytics", version="0.1.0")

	app.add_middleware(
		CORSMiddleware,
		allow_origins=["*"],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	include_routers(app)

	@app.get("/health")
	async def health():
		return {"status": "ok"}

	return app


app = create_app()


