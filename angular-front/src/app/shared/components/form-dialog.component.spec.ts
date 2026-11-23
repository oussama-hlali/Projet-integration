import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormDialogComponent } from './form-dialog.component';

describe('FormDialogComponent', () => {
  let fixture: ComponentFixture<FormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormDialogComponent);
    fixture.componentRef.setInput('title', 'New room');
    fixture.componentRef.setInput('formId', 'test-room-form');
  });

  it('renders nothing while closed', () => {
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.dialog')).toBeNull();
  });

  it('exposes an accessible dialog and links submit to the form id', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('subtitle', 'Register a new bookable space.');
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('.dialog');
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    const labelledBy = dialog?.getAttribute('aria-labelledby');
    expect(labelledBy && dialog?.querySelector(`#${labelledBy}`)?.textContent).toContain('New room');

    const submit = (fixture.nativeElement as HTMLElement).querySelector('.submit');
    expect(submit?.getAttribute('form')).toBe('test-room-form');
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
});
