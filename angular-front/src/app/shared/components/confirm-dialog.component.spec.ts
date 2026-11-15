import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent (keyboard)', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('message', 'Remove this item?');
  });

  it('renders nothing while closed', () => {
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.dialog')).toBeNull();
  });

  it('exposes an accessible alertdialog with label and description ids', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('.dialog');
    expect(dialog?.getAttribute('role')).toBe('alertdialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    const labelledBy = dialog?.getAttribute('aria-labelledby');
    const describedBy = dialog?.getAttribute('aria-describedby');
    expect(labelledBy && dialog?.querySelector(`#${labelledBy}`)).toBeTruthy();
    expect(describedBy && dialog?.querySelector(`#${describedBy}`)).toBeTruthy();
  });

  it('cancels on Escape', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let cancelled = 0;
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);

    (fixture.nativeElement as HTMLElement)
      .querySelector('.dialog')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cancelled).toBe(1);
    expect(fixture.componentInstance.open()).toBeFalse();
  });

  it('confirms and closes', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let confirmed = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);

    fixture.componentInstance.confirm();

    expect(confirmed).toBe(1);
    expect(fixture.componentInstance.open()).toBeFalse();
  });
});
