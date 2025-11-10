from typing import Any, Dict, List


def placeholder_load_laps(season: int, round_no: int, driver: str) -> Dict[str, Any]:
	# To be replaced with fastf1 usage; keep offline-safe placeholder
	return {
		"season": season,
		"round": round_no,
		"driver": driver.upper(),
		"laps": [
			{"lap": 1, "time_ms": 92000, "s1": 30100, "s2": 31000, "s3": 30900},
			{"lap": 2, "time_ms": 91500, "s1": 29900, "s2": 30800, "s3": 30800},
		],
	}





































