export type UserRole = 'admin' | 'maintenance' | 'resident';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  household_id?: number | null;
  phone_number?: string | null;
  is_active: boolean;
  created_at: string;
}

export type ValveStatus = 'open' | 'closed' | 'throttled';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'detected' | 'acknowledged' | 'assigned' | 'resolved' | 'closed';
export type TankType = 'main_reservoir' | 'overhead_tank' | 'underground_sump';

export interface Pipeline {
  id: number;
  community_id: number;
  building_id?: number | null;
  name: string;
  code: string;
  material: string;
  diameter_mm: number;
  max_pressure_bar: number;
  nominal_pressure_bar: number;
  normal_flow_lpm: number;
  valve_status: ValveStatus;
  is_isolated: boolean;
  current_flow_lpm: number;
  current_pressure_bar: number;
  updated_at: string;
}

export interface WaterTank {
  id: number;
  community_id: number;
  building_id?: number | null;
  name: string;
  tank_type: TankType;
  capacity_litres: number;
  current_level_litres: number;
  current_level_percentage: number;
  height_meters: number;
  low_level_threshold_pct: number;
  is_filling: boolean;
  updated_at: string;
}

export interface LeakageIncident {
  id: number;
  pipeline_id: number;
  pipeline_code?: string;
  pipeline_name?: string;
  household_id?: number | null;
  household_unit?: string | null;
  building_id?: number | null;
  building_name?: string | null;
  detected_at: string;
  severity: IncidentSeverity;
  flow_rate: number;
  pressure_reading: number;
  confidence_score: number;
  detection_reason: string;
  status: IncidentStatus;
  assigned_to_user_id?: number | null;
  assigned_technician_name?: string | null;
  resolved_at?: string | null;
  notes?: string | null;
  estimated_water_lost_litres: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number | null;
  incident_id?: number | null;
  title: string;
  message: string;
  alert_type: string;
  severity: IncidentSeverity;
  is_read: boolean;
  created_at: string;
}

export interface SensorDetail {
  id: number;
  sensor_code: string;
  name: string;
  sensor_type: string;
  hardware_model: string;
  is_online: boolean;
  last_heartbeat: string;
  battery_level: number;
  pipeline_id?: number | null;
  tank_id?: number | null;
}

export interface SensorReading {
  id: number;
  sensor_id: number;
  sensor_code?: string;
  timestamp: string;
  flow_rate_lpm?: number | null;
  pressure_bar?: number | null;
  tank_level_percentage?: number | null;
  distance_cm?: number | null;
  is_anomaly: boolean;
  anomaly_reason?: string | null;
}

export interface DashboardOverview {
  total_water_supplied_litres: number;
  total_water_consumed_litres: number;
  current_total_flow_lpm: number;
  average_pipeline_pressure_bar: number;
  main_reservoir_level_pct: number;
  main_reservoir_litres: number;
  overhead_tanks_average_pct: number;
  active_leakage_incidents_count: number;
  critical_incidents_count: number;
  connected_sensors_count: number;
  total_sensors_count: number;
  isolated_valves_count: number;
  estimated_water_wastage_litres: number;
  simulation_active: boolean;
  active_anomaly_scenario?: string | null;
  timestamp: string;
}

export interface BuildingSummary {
  id: number;
  community_id: number;
  name: string;
  block_code: string;
  total_households: number;
  today_consumption_litres: number;
  current_flow_lpm: number;
  tank_name?: string | null;
  tank_level_pct?: number | null;
  active_leaks_count: number;
}

export interface HouseholdSummary {
  id: number;
  building_id: number;
  building_name?: string;
  unit_number: string;
  resident_name: string;
  contact_phone?: string | null;
  meter_id: string;
  daily_quota_litres: number;
  current_day_usage_litres: number;
  quota_usage_percentage: number;
  has_anomaly: boolean;
}

export interface ValveActionRecord {
  id: number;
  pipeline_id: number;
  pipeline_name?: string;
  triggered_by_user_id?: number | null;
  triggered_by_name?: string;
  action_type: string;
  reason: string;
  previous_status: string;
  new_status: string;
  timestamp: string;
}

export interface DailyConsumptionPoint {
  date: string;
  supplied_litres: number;
  consumed_litres: number;
  wastage_litres: number;
  efficiency_pct: number;
}

export interface BuildingComparisonPoint {
  building_id: number;
  building_name: string;
  total_consumption_litres: number;
  household_avg_litres: number;
  quota_litres: number;
  excess_litres: number;
}

export interface WastageAnalysis {
  total_supplied_period_litres: number;
  total_consumed_period_litres: number;
  total_wastage_litres: number;
  leakage_loss_litres: number;
  unaccounted_loss_litres: number;
  wastage_percentage: number;
  financial_loss_estimate: number;
  prevented_wastage_litres: number;
}
