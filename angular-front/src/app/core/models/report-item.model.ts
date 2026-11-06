export type ReportType = 'lost' | 'found';

export interface ReportItemPayload {
  type: ReportType;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contactPhone?: string;
}