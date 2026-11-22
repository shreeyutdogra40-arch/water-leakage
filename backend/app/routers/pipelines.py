from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.infrastructure import Pipeline, ValveStatus
from app.models.user import User, UserRole
from app.schemas.monitoring import PipelineResponse
from app.services.auth_service import require_roles
from pydantic import BaseModel

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])

class PipelineCreate(BaseModel):
    community_id: int
    building_id: Optional[int] = None
    name: str
    code: str
    material: str = "CPVC / HDPE"
    diameter_mm: float = 50.0
    max_pressure_bar: float = 6.0
    nominal_pressure_bar: float = 3.5
    normal_flow_lpm: float = 45.0

@router.get("", response_model=List[PipelineResponse])
def get_pipelines(db: Session = Depends(get_db)):
    return db.query(Pipeline).all()

@router.get("/{pipeline_id}", response_model=PipelineResponse)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline

@router.post("", response_model=PipelineResponse, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    pipeline_in: PipelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    existing = db.query(Pipeline).filter(Pipeline.code == pipeline_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Pipeline code already exists")

    pipeline = Pipeline(
        community_id=pipeline_in.community_id,
        building_id=pipeline_in.building_id,
        name=pipeline_in.name,
        code=pipeline_in.code,
        material=pipeline_in.material,
        diameter_mm=pipeline_in.diameter_mm,
        max_pressure_bar=pipeline_in.max_pressure_bar,
        nominal_pressure_bar=pipeline_in.nominal_pressure_bar,
        normal_flow_lpm=pipeline_in.normal_flow_lpm,
        valve_status=ValveStatus.OPEN,
        is_isolated=False,
        current_flow_lpm=pipeline_in.normal_flow_lpm,
        current_pressure_bar=pipeline_in.nominal_pressure_bar
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline
