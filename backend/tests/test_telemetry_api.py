from fastapi.testclient import TestClient

def test_dashboard_overview_endpoint(client: TestClient):
    resp = client.get("/api/dashboard/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_water_supplied_litres" in data
    assert "total_water_consumed_litres" in data
    assert "main_reservoir_level_pct" in data
    assert "connected_sensors_count" in data

def test_live_monitoring_endpoint(client: TestClient):
    resp = client.get("/api/monitoring/live")
    assert resp.status_code == 200
    data = resp.json()
    assert "pipelines" in data
    assert "tanks" in data
    assert len(data["pipelines"]) > 0

def test_iot_sensor_reading_ingest(client: TestClient):
    payload = {
        "sensor_code": "SNS-FLOW-TWRA-01",
        "flow_rate_lpm": 31.8,
        "pressure_bar": 3.4
    }
    resp = client.post("/api/monitoring/readings", json=payload)
    assert resp.status_code == 201
    assert resp.json()["status"] == "ok"

def test_alerts_list_and_read(client: TestClient):
    resp = client.get("/api/alerts")
    assert resp.status_code == 200
    alerts = resp.json()
    assert len(alerts) > 0
    first_id = alerts[0]["id"]

    # Mark read
    patch_resp = client.patch(f"/api/alerts/{first_id}/read")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_read"] is True

def test_simulation_toggle_and_inject(client: TestClient):
    # Toggle simulation
    resp = client.post("/api/simulation/toggle")
    assert resp.status_code == 200

    # Inject anomaly
    resp = client.post("/api/simulation/inject", json={"scenario": "pipe_burst"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # Reset
    resp = client.post("/api/simulation/reset")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
