import { TestBed } from '@angular/core/testing';
import { LostFoundReportInput } from '../models/lost-found.model';
import { LostFoundService } from './lost-found.service';

const STORAGE_KEY = 'smart-campus.lost-found';

describe('LostFoundService', () => {
  let service: LostFoundService;

  const report = (overrides: Partial<LostFoundReportInput> = {}): LostFoundReportInput => ({
    status: 'FOUND',
    title: 'Chargeur USB-C',
    category: 'Électronique',
    description: 'Chargeur blanc trouvé près des prises de la bibliothèque.',
    location: 'Bibliothèque',
    reportedAt: new Date('2026-11-08T12:00:00'),
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LostFoundService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('seeds posts with mentions, comments and reactions', () => {
    const items = service.items();

    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.taggedUserIds.length > 0)).toBeTrue();
    expect(items.some((item) => item.comments.length > 0)).toBeTrue();
    expect(items.some((item) => item.reactionUserIds.length > 0)).toBeTrue();
    expect(items[0].reportedAt instanceof Date).toBeTrue();
    expect(items[0].comments.every((comment) => comment.createdAt instanceof Date)).toBeTrue();
  });

  it('creates a post attributed to the author with unique tags and persists it', () => {
    const created = service.create(
      report({ taggedUserIds: ['u2', 'u2', 'u3'] }),
      'u1',
    );

    expect(created.reporterId).toBe('u1');
    expect(created.taggedUserIds).toEqual(['u2', 'u3']);
    expect(created.comments).toEqual([]);
    expect(created.reactionUserIds).toEqual([]);
    expect(service.items()[0].id).toBe(created.id);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{
      id: string;
      title: string;
      taggedUserIds: string[];
    }>;
    const persisted = stored.find((item) => item.id === created.id);
    expect(persisted?.title).toBe('Chargeur USB-C');
    expect(persisted?.taggedUserIds).toEqual(['u2', 'u3']);
  });

  it('adds a trimmed comment with mentions and ignores blank or unknown posts', () => {
    const post = service.items()[0];
    const comment = service.addComment(post.id, 'u1', {
      message: '  Merci, je passe le récupérer !  ',
      taggedUserIds: ['u2', 'u2'],
    });

    expect(comment?.authorId).toBe('u1');
    expect(comment?.message).toBe('Merci, je passe le récupérer !');
    expect(comment?.taggedUserIds).toEqual(['u2']);

    const updated = service.findById(post.id);
    expect(updated?.comments.at(-1)?.id).toBe(comment?.id);

    expect(service.addComment(post.id, 'u1', { message: '   ' })).toBeUndefined();
    expect(service.addComment('missing', 'u1', { message: 'Hello' })).toBeUndefined();
  });

  it('toggles a like for the same user without duplicating it', () => {
    const post = service.items()[0];
    const before = post.reactionUserIds.includes('u1');

    const liked = service.toggleReaction(post.id, 'u1');
    expect(liked?.reactionUserIds.includes('u1')).toBe(!before);

    const unliked = service.toggleReaction(post.id, 'u1');
    expect(unliked?.reactionUserIds.includes('u1')).toBe(before);
    expect(service.toggleReaction('missing', 'u1')).toBeUndefined();
  });

  it('moves a post to CLAIMED when the owner is reunited with the item', () => {
    const post = service.items().find((item) => item.status !== 'CLAIMED');

    const claimed = post ? service.claim(post.id) : undefined;

    expect(claimed?.status).toBe('CLAIMED');
  });

  it('loads legacy rows without tags, comments or reactions', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy-1',
          title: 'Parapluie',
          description: 'Parapluie bleu oublié au Bloc A.',
          location: 'Bloc A',
          reportedAt: '2026-11-01T09:00:00.000Z',
          status: 'LOST',
          category: 'Autre',
          reporterId: 'u2',
        },
      ]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const migrated = TestBed.inject(LostFoundService);
    const item = migrated.items()[0];

    expect(item.id).toBe('legacy-1');
    expect(item.reportedAt instanceof Date).toBeTrue();
    expect(item.taggedUserIds).toEqual([]);
    expect(item.comments).toEqual([]);
    expect(item.reactionUserIds).toEqual([]);
  });
});
