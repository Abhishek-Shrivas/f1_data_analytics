from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.get("/lap-times")
async def get_lap_times(
	season: int = Query(..., ge=2000),
	round: int = Query(..., ge=1),
	driver: str = Query(..., min_length=1),
):
	# Placeholder response to be replaced with FastF1/Ergast ingestion
	return {
		"season": season,
		"round": round,
		"driver": driver.upper(),
		"laps": [
			{"lap": 1, "time_ms": 92000, "sectors_ms": [30000, 31000, 31000]},
			{"lap": 2, "time_ms": 91500, "sectors_ms": [29900, 30800, 30800]},
		],
	}


@router.get("/engine-stats")
async def get_engine_stats(
	season: int = Query(..., ge=2000),
	round: int = Query(..., ge=1),
	driver: str = Query(..., min_length=1),
	laps: Optional[List[int]] = Query(None),
):
	return {
		"season": season,
		"round": round,
		"driver": driver.upper(),
		"samples": [
			{"t": 0.0, "speed": 120.0, "throttle": 0.8, "brake": 0.0, "rpm": 12000, "gear": 7},
			{"t": 0.1, "speed": 121.5, "throttle": 0.82, "brake": 0.0, "rpm": 12150, "gear": 7},
		],
	}



