/**
 * Lost & Found model, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * The three statuses replace the previous boolean `resolved` flag so a report
 * can move from LOST or FOUND to CLAIMED once the owner picks the item up.
 */

export type LostFoundStatus = 'LOST' | 'FOUND' | 'CLAIMED';

export const LOST_FOUND_STATUSES: readonly LostFoundStatus[] = ['LOST', 'FOUND', 'CLAIMED'];

export const LOST_FOUND_STATUS_LABELS: Record<LostFoundStatus, string> = {
  LOST: 'Lost',
  FOUND: 'Found',
  CLAIMED: 'Claimed',
};

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  location: string;
  reportedAt: Date;
  status: LostFoundStatus;
  category: string;
  contactPhone?: string;
  reporterId: string;
}

/** Values collected by the report form. */
export type LostFoundReportInput = Omit<
  LostFoundItem,
  'id' | 'reportedAt' | 'status' | 'reporterId'
> & {
  status: Exclude<LostFoundStatus, 'CLAIMED'>;
  reportedAt: Date;
};
