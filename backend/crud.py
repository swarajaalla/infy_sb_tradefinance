from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test_docs():
    return {"message": "Documents API working (Milestone 1)"}
