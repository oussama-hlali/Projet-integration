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

/** A report as stored in the Lost & Found list. */
export interface ReportItem extends ReportItemPayload {
  id: number;
  resolved: boolean;
}
