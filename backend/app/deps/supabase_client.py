import os
from typing import Optional


def get_supabase_config() -> Optional[dict]:
	url = os.getenv("SUPABASE_URL")
	key = os.getenv("SUPABASE_ANON_KEY")
	if not url or not key:
		return None
	return {"url": url, "key": key}



