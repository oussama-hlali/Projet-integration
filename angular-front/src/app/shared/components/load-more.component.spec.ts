import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadMoreComponent } from './load-more.component';

describe('LoadMoreComponent', () => {
  let fixture: ComponentFixture<LoadMoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadMoreComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadMoreComponent);
  });

  it('shows the visible/total count and a load-more button', () => {
    fixture.componentRef.setInput('total', 12);
    fixture.componentRef.setInput('visible', 6);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.load-more__count')?.textContent).toContain('Showing 6 of 12');
    expect(element.querySelector('button')?.textContent).toContain('Load more');
    expect(element.querySelector('.load-more__remaining')?.textContent).toContain('6 more');
  });

  it('emits loadMore when the button is clicked', () => {
    fixture.componentRef.setInput('total', 12);
    fixture.componentRef.setInput('visible', 6);
    fixture.detectChanges();

    let emitted = 0;
    fixture.componentInstance.loadMore.subscribe(() => emitted++);

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(emitted).toBe(1);
  });

  it('hides the button once everything is visible', () => {
    fixture.componentRef.setInput('total', 6);
    fixture.componentRef.setInput('visible', 6);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('renders nothing for an empty list', () => {
    fixture.componentRef.setInput('total', 0);
    fixture.componentRef.setInput('visible', 0);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.load-more')).toBeNull();
  });

  it('never reports more shown than the total', () => {
    fixture.componentRef.setInput('total', 4);
    fixture.componentRef.setInput('visible', 9);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.load-more__count')?.textContent).toContain('Showing 4 of 4');
    expect(element.querySelector('button')).toBeNull();
  });
});
