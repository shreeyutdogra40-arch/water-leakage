import axios from 'axios';
import {
  DashboardOverview, Pipeline, WaterTank, LeakageIncident,
  NotificationItem, SensorDetail, SensorReading, BuildingSummary,
  HouseholdSummary, ValveActionRecord, DailyConsumptionPoint,
  BuildingComparisonPoint, WastageAnalysis, User
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginApi = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

export const getMeApi = () => api.get<User>('/auth/me');

// Dashboard & Monitoring
export const getDashboardOverview = () => api.get<DashboardOverview>('/dashboard/overview');
export const getCommunityOverview = () => api.get<any>('/dashboard/community');
export const getLiveMonitoring = () => api.get<any>('/monitoring/live');
export const getSensors = () => api.get<SensorDetail[]>('/monitoring/sensors');
export const getSensorReadings = (limit = 40, anomaliesOnly = false) =>
  api.get<SensorReading[]>(`/monitoring/readings?limit=${limit}&anomalies_only=${anomaliesOnly}`);

// Pipelines & Valves
export const getPipelines = () => api.get<Pipeline[]>('/pipelines');
export const controlValve = (pipelineId: number, action: string, reason: string) =>
  api.post<Pipeline>(`/valves/${pipelineId}/control`, { action, reason });
export const getValveActionsLog = (limit = 30) =>
  api.get<ValveActionRecord[]>(`/valves/actions/log?limit=${limit}`);

// Leakage Incidents
export const getIncidents = (status?: string, severity?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status_filter', status);
  if (severity) params.append('severity_filter', severity);
  return api.get<LeakageIncident[]>(`/leakage/incidents?${params.toString()}`);
};

export const updateIncidentStatus = (id: number, status: string, notes?: string, assignedToUserId?: number) =>
  api.patch<LeakageIncident>(`/leakage/incidents/${id}/status`, {
    status,
    notes,
    assigned_to_user_id: assignedToUserId
  });

export const runMLAnalysis = (hourlyConsumption: number[]) =>
  api.post('/leakage/ml-analyze', { hourly_consumption_24h: hourlyConsumption });

// Water Supply & Tanks
export const getTanks = () => api.get<WaterTank[]>('/water/tanks');
export const getBuildings = () => api.get<BuildingSummary[]>('/water/buildings');
export const getHouseholds = (buildingId?: number) =>
  api.get<HouseholdSummary[]>(`/water/households${buildingId ? `?building_id=${buildingId}` : ''}`);
export const getMyConsumption = () => api.get<any>('/water/my-consumption');

// Alerts
export const getAlerts = (unreadOnly = false) =>
  api.get<NotificationItem[]>(`/alerts?unread_only=${unreadOnly}`);
export const markAlertRead = (id: number) => api.patch<NotificationItem>(`/alerts/${id}/read`);
export const markAllAlertsRead = () => api.post('/alerts/read-all');

// Analytics
export const getConsumptionAnalytics = (days = 14) =>
  api.get<DailyConsumptionPoint[]>(`/analytics/consumption?days=${days}`);
export const getBuildingAnalytics = () => api.get<BuildingComparisonPoint[]>('/analytics/buildings');
export const getWastageAnalysis = (days = 30) =>
  api.get<WastageAnalysis>(`/analytics/wastage?days=${days}`);
export const getLeakageStats = () => api.get<any>('/analytics/leakage');

// Simulation
export const getSimulationState = () => api.get('/simulation/state');
export const toggleSimulation = () => api.post('/simulation/toggle');
export const injectSimulationAnomaly = (scenario: string, pipelineId?: number) =>
  api.post('/simulation/inject', { scenario, pipeline_id: pipelineId });
export const resetSimulation = () => api.post('/simulation/reset');
