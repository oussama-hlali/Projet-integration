import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('adds a success toast with an auto-dismiss timer', fakeAsync(() => {
    const id = service.success('Saved', 'Your changes are live.');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].id).toBe(id);
    expect(service.toasts()[0].tone).toBe('success');

    tick(5_000);
    expect(service.toasts()).toEqual([]);
  }));

  it('keeps error toasts on screen longer than success toasts', fakeAsync(() => {
    service.error('Failed');
    tick(5_000);
    expect(service.toasts().length).toBe(1);

    tick(3_000);
    expect(service.toasts()).toEqual([]);
  }));

  it('dismisses a single toast and cancels its timer', fakeAsync(() => {
    const first = service.info('One');
    service.info('Two');

    service.dismiss(first);

    expect(service.toasts().map((toast) => toast.title)).toEqual(['Two']);

    // The dismissed toast's timer must not fire later and remove the other one.
    tick(6_000);
    expect(service.toasts()).toEqual([]);
  }));

  it('never stacks more than four toasts', () => {
    for (const title of ['One', 'Two', 'Three', 'Four', 'Five']) {
      service.show('info', title, undefined, 0);
    }

    expect(service.toasts().map((toast) => toast.title)).toEqual([
      'Two',
      'Three',
      'Four',
      'Five',
    ]);
  });

  it('clear removes every toast', () => {
    service.success('One', undefined, 0);
    service.warning('Two', undefined, 0);

    service.clear();

    expect(service.toasts()).toEqual([]);
  });

  it('does not schedule a timer when duration is zero', fakeAsync(() => {
    service.success('Sticky', undefined, 0);

    tick(60_000);

    expect(service.toasts().length).toBe(1);
  }));
});
