import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AnnouncementService } from './announcement.service';

const API = 'http://localhost:8080/api/v1/announcements';

interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  authorId?: string | null;
  createdAt: string;
}

function dto(overrides: Partial<AnnouncementDto> = {}): AnnouncementDto {
  return {
    id: 'a1',
    title: 'Campus notice',
    body: 'Read this before Friday.',
    category: 'GENERAL',
    pinned: false,
    authorId: 'u3',
    createdAt: '2026-11-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AnnouncementService);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(rows: AnnouncementDto[] = []): void {
    const request = http.expectOne(API);
    expect(request.request.method).toBe('GET');
    request.flush(rows);
  }

  it('maps Supabase rows into the frontend announcement model', () => {
    flushInitialLoad([dto({ pinned: true, category: 'ACADEMIC' })]);

    const items = service.announcements();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('a1');
    expect(items[0].content).toBe('Read this before Friday.');
    expect(items[0].publishedAt).toEqual(new Date('2026-11-20T10:00:00.000Z'));
    expect(items[0].category).toBe('ACADEMIC');
    expect(items[0].pinned).toBeTrue();
  });

  it('creates an announcement with the backend body field', () => {
    flushInitialLoad();
    let created: { id: string } | undefined;
    service
      .create({
        title: 'New notice',
        content: 'Details here',
        category: 'EVENTS',
        pinned: false,
        authorId: 'admin-1',
      })
      .subscribe((value) => (created = value));

    const request = http.expectOne(API);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'New notice',
      body: 'Details here',
      category: 'EVENTS',
      pinned: false,
      authorId: 'admin-1',
    });
    request.flush(dto({ id: 'a9', title: 'New notice', body: 'Details here', category: 'EVENTS' }));

    expect(created?.id).toBe('a9');
    expect(service.announcements()[0].content).toBe('Details here');
  });

  it('updates only the changed fields and refreshes the signal', () => {
    flushInitialLoad([dto()]);
    service.update('a1', { pinned: true }).subscribe();

    const request = http.expectOne(`${API}/a1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ pinned: true });
    request.flush(dto({ pinned: true }));

    expect(service.announcements()[0].pinned).toBeTrue();
  });

  it('deletes an announcement and removes it from the signal', () => {
    flushInitialLoad([dto()]);
    service.remove('a1').subscribe();

    const request = http.expectOne(`${API}/a1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(service.announcements()).toEqual([]);
  });
});
