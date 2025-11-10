from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ml", tags=["ml"])


class CornerSpeedRequest(BaseModel):
	turn_number: int
	circuit: str
	car_mass_kg: float
	downforce_level: float
	tyre_compound: str
	track_temp_c: float


@router.post("/predict-corner-speed")
async def predict_corner_speed(req: CornerSpeedRequest):
	# Placeholder deterministic calc; replaced later with trained model
	base = 150.0 - (req.car_mass_kg - 795) * 0.02 + req.downforce_level * 5.0
	compound_mod = {"soft": 4.0, "medium": 2.0, "hard": 0.0}.get(req.tyre_compound.lower(), 1.0)
	temp_mod = -max(0.0, abs(req.track_temp_c - 30.0) * 0.1)
	pred = max(60.0, base + compound_mod + temp_mod)
	return {"turn_number": req.turn_number, "circuit": req.circuit, "corner_speed_kph": round(pred, 1)}


class TireWearRequest(BaseModel):
	stint_laps: int
	compound: str
	track_temp_c: float
	driver_style_aggressive: bool = False


@router.post("/predict-tire-wear")
async def predict_tire_wear(req: TireWearRequest):
	compound_base = {"soft": 1.4, "medium": 1.1, "hard": 0.9}.get(req.compound.lower(), 1.2)
	agg = 0.2 if req.driver_style_aggressive else 0.0
	temp = 0.01 * max(0.0, req.track_temp_c - 28)
	rate = compound_base + agg + temp
	return {"avg_wear_per_lap_%": round(rate, 2), "expected_total_%": round(rate * req.stint_laps, 1)}


class LapTimeImprovementRequest(BaseModel):
	current_lap_ms: int
	fuel_kg: float
	new_tyre_compound: str


@router.post("/predict-lap-improvement")
async def predict_lap_improvement(req: LapTimeImprovementRequest):
	fuel_gain = req.fuel_kg * 0.030  # ms per kg
	compound_gain = {"soft": 350.0, "medium": 200.0, "hard": 0.0}.get(req.new_tyre_compound.lower(), 100.0)
	improvement_ms = min(req.current_lap_ms * 0.2, fuel_gain + compound_gain)
	return {"improvement_ms": round(improvement_ms, 1)}


class WinProbRequest(BaseModel):
	driver_rating: float
	team_rating: float
	engine_power_kw: float
	track_top_speed_kmh: float
	downforce_setup: float
	tire_choice: str


@router.post("/predict-win-probability")
async def predict_win_probability(req: WinProbRequest):
	# Simple logistic-style score as placeholder
	tire_bonus = {"soft": 0.06, "medium": 0.03, "hard": 0.0}.get(req.tire_choice.lower(), 0.02)
	score = (
		0.45 * (req.driver_rating / 100.0)
		+ 0.30 * (req.team_rating / 100.0)
		+ 0.10 * (req.engine_power_kw / 800.0)
		+ 0.07 * (req.downforce_setup)
		+ 0.05 * (req.track_top_speed_kmh / 350.0)
		+ tire_bonus
	)
	score = max(0.0, min(1.0, score))
	return {"win_probability": round(score, 3)}



