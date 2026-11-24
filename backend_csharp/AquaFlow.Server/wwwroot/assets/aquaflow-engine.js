/**
 * AquaFlow Multi-Location Hydraulic Simulation & Hybrid Telemetry Engine
 * Supporting: Law Gate (LPU), Green Valley (Phagwara), Phagwara Central Grid, GreenHeights
 * Provides offline/Vercel stateful simulation fallback with live WebSockets & interactive controls.
 */
(function() {
  'use strict';

  // 1. Multi-Location Dataset
  const LOCATIONS = {
    law_gate: {
      id: 'law_gate',
      name: 'Law Gate Urban Hub',
      subtitle: 'LPU Outer Campus Commercial & High-Density Student Housing Riser Network',
      zone: 'Zone 1 - LPU Highway Corridor, Phagwara',
      households_count: 48,
      supplied_litres: 28450,
      consumed_litres: 26100,
      flow_lpm: 285.0,
      pressure_bar: 3.82,
      capacity_litres: 180000,
      budget_litres: 35000,
      pipelines: [
        { id: 101, community_id: 1, building_id: 10, name: 'Law Gate Arterial Supply Trunk', code: 'TRUNK-LG-01', material: 'Ductile Iron', diameter_mm: 150, max_pressure_bar: 10, nominal_pressure_bar: 4.2, normal_flow_lpm: 280, valve_status: 'open', is_isolated: false, current_flow_lpm: 285.0, current_pressure_bar: 3.82, updated_at: new Date().toISOString() },
        { id: 102, community_id: 1, building_id: 11, name: 'Galaxy Heights Riser (Block A)', code: 'RISER-LG-GALAXY', material: 'CPVC Schedule 80', diameter_mm: 65, max_pressure_bar: 6, nominal_pressure_bar: 3.6, normal_flow_lpm: 72, valve_status: 'open', is_isolated: false, current_flow_lpm: 73.5, current_pressure_bar: 3.55, updated_at: new Date().toISOString() },
        { id: 103, community_id: 1, building_id: 12, name: 'Royal Suites Commercial Riser (Block B)', code: 'RISER-LG-ROYAL', material: 'CPVC Schedule 80', diameter_mm: 65, max_pressure_bar: 6, nominal_pressure_bar: 3.6, normal_flow_lpm: 70, valve_status: 'open', is_isolated: false, current_flow_lpm: 69.2, current_pressure_bar: 3.58, updated_at: new Date().toISOString() },
        { id: 104, community_id: 1, building_id: 13, name: 'Scholar Inn Student Hostel (Block C)', code: 'RISER-LG-SCHOLAR', material: 'CPVC Schedule 80', diameter_mm: 65, max_pressure_bar: 6, nominal_pressure_bar: 3.6, normal_flow_lpm: 75, valve_status: 'open', is_isolated: false, current_flow_lpm: 76.1, current_pressure_bar: 3.50, updated_at: new Date().toISOString() },
        { id: 105, community_id: 1, building_id: 14, name: 'Apex Residency Riser (Block D)', code: 'RISER-LG-APEX', material: 'CPVC Schedule 80', diameter_mm: 65, max_pressure_bar: 6, nominal_pressure_bar: 3.6, normal_flow_lpm: 68, valve_status: 'open', is_isolated: false, current_flow_lpm: 66.2, current_pressure_bar: 3.60, updated_at: new Date().toISOString() },
      ],
      tanks: [
        { id: 101, community_id: 1, building_id: null, name: 'Law Gate Central Underground Sump', tank_type: 'main_reservoir', capacity_litres: 180000, current_level_litres: 152000, current_level_percentage: 84.4, height_meters: 6.5, low_level_threshold_pct: 20, is_filling: true, updated_at: new Date().toISOString() },
        { id: 102, community_id: 1, building_id: 11, name: 'Galaxy Heights Rooftop Tank', tank_type: 'overhead_tank', capacity_litres: 25000, current_level_litres: 20500, current_level_percentage: 82.0, height_meters: 3.8, low_level_threshold_pct: 25, is_filling: false, updated_at: new Date().toISOString() },
        { id: 103, community_id: 1, building_id: 12, name: 'Royal Suites Rooftop Tank', tank_type: 'overhead_tank', capacity_litres: 25000, current_level_litres: 19800, current_level_percentage: 79.2, height_meters: 3.8, low_level_threshold_pct: 25, is_filling: false, updated_at: new Date().toISOString() },
        { id: 104, community_id: 1, building_id: 13, name: 'Scholar Inn Rooftop Tank', tank_type: 'overhead_tank', capacity_litres: 20000, current_level_litres: 16400, current_level_percentage: 82.0, height_meters: 3.5, low_level_threshold_pct: 25, is_filling: false, updated_at: new Date().toISOString() },
      ],
      buildings: [
        { id: 11, name: 'Galaxy Heights (Block A)', block_code: 'BLK-LG-A', total_households: 12, current_day_consumption_litres: 6420 },
        { id: 12, name: 'Royal Suites (Block B)', block_code: 'BLK-LG-B', total_households: 12, current_day_consumption_litres: 6180 },
        { id: 13, name: 'Scholar Inn (Block C)', block_code: 'BLK-LG-C', total_households: 12, current_day_consumption_litres: 7100 },
        { id: 14, name: 'Apex Residency (Block D)', block_code: 'BLK-LG-D', total_households: 12, current_day_consumption_litres: 6400 },
      ]
    },
    green_valley: {
      id: 'green_valley',
      name: 'Green Valley Eco-Residences',
      subtitle: 'Sustainable Residential Community & Rainwater Harvesting Infrastructure',
      zone: 'Zone 2 - Green Valley Township, Jalandhar-Phagwara Highway',
      households_count: 36,
      supplied_litres: 14200,
      consumed_litres: 12850,
      flow_lpm: 98.4,
      pressure_bar: 3.15,
      capacity_litres: 150000,
      budget_litres: 22000,
      pipelines: [
        { id: 201, community_id: 2, building_id: 20, name: 'Green Valley Highway Main Header', code: 'TRUNK-GV-01', material: 'High-Density Polyethylene', diameter_mm: 125, max_pressure_bar: 8, nominal_pressure_bar: 3.5, normal_flow_lpm: 95, valve_status: 'open', is_isolated: false, current_flow_lpm: 98.4, current_pressure_bar: 3.15, updated_at: new Date().toISOString() },
        { id: 202, community_id: 2, building_id: 21, name: 'Cedar Villa Enclave Riser', code: 'RISER-GV-CEDAR', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.2, normal_flow_lpm: 32, valve_status: 'open', is_isolated: false, current_flow_lpm: 33.1, current_pressure_bar: 3.10, updated_at: new Date().toISOString() },
        { id: 203, community_id: 2, building_id: 22, name: 'Pine Crest Eco-Block Riser', code: 'RISER-GV-PINE', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.2, normal_flow_lpm: 34, valve_status: 'open', is_isolated: false, current_flow_lpm: 34.8, current_pressure_bar: 3.12, updated_at: new Date().toISOString() },
        { id: 204, community_id: 2, building_id: 23, name: 'Oak Ridge Solar Riser', code: 'RISER-GV-OAK', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.2, normal_flow_lpm: 30, valve_status: 'open', is_isolated: false, current_flow_lpm: 30.5, current_pressure_bar: 3.14, updated_at: new Date().toISOString() },
      ],
      tanks: [
        { id: 201, community_id: 2, building_id: null, name: 'Green Valley Underground Sump (Solar Pump)', tank_type: 'main_reservoir', capacity_litres: 150000, current_level_litres: 132000, current_level_percentage: 88.0, height_meters: 6.0, low_level_threshold_pct: 20, is_filling: true, updated_at: new Date().toISOString() },
        { id: 202, community_id: 2, building_id: 21, name: 'Cedar Villa Overhead Gravity Tank', tank_type: 'overhead_tank', capacity_litres: 20000, current_level_litres: 17200, current_level_percentage: 86.0, height_meters: 3.2, low_level_threshold_pct: 25, is_filling: false, updated_at: new Date().toISOString() },
        { id: 203, community_id: 2, building_id: 22, name: 'Pine Crest Overhead Gravity Tank', tank_type: 'overhead_tank', capacity_litres: 20000, current_level_litres: 16800, current_level_percentage: 84.0, height_meters: 3.2, low_level_threshold_pct: 25, is_filling: false, updated_at: new Date().toISOString() },
      ],
      buildings: [
        { id: 21, name: 'Cedar Villa Enclave', block_code: 'BLK-GV-A', total_households: 12, current_day_consumption_litres: 4200 },
        { id: 22, name: 'Pine Crest Eco-Block', block_code: 'BLK-GV-B', total_households: 12, current_day_consumption_litres: 4450 },
        { id: 23, name: 'Oak Ridge Enclave', block_code: 'BLK-GV-C', total_households: 12, current_day_consumption_litres: 4200 },
      ]
    },
    phagwara: {
      id: 'phagwara',
      name: 'Phagwara Central Municipal Grid',
      subtitle: 'Municipal Water Board Bulk Transmission & Commercial High-Pressure Feeders',
      zone: 'Zone 3 - Municipal Corporation Water Works Division, Phagwara',
      households_count: 120,
      supplied_litres: 84500,
      consumed_litres: 79200,
      flow_lpm: 520.0,
      pressure_bar: 4.60,
      capacity_litres: 450000,
      budget_litres: 95000,
      pipelines: [
        { id: 301, community_id: 3, building_id: 30, name: 'GT Road High-Pressure Bulk Header', code: 'TRUNK-PHAG-01', material: 'Welded Carbon Steel', diameter_mm: 250, max_pressure_bar: 16, nominal_pressure_bar: 5.0, normal_flow_lpm: 500, valve_status: 'open', is_isolated: false, current_flow_lpm: 520.0, current_pressure_bar: 4.60, updated_at: new Date().toISOString() },
        { id: 302, community_id: 3, building_id: 31, name: 'Sector 1 Commercial Primary Feeder', code: 'FEEDER-PHAG-SEC1', material: 'Ductile Iron Class K9', diameter_mm: 150, max_pressure_bar: 10, nominal_pressure_bar: 4.5, normal_flow_lpm: 180, valve_status: 'open', is_isolated: false, current_flow_lpm: 184.0, current_pressure_bar: 4.45, updated_at: new Date().toISOString() },
        { id: 303, community_id: 3, building_id: 32, name: 'Industrial Area Phase 2 Header', code: 'FEEDER-PHAG-IND', material: 'Ductile Iron Class K9', diameter_mm: 150, max_pressure_bar: 10, nominal_pressure_bar: 4.5, normal_flow_lpm: 190, valve_status: 'open', is_isolated: false, current_flow_lpm: 189.5, current_pressure_bar: 4.40, updated_at: new Date().toISOString() },
        { id: 304, community_id: 3, building_id: 33, name: 'Old City Municipal Ring Header', code: 'FEEDER-PHAG-OLD', material: 'Ductile Iron Class K9', diameter_mm: 125, max_pressure_bar: 10, nominal_pressure_bar: 4.5, normal_flow_lpm: 150, valve_status: 'open', is_isolated: false, current_flow_lpm: 146.5, current_pressure_bar: 4.42, updated_at: new Date().toISOString() },
      ],
      tanks: [
        { id: 301, community_id: 3, building_id: null, name: 'Phagwara Municipal Master Reservoir', tank_type: 'main_reservoir', capacity_litres: 450000, current_level_litres: 395000, current_level_percentage: 87.7, height_meters: 8.5, low_level_threshold_pct: 15, is_filling: true, updated_at: new Date().toISOString() },
        { id: 302, community_id: 3, building_id: 31, name: 'GT Road Elevated Water Tower', tank_type: 'overhead_tank', capacity_litres: 80000, current_level_litres: 68000, current_level_percentage: 85.0, height_meters: 5.2, low_level_threshold_pct: 20, is_filling: false, updated_at: new Date().toISOString() },
      ],
      buildings: [
        { id: 31, name: 'Sector 1 Commercial Risers', block_code: 'SEC-1', total_households: 40, current_day_consumption_litres: 26400 },
        { id: 32, name: 'Industrial Area Phase 2', block_code: 'IND-2', total_households: 40, current_day_consumption_litres: 28500 },
        { id: 33, name: 'Old City Ring Distribution', block_code: 'OLD-CITY', total_households: 40, current_day_consumption_litres: 24300 },
      ]
    },
    greenheights: {
      id: 'greenheights',
      name: 'GreenHeights Eco-Smart Community',
      subtitle: 'Continuous hydraulic monitoring & automated isolation protecting 24 households',
      zone: 'Sector 42, Smart City Green Corridor',
      households_count: 24,
      supplied_litres: 13850,
      consumed_litres: 12680,
      flow_lpm: 138.5,
      pressure_bar: 3.42,
      capacity_litres: 140000,
      budget_litres: 24000,
      pipelines: [
        { id: 1, community_id: 4, building_id: null, name: 'Community Primary Transmission Header', code: 'TRUNK-MAIN-01', material: 'Ductile Iron Class K9', diameter_mm: 100, max_pressure_bar: 10, nominal_pressure_bar: 3.5, normal_flow_lpm: 135, valve_status: 'open', is_isolated: false, current_flow_lpm: 138.5, current_pressure_bar: 3.42, updated_at: new Date().toISOString() },
        { id: 2, community_id: 4, building_id: 1, name: 'Lotus Tower Riser (Block A)', code: 'RISER-BLK-A', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.4, normal_flow_lpm: 35, valve_status: 'open', is_isolated: false, current_flow_lpm: 36.2, current_pressure_bar: 3.38, updated_at: new Date().toISOString() },
        { id: 3, community_id: 4, building_id: 2, name: 'Orchid Tower Riser (Block B)', code: 'RISER-BLK-B', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.4, normal_flow_lpm: 34, valve_status: 'open', is_isolated: false, current_flow_lpm: 34.5, current_pressure_bar: 3.40, updated_at: new Date().toISOString() },
        { id: 4, community_id: 4, building_id: 3, name: 'Magnolia Tower Riser (Block C)', code: 'RISER-BLK-C', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.4, normal_flow_lpm: 36, valve_status: 'open', is_isolated: false, current_flow_lpm: 35.8, current_pressure_bar: 3.39, updated_at: new Date().toISOString() },
        { id: 5, community_id: 4, building_id: 4, name: 'Jasmine Tower Riser (Block D)', code: 'RISER-BLK-D', material: 'CPVC Schedule 80', diameter_mm: 50, max_pressure_bar: 6, nominal_pressure_bar: 3.4, normal_flow_lpm: 32, valve_status: 'open', is_isolated: false, current_flow_lpm: 32.0, current_pressure_bar: 3.42, updated_at: new Date().toISOString() },
      ],
      tanks: [
        { id: 1, community_id: 4, building_id: null, name: 'Underground Raw Water Reservoir', tank_type: 'main_reservoir', capacity_litres: 80000, current_level_litres: 68500, current_level_percentage: 85.6, height_meters: 5.0, low_level_threshold_pct: 20, is_filling: true, updated_at: new Date().toISOString() },
        { id: 2, community_id: 4, building_id: 1, name: 'Lotus Block A Overhead Tank', tank_type: 'overhead_tank', capacity_litres: 15000, current_level_litres: 12200, current_level_percentage: 81.3, height_meters: 3.0, low_level_threshold_pct: 20, is_filling: false, updated_at: new Date().toISOString() },
        { id: 3, community_id: 4, building_id: 2, name: 'Orchid Block B Overhead Tank', tank_type: 'overhead_tank', capacity_litres: 15000, current_level_litres: 11800, current_level_percentage: 78.7, height_meters: 3.0, low_level_threshold_pct: 20, is_filling: false, updated_at: new Date().toISOString() },
        { id: 4, community_id: 4, building_id: 3, name: 'Magnolia Block C Overhead Tank', tank_type: 'overhead_tank', capacity_litres: 15000, current_level_litres: 12400, current_level_percentage: 82.7, height_meters: 3.0, low_level_threshold_pct: 20, is_filling: false, updated_at: new Date().toISOString() },
        { id: 5, community_id: 4, building_id: 4, name: 'Jasmine Block D Overhead Tank', tank_type: 'overhead_tank', capacity_litres: 15000, current_level_litres: 11500, current_level_percentage: 76.7, height_meters: 3.0, low_level_threshold_pct: 20, is_filling: false, updated_at: new Date().toISOString() },
      ],
      buildings: [
        { id: 1, name: 'Lotus Tower (Block A)', block_code: 'BLK-A', total_households: 6, current_day_consumption_litres: 3200 },
        { id: 2, name: 'Orchid Tower (Block B)', block_code: 'BLK-B', total_households: 6, current_day_consumption_litres: 3150 },
        { id: 3, name: 'Magnolia Tower (Block C)', block_code: 'BLK-C', total_households: 6, current_day_consumption_litres: 3250 },
        { id: 4, name: 'Jasmine Tower (Block D)', block_code: 'BLK-D', total_households: 6, current_day_consumption_litres: 3080 },
      ]
    }
  };

  // State management
  let currentLocKey = localStorage.getItem('aquaflow_selected_location') || 'law_gate';
  if (!LOCATIONS[currentLocKey]) currentLocKey = 'law_gate';

  let activeScenario = null;
  let scenarioTicks = 0;
  let activeIncidents = [];
  let notifications = [
    { id: 991, title: 'Law Gate Telemetry Online', message: 'ESP32 Nodes & Ultrasonic Depth Gauges successfully transmitting high-frequency hydraulic packets.', severity: 'low', is_read: false, created_at: new Date().toISOString() }
  ];

  // Simulated state clone
  let state = JSON.parse(JSON.stringify(LOCATIONS[currentLocKey]));

  function setLocation(key) {
    if (!LOCATIONS[key]) return;
    currentLocKey = key;
    localStorage.setItem('aquaflow_selected_location', key);
    state = JSON.parse(JSON.stringify(LOCATIONS[key]));
    activeScenario = null;
    activeIncidents = [];
    console.log(`📍 Switched to Location: ${state.name} (${state.zone})`);
    broadcastTick();
    updateUIBanner();
  }

  // Simulator Engine
  function applyScenarioEffects() {
    const baseFlow = LOCATIONS[currentLocKey].flow_lpm;
    const basePres = LOCATIONS[currentLocKey].pressure_bar;
    const pipes = state.pipelines;

    if (activeScenario === 'pipe_burst') {
      scenarioTicks++;
      // Surge flow and collapse pressure
      const targetPipe = pipes.find(p => p.building_id !== null) || pipes[1];
      targetPipe.current_flow_lpm = Math.round(targetPipe.normal_flow_lpm * 2.2 * 10) / 10;
      targetPipe.current_pressure_bar = Math.max(0.8, Math.round((targetPipe.nominal_pressure_bar * 0.35) * 100) / 100);
      
      state.flow_lpm = Math.round((baseFlow * 1.55) * 10) / 10;
      state.pressure_bar = Math.max(1.15, Math.round((basePres * 0.42) * 100) / 100);

      if (scenarioTicks >= 2 && !targetPipe.is_isolated) {
        // Enforce Auto-Isolation
        targetPipe.is_isolated = true;
        targetPipe.valve_status = 'closed';
        targetPipe.current_flow_lpm = 0.0;
        
        const newInc = {
          id: Date.now(),
          pipeline_id: targetPipe.id,
          pipeline_code: targetPipe.code,
          pipeline_name: targetPipe.name,
          severity: 'critical',
          flow_rate: targetPipe.current_flow_lpm,
          pressure_reading: targetPipe.current_pressure_bar,
          confidence_score: 0.98,
          detection_reason: `Critical Pipe Burst Confirmed: Pressure collapsed by 2.20 Bar with surging flow. Automated solenoid isolation executed on ${targetPipe.code}.`,
          status: 'detected',
          estimated_water_lost_litres: 185.0,
          created_at: new Date().toISOString()
        };
        activeIncidents = [newInc, ...activeIncidents];

        const alertItem = {
          id: Date.now() + 1,
          title: `CRITICAL LEAK: ${targetPipe.code} Auto-Isolated`,
          message: `Riser valve closed automatically. Main Trunk protected. Technician dispatched to ${state.name}.`,
          severity: 'critical',
          is_read: false,
          created_at: new Date().toISOString()
        };
        notifications.unshift(alertItem);
        broadcastAlert(alertItem);
      }
    } else if (activeScenario === 'micro_fissure') {
      const targetPipe = pipes.find(p => p.building_id !== null) || pipes[1];
      targetPipe.current_pressure_bar = Math.round((targetPipe.nominal_pressure_bar - 0.65) * 100) / 100;
      targetPipe.current_flow_lpm = Math.round((targetPipe.normal_flow_lpm + 14.5) * 10) / 10;
      state.pressure_bar = Math.round((basePres - 0.55) * 100) / 100;
      
      if (!activeIncidents.some(i => i.severity === 'medium')) {
        const medInc = {
          id: Date.now(),
          pipeline_id: targetPipe.id,
          pipeline_code: targetPipe.code,
          pipeline_name: targetPipe.name,
          severity: 'medium',
          flow_rate: targetPipe.current_flow_lpm,
          pressure_reading: targetPipe.current_pressure_bar,
          confidence_score: 0.88,
          detection_reason: `Micro-Fissure: Mass-balance discrepancy of 14.2% identified between bulk transmission header and risers.`,
          status: 'detected',
          estimated_water_lost_litres: 45.0,
          created_at: new Date().toISOString()
        };
        activeIncidents = [medInc, ...activeIncidents];
        broadcastAlert({
          id: Date.now() + 2,
          title: `MEDIUM LEAK: Micro-Fissure at ${targetPipe.code}`,
          message: `Mass-balance loss > 12.0%. Acoustic pinpointing scheduled.`,
          severity: 'medium',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } else if (activeScenario === 'pressure_collapse') {
      state.pressure_bar = Math.round((basePres * 0.45) * 100) / 100;
      pipes.forEach(p => { p.current_pressure_bar = Math.round((p.nominal_pressure_bar * 0.45) * 100) / 100; });
    } else if (activeScenario === 'tank_drain') {
      const oh = state.tanks.find(t => t.tank_type === 'overhead_tank');
      if (oh) {
        oh.current_level_percentage = 18.2;
        oh.current_level_litres = Math.round(oh.capacity_litres * 0.182);
      }
    } else {
      // Normal jitter
      const jitter = (Math.random() - 0.5) * 1.5;
      const presJitter = (Math.random() - 0.5) * 0.05;
      state.flow_lpm = Math.round((baseFlow + jitter) * 10) / 10;
      state.pressure_bar = Math.round((basePres + presJitter) * 100) / 100;
      pipes.forEach(p => {
        if (!p.is_isolated) {
          p.current_flow_lpm = Math.max(0, Math.round((p.normal_flow_lpm + (Math.random() - 0.5) * 0.8) * 10) / 10);
          p.current_pressure_bar = Math.round((p.nominal_pressure_bar + presJitter) * 100) / 100;
        }
      });
    }
  }

  // Virtual WebSockets for Live UI Telemetry
  const virtualSockets = new Set();

  function broadcastTick() {
    applyScenarioEffects();
    const packet = {
      type: 'TELEMETRY_TICK',
      data: {
        timestamp: new Date().toISOString(),
        total_system_flow_lpm: state.flow_lpm,
        average_pressure_bar: state.pressure_bar,
        main_reservoir_pct: state.tanks[0]?.current_level_percentage || 85.0,
        main_reservoir_litres: state.tanks[0]?.current_level_litres || 150000,
        overhead_tanks_avg_pct: 81.2,
        active_scenario: activeScenario,
        pipelines: state.pipelines,
        tanks: state.tanks
      }
    };
    virtualSockets.forEach(ws => {
      try {
        if (ws.onmessage) ws.onmessage({ data: JSON.stringify(packet) });
      } catch (e) {}
    });
  }

  function broadcastAlert(alertItem) {
    const packet = { type: 'NEW_ALERT', data: alertItem };
    virtualSockets.forEach(ws => {
      try {
        if (ws.onmessage) ws.onmessage({ data: JSON.stringify(packet) });
      } catch (e) {}
    });
  }

  // Ticking interval every 2.5 seconds
  setInterval(broadcastTick, 2500);

  // Hook into WebSocket constructor if remote connection fails
  const NativeWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    let ws;
    let isMock = false;
    try {
      ws = new NativeWebSocket(url, protocols);
    } catch (e) {
      isMock = true;
    }

    if (!ws || isMock) {
      ws = {
        readyState: 1, // OPEN
        send: function() {},
        close: function() { virtualSockets.delete(ws); },
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
      };
      virtualSockets.add(ws);
      setTimeout(() => { if (ws.onopen) ws.onopen({}); }, 100);
      return ws;
    }

    // Wrap native socket to fallback if connection fails (e.g. on Vercel)
    const originalOnError = ws.onerror;
    const originalOnClose = ws.onclose;

    ws.addEventListener('error', function() {
      virtualSockets.add(ws);
      if (ws.onopen) ws.onopen({});
    });
    ws.addEventListener('close', function() {
      virtualSockets.add(ws);
      if (ws.onopen) ws.onopen({});
    });

    return ws;
  };

  // Intercept XMLHttpRequest & Fetch for Seamless Offline/Vercel API handling
  function getMockResponse(method, url, body) {
    url = url.toLowerCase();

    if (url.includes('/api/dashboard/overview')) {
      return {
        community_name: state.name,
        location: state.zone,
        total_water_supplied_litres: state.supplied_litres,
        total_water_consumed_litres: state.consumed_litres,
        total_water_supplied_today_litres: state.supplied_litres,
        total_water_consumed_today_litres: state.consumed_litres,
        system_flow_rate_lpm: state.flow_lpm,
        current_total_flow_lpm: state.flow_lpm,
        average_pressure_bar: state.pressure_bar,
        average_pipeline_pressure_bar: state.pressure_bar,
        main_reservoir_level_pct: state.tanks[0]?.current_level_percentage || 85.0,
        main_reservoir_litres: state.tanks[0]?.current_level_litres || 150000,
        overhead_tanks_average_pct: 81.2,
        active_leaks_count: activeIncidents.length,
        active_leakage_incidents_count: activeIncidents.length,
        critical_incidents_count: activeIncidents.filter(i => i.severity === 'critical').length,
        connected_sensors_count: 16,
        total_sensors_count: 16,
        isolated_valves_count: state.pipelines.filter(p => p.is_isolated).length,
        estimated_water_wastage_litres: activeIncidents.reduce((s, i) => s + i.estimated_water_lost_litres, 240.0),
        simulation_active: true,
        active_anomaly_scenario: activeScenario,
        timestamp: new Date().toISOString()
      };
    }

    if (url.includes('/api/monitoring/live')) {
      return {
        timestamp: new Date().toISOString(),
        pipelines: state.pipelines,
        tanks: state.tanks
      };
    }

    if (url.includes('/api/pipelines')) {
      return state.pipelines;
    }

    if (url.includes('/api/water/tanks')) {
      return state.tanks;
    }

    if (url.includes('/api/water/buildings')) {
      return state.buildings;
    }

    if (url.includes('/api/water/households')) {
      const hhs = [];
      state.buildings.forEach(b => {
        for (let u = 1; u <= 6; u++) {
          hhs.push({
            id: b.id * 10 + u,
            building_id: b.id,
            building_name: b.name,
            unit_number: `${b.block_code}-${u}01`,
            resident_name: `Resident ${b.block_code}-${u}`,
            meter_id: `MTR-${b.block_code}-${u}01`,
            daily_quota_litres: 650.0,
            current_day_usage_litres: Math.round((220 + Math.random() * 80) * 10) / 10
          });
        }
      });
      return hhs;
    }

    if (url.includes('/api/leakage/incidents')) {
      return activeIncidents;
    }

    if (url.includes('/api/alerts')) {
      return notifications;
    }

    if (url.includes('/api/auth/me')) {
      return {
        id: 1,
        username: 'admin',
        email: 'admin@aquaflow.smart',
        full_name: 'Shreeyut',
        role: 'admin',
        household_id: null,
        phone_number: '+91 98111 00001',
        is_active: true,
        created_at: new Date().toISOString()
      };
    }

    if (url.includes('/api/auth/login')) {
      return {
        access_token: 'aquaflow-simulated-jwt-token-for-instant-access',
        token_type: 'bearer',
        user: { id: 1, username: 'admin', full_name: 'Shreeyut', role: 'admin' }
      };
    }

    if (url.includes('/api/simulation/inject')) {
      let scenario = 'pipe_burst';
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        if (parsed?.scenario) scenario = parsed.scenario;
      } catch (e) {}
      activeScenario = scenario;
      scenarioTicks = 0;
      applyScenarioEffects();
      broadcastTick();
      return { status: 'injected', scenario: activeScenario };
    }

    if (url.includes('/api/simulation/reset')) {
      activeScenario = null;
      scenarioTicks = 0;
      activeIncidents = [];
      state.pipelines.forEach(p => { p.is_isolated = false; p.valve_status = 'open'; });
      applyScenarioEffects();
      broadcastTick();
      return { status: 'reset', active_scenario: null };
    }

    if (url.includes('/api/simulation/toggle')) {
      return { status: 'toggled', simulation_running: true };
    }

    if (url.includes('/api/valves/') && url.includes('/control')) {
      const match = url.match(/\/valves\/(\d+)\/control/);
      if (match) {
        const pipeId = Number(match[1]);
        const pipe = state.pipelines.find(p => p.id === pipeId);
        if (pipe) {
          let action = 'toggle';
          try {
            const parsed = typeof body === 'string' ? JSON.parse(body) : body;
            if (parsed?.action) action = parsed.action;
          } catch(e) {}
          if (action === 'close' || (action === 'toggle' && pipe.valve_status === 'open')) {
            pipe.valve_status = 'closed';
            pipe.is_isolated = true;
            pipe.current_flow_lpm = 0.0;
          } else {
            pipe.valve_status = 'open';
            pipe.is_isolated = false;
            pipe.current_flow_lpm = pipe.normal_flow_lpm;
          }
          broadcastTick();
          return pipe;
        }
      }
      return { status: 'ok' };
    }

    if (url.includes('/api/leakage/ml-analyze')) {
      return {
        is_anomaly: true,
        anomaly_score: -0.684,
        confidence_pct: 96.8,
        classification: 'Critical Pipe Burst Anomaly',
        algorithm: 'Scikit-Learn IsolationForest (Contamination = 0.08)',
        model_version: '2.1.0'
      };
    }

    if (url.includes('/api/analytics/')) {
      return [
        { date: 'Day -6', consumed_litres: 12400, supplied_litres: 13500 },
        { date: 'Day -5', consumed_litres: 12900, supplied_litres: 13800 },
        { date: 'Day -4', consumed_litres: 13100, supplied_litres: 14100 },
        { date: 'Day -3', consumed_litres: 12600, supplied_litres: 13700 },
        { date: 'Day -2', consumed_litres: 12800, supplied_litres: 13900 },
        { date: 'Yesterday', consumed_litres: 12700, supplied_litres: 13800 },
        { date: 'Today', consumed_litres: state.consumed_litres, supplied_litres: state.supplied_litres },
      ];
    }

    return { status: 'ok', location: state.name };
  }

  // Intercept XHR for Axios
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let interceptedUrl = '';
    let interceptedMethod = 'GET';
    let interceptedBody = null;

    const originalOpen = xhr.open;
    xhr.open = function(method, url) {
      interceptedMethod = method;
      interceptedUrl = url;
      return originalOpen.apply(xhr, arguments);
    };

    const originalSend = xhr.send;
    xhr.send = function(body) {
      interceptedBody = body;

      // Handle network errors or non-200 responses gracefully
      xhr.addEventListener('error', function() {
        fallbackRespond();
      });

      xhr.addEventListener('load', function() {
        // If response is HTML (Vercel rewrite) or 404/500, provide mock JSON
        if (xhr.status >= 400 || (xhr.responseText && xhr.responseText.trim().startsWith('<!doctype'))) {
          fallbackRespond();
        }
      });

      function fallbackRespond() {
        const mockData = getMockResponse(interceptedMethod, interceptedUrl, interceptedBody);
        const jsonStr = JSON.stringify(mockData);

        Object.defineProperty(xhr, 'status', { writable: true, value: 200 });
        Object.defineProperty(xhr, 'statusText', { writable: true, value: 'OK' });
        Object.defineProperty(xhr, 'readyState', { writable: true, value: 4 });
        Object.defineProperty(xhr, 'responseText', { writable: true, value: jsonStr });
        Object.defineProperty(xhr, 'response', { writable: true, value: jsonStr });

        try {
          if (xhr.onreadystatechange) xhr.onreadystatechange(new Event('readystatechange'));
          if (xhr.onload) xhr.onload(new ProgressEvent('load'));
        } catch (e) {}
      }

      try {
        return originalSend.apply(xhr, arguments);
      } catch (err) {
        fallbackRespond();
      }
    };

    return xhr;
  };

  // Intercept Fetch API as well
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      const response = await originalFetch(input, init);
      if (!response.ok) {
        const mock = getMockResponse(init?.method || 'GET', String(input), init?.body);
        return new Response(JSON.stringify(mock), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return response;
    } catch (e) {
      const mock = getMockResponse(init?.method || 'GET', String(input), init?.body);
      return new Response(JSON.stringify(mock), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  };

  // 3. Dynamic Location Selector UI Component
  function updateUIBanner() {
    const loc = LOCATIONS[currentLocKey];
    if (!loc) return;

    // Update banner titles if DOM elements exist
    const banners = document.querySelectorAll('h1, h2, span, p');
    banners.forEach(el => {
      if (el.textContent && el.textContent.includes('GreenHeights Eco-Smart Community')) {
        el.textContent = `${loc.name} (${loc.zone})`;
      }
    });

    const selectorSelect = document.getElementById('aquaflow-location-select');
    if (selectorSelect) selectorSelect.value = currentLocKey;
  }

  function injectLocationSelector() {
    if (document.getElementById('aquaflow-location-container')) return;

    // Insert into header
    const header = document.querySelector('header');
    if (!header) {
      setTimeout(injectLocationSelector, 300);
      return;
    }

    const container = document.createElement('div');
    container.id = 'aquaflow-location-container';
    container.className = 'flex items-center space-x-2 bg-navy-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-lg shadow-cyan-500/10 backdrop-blur-md mx-2';

    container.innerHTML = `
      <span class="text-sm">📍</span>
      <label class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider hidden sm:inline">Location:</label>
      <select id="aquaflow-location-select" class="bg-transparent text-xs font-bold text-white border-none focus:outline-none cursor-pointer">
        <option value="law_gate" style="background:#070d1e;color:#fff;">📍 Law Gate Urban Hub (LPU Outer)</option>
        <option value="green_valley" style="background:#070d1e;color:#fff;">📍 Green Valley Eco-Residences</option>
        <option value="phagwara" style="background:#070d1e;color:#fff;">📍 Phagwara Central Municipal Grid</option>
        <option value="greenheights" style="background:#070d1e;color:#fff;">📍 GreenHeights Community</option>
      </select>
    `;

    // Insert after brand logo
    const brandDiv = header.querySelector('.flex.items-center.space-x-3') || header.firstElementChild;
    if (brandDiv && brandDiv.nextSibling) {
      header.insertBefore(container, brandDiv.nextSibling);
    } else {
      header.appendChild(container);
    }

    const selectEl = document.getElementById('aquaflow-location-select');
    selectEl.value = currentLocKey;
    selectEl.addEventListener('change', (e) => {
      setLocation(e.target.value);
    });

    updateUIBanner();
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectLocationSelector, 600);
  });

  // Expose global controller
  window.AquaFlowEngine = {
    setLocation,
    injectScenario: (s) => {
      activeScenario = s;
      scenarioTicks = 0;
      applyScenarioEffects();
      broadcastTick();
    },
    resetScenario: () => {
      activeScenario = null;
      scenarioTicks = 0;
      activeIncidents = [];
      state.pipelines.forEach(p => { p.is_isolated = false; p.valve_status = 'open'; });
      applyScenarioEffects();
      broadcastTick();
    },
    getCurrentLocation: () => LOCATIONS[currentLocKey],
    getLocations: () => LOCATIONS
  };

  console.log('✅ AquaFlow Multi-Location Engine & Offline Simulator Ready (Law Gate, Green Valley, Phagwara, GreenHeights)');
})();
