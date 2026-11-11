/**
 * Lost & Found model, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * The three statuses replace the previous boolean `resolved` flag so a report
 * can move from LOST or FOUND to CLAIMED once the owner picks the item up.
 *
 * The page also works as a campus community feed: every post can carry
 * mentions (people you tag, e.g. the student who lost their keys) and a thread
 * of comments.
 */

export type LostFoundStatus = 'LOST' | 'FOUND' | 'CLAIMED';

export const LOST_FOUND_STATUSES: readonly LostFoundStatus[] = ['LOST', 'FOUND', 'CLAIMED'];

export const LOST_FOUND_STATUS_LABELS: Record<LostFoundStatus, string> = {
  LOST: 'Lost',
  FOUND: 'Found',
  CLAIMED: 'Claimed',
};

/** A community comment under a lost & found post. */
export interface LostFoundComment {
  id: string;
  authorId: string;
  message: string;
  createdAt: Date;
  /** People mentioned in the comment (e.g. the owner of the keys). */
  taggedUserIds: string[];
}

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
  /** People mentioned in the post (e.g. the owner of the keys). */
  taggedUserIds: string[];
  /** Conversation under the post, oldest first. */
  comments: LostFoundComment[];
  /** Students who marked the post as helpful ("like"). */
  reactionUserIds: string[];
}

/** Values collected by the composer. */
export interface LostFoundReportInput {
  status: Exclude<LostFoundStatus, 'CLAIMED'>;
  title: string;
  category: string;
  description: string;
  location: string;
  contactPhone?: string;
  reportedAt: Date;
  taggedUserIds?: string[];
}

/** Values collected by a comment composer. */
export interface LostFoundCommentInput {
  message: string;
  taggedUserIds?: string[];
}
