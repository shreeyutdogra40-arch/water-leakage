from typing import List
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import (
    DailyConsumptionPoint, BuildingComparisonPoint,
    WastageAnalysisResponse, IncidentStatsResponse
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/consumption", response_model=List[DailyConsumptionPoint])
def get_consumption_analytics(days: int = Query(14, ge=3, le=90), db: Session = Depends(get_db)):
    return AnalyticsService.get_consumption_trend(db=db, days=days)

@router.get("/buildings", response_model=List[BuildingComparisonPoint])
def get_building_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_building_comparisons(db=db)

@router.get("/wastage", response_model=WastageAnalysisResponse)
def get_wastage_analysis(days: int = Query(30, ge=7, le=180), db: Session = Depends(get_db)):
    return AnalyticsService.get_wastage_analysis(db=db, days=days)

@router.get("/leakage", response_model=IncidentStatsResponse)
def get_leakage_stats(db: Session = Depends(get_db)):
    return AnalyticsService.get_incident_stats(db=db)

@router.get("/export")
def export_analytics_csv(days: int = Query(30, ge=7, le=180), db: Session = Depends(get_db)):
    csv_data = AnalyticsService.export_csv_report(db=db, days=days)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=water_analytics_report.csv"}
    )
