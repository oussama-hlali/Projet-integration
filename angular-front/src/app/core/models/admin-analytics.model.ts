/** Shapes returned by /api/v1/ai/admin/** (US-24 … US-50). */

export interface HealthMetric {
  key: string;
  label: string;
  value: number;
  status: 'GREEN' | 'AMBER' | 'RED';
  detail: string;
}

export interface RecommendedAction {
  title: string;
  owner: string;
  impact: string;
  rationale: string;
}

export interface KpiAnalysis {
  healthScore: number;
  summary: string;
  metrics: HealthMetric[];
  actions: RecommendedAction[];
  basis: string;
}

export interface Anomaly {
  metric: string;
  value: number;
  expected: number;
  zScore: number;
  deviationPct: number;
  correlation: string;
  explanation: string;
}

export interface AnomalyAnalysis {
  anomalies: Anomaly[];
  total: number;
  basis: string;
}

export interface SeasonalityMonth {
  month: string;
  index: number;
  peak: boolean;
  trough: boolean;
  note: string;
}

export interface SeasonalityAnalysis {
  months: SeasonalityMonth[];
  ramadanEffect: string;
  stockRecommendations: string[];
  basis: string;
}

export interface StockItem {
  id: string;
  name: string;
  abcClass: string;
  annualDemand: number;
  unitCost: number;
  eoq: number;
  reorderPoint: number;
  safetyStock: number;
  recommendation: string;
}

export interface StockAnalysis {
  items: StockItem[];
  totalInvestment: number;
  basis: string;
}

export interface ChurnSubject {
  id: string;
  name: string;
  score: number;
  trend: string;
  plan: string;
}

export interface ChurnAnalysis {
  subjects: ChurnSubject[];
  atRiskCount: number;
  basis: string;
}

export interface ForecastPoint {
  month: string;
  p10: number;
  p50: number;
  p90: number;
}

export interface ForecastAnalysis {
  points: ForecastPoint[];
  confidence: number;
  narrative: string;
  basis: string;
}

export interface RiskItem {
  horizon: string;
  title: string;
  exposure: number;
  action: string;
  owner: string;
}

export interface RiskBriefing {
  totalExposure: number;
  risks: RiskItem[];
  narrative: string;
  basis: string;
}

export interface AdminAnalyticsBundle {
  kpi: KpiAnalysis;
  anomalies: AnomalyAnalysis;
  seasonality: SeasonalityAnalysis;
  stock: StockAnalysis;
  churn: ChurnAnalysis;
  churnV2: ChurnAnalysis;
  forecast: ForecastAnalysis;
  risk: RiskBriefing;
}
