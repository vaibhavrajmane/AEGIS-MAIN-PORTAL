export type NavigationScreen =
  | 'global-radar'
  | 'vessel-dossier'
  | 'route-deviation'
  | 'interception-ops'
  | 'tacnav-handheld'
  | 'dsa-matrix'
  | 'ai-sentinel';

export type ThemeMode = 'dark' | 'light';

export interface TrajectoryNode {
  id: string;
  timestamp: string;
  lat: number;
  lng: number;
  speedKts: number;
  headingDeg: number;
  isDarkGap?: boolean;
  notes?: string;
}

export interface ManualStoppageReport {
  reportedAt: string;
  reason: string;
  reportedBy: string;
  status: 'PENDING_REVIEW' | 'VERIFIED_GENUINE' | 'ESCALATED_CRITICAL';
  officerNotes: string;
}

export interface TargetVessel {
  id: string;
  vesselCode: string; // V-001 to V-020 as per AEGIS Specification Matrix
  nickname: string; // Tactical vessel nickname (e.g., OCEAN GHOST, SHADOW REEFER, etc.)
  name: string;
  score: number;
  description: string;
  mmsi: string;
  imo: string;
  callsign: string;
  flag: string;
  flagCode: string;
  flagCategory: string;
  flagOfConvenience: boolean;
  type: string;
  grossTonnage: number;
  lengthMeters: number;
  crewCount: number;
  displacement: string;
  currentCoordinates: string;
  sogKts: number;
  cogDeg: number;
  cogDirection: string;
  calculatedDraft: string;
  draftChange: string;
  lastAisBroadcast: string;
  isOnline: boolean;
  beneficialOwner: string;
  rfmoAuthorization: string;
  aisSpoofingRisk: string;
  infractionAlert: string;
  radarX: number; // percentage in radar view
  radarY: number;
  rotationDeg: number;
  status: 'CRITICAL' | 'ALERTIVE' | 'NORMAL' | 'WARNING' | 'ALERT';
  dashboardStatus: 'CRITICAL' | 'ALERTIVE' | 'NORMAL';
  behavioralTrigger: string; // Exact trigger from 20-vessel matrix
  systemAction: string; // Exact action / dispatch from matrix
  algorithmUsed: string; // Graph traversal, DLL, Spatial Hash, Priority Queue, Binary Search, etc.
  dsaComplexity: string; // e.g. O(V + E), O(1), O(log N), O(N log N)
  stoppageMinutes?: number;
  trajectoryDLL?: TrajectoryNode[];
  manualStoppageReport?: ManualStoppageReport;
  sanctuaryTrespass?: boolean;
  signalTurnedOff?: boolean;
}

export interface AnomalyStop {
  id: string;
  coordinates: string;
  jurisdiction: string;
  startUtc: string;
  duration: string;
  driftSog: string;
  activityCluster: string;
  severity: 'Severe Incursion' | 'Critical Encounter' | 'Suspicious Dwell' | 'Minor Drift';
  clusterColor: string;
}

export interface HistoricalVoyage {
  id: string;
  originDest: string;
  schedVsActual: string;
  isActualHighlight?: boolean;
  excessDelay: string;
  stopEvents: string;
  threatLabel: string;
  threatScore: number;
  threatLevel: 'CRITICAL' | 'HIGH' | 'LOW';
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'primary' | 'error' | 'success';
}

export interface DsaPerformanceMetric {
  metric: string;
  targetImprovement: string;
  methodology: string;
  dataStructure: string;
  complexity: string;
  status: string;
}

export interface WildlifeSpeciesThreat {
  speciesName: string;
  scientificName: string;
  annualImpact: string;
  status: string;
  tagTech: string;
  sdgGoal: string;
  keyRisk: string;
}

export interface RouteAnomalyStop {
  id: string;
  name: string;
  x: number;
  y: number;
  hours: string;
  activity: string;
  color: string;
  severity: 'Severe Incursion' | 'Critical Encounter' | 'Suspicious Dwell' | 'Minor Drift';
  coordinates: string;
}

export interface VesselRouteProfile {
  vesselCode: string;
  departurePort: string;
  departureDate: string;
  destinationPort: string;
  expectedTripTime: string;
  expectedDistanceMiles: string;
  actualTimeTaken: string;
  timeDeviationPercent: string;
  extraDelayHours: string;
  delayStopsSummary: string;
  startPoint: { x: number; y: number; label: string };
  destPoint: { x: number; y: number; label: string };
  plannedPathD: string;
  actualPathD: string;
  protectedZone: {
    points: string;
    label: string;
    labelX: number;
    labelY: number;
  };
  anomalyStops: RouteAnomalyStop[];
  currentPoint: { x: number; y: number };
  tacticalSummary: string;
  anomalyTableStops: AnomalyStop[];
  voyages: HistoricalVoyage[];
}

