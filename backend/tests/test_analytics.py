from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.services.analytics_service import AnalyticsService

def test_analytics_trend(db: Session):
    trend = AnalyticsService.get_consumption_trend(db, days=7)
    assert len(trend) == 7
    for pt in trend:
        assert pt.consumed_litres >= 0
        assert pt.supplied_litres >= 0
        assert 0.0 <= pt.efficiency_pct <= 100.0

def test_analytics_building_comparison(db: Session):
    comparisons = AnalyticsService.get_building_comparisons(db)
    assert len(comparisons) == 4 # 4 buildings
    for b in comparisons:
        assert b.quota_litres > 0
        assert b.household_avg_litres >= 0

def test_analytics_endpoints(client: TestClient):
    resp = client.get("/api/analytics/consumption?days=7")
    assert resp.status_code == 200
    assert len(resp.json()) == 7

    resp2 = client.get("/api/analytics/wastage?days=30")
    assert resp2.status_code == 200
    data = resp2.json()
    assert "total_wastage_litres" in data
    assert "financial_loss_estimate" in data

    resp3 = client.get("/api/analytics/export?days=14")
    assert resp3.status_code == 200
    assert "text/csv" in resp3.headers["content-type"]
    assert "Supplied (L)" in resp3.text
