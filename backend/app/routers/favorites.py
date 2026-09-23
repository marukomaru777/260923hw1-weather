import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])

if os.getenv("VERCEL"):
    # Serverless functions can only write to temporary storage; favorites are ephemeral there.
    DATA_FILE = Path(os.getenv("TMPDIR", "/tmp")) / "favorites.json"
else:
    DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "favorites.json"
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

DEFAULT_FAVORITES = ["臺北市", "臺中市", "高雄市"]

def load_favorites() -> list:
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(DEFAULT_FAVORITES, ensure_ascii=False, indent=2))
        return DEFAULT_FAVORITES
    try:
        return json.loads(DATA_FILE.read_text())
    except Exception:
        return DEFAULT_FAVORITES

def save_favorites(favs: list) -> None:
    DATA_FILE.write_text(json.dumps(favs, ensure_ascii=False, indent=2))

class FavoriteRequest(BaseModel):
    city: str

@router.get("")
async def get_favorites():
    return {"success": True, "data": load_favorites()}

@router.post("")
async def add_favorite(req: FavoriteRequest):
    favs = load_favorites()
    city = req.city.strip().replace("台", "臺")
    if city not in favs:
        favs.append(city)
        save_favorites(favs)
    return {"success": True, "data": favs}

@router.delete("/{city}")
async def remove_favorite(city: str):
    favs = load_favorites()
    norm_city = city.strip().replace("台", "臺")
    favs = [f for f in favs if f != norm_city]
    save_favorites(favs)
    return {"success": True, "data": favs}
