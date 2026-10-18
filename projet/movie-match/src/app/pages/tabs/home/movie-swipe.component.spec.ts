import { TestBed } from '@angular/core/testing';
import { MovieSwipeComponent } from './movie-swipe.component';

describe('Movie swipe gestures', () => {
  function setup() {
    const fixture = TestBed.createComponent(MovieSwipeComponent);
    fixture.componentRef.setInput('movie', { id: 1, title: 'Test movie' });
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('article') as HTMLElement;
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    return { fixture, card, selected };
  }

  function pointer(card: HTMLElement, type: string, x: number, y: number) {
    card.dispatchEvent(new PointerEvent(type, { pointerId: 1, button: 0, isPrimary: true,
      clientX: x, clientY: y, bubbles: true }));
  }

  it('likes on a right swipe and passes on a left swipe', () => {
    const { card, selected } = setup();
    pointer(card, 'pointerdown', 100, 100);
    pointer(card, 'pointermove', 230, 110);
    pointer(card, 'pointerup', 230, 110);
    expect(selected).toHaveBeenLastCalledWith('like');
    pointer(card, 'pointerdown', 230, 100);
    pointer(card, 'pointerup', 100, 110);
    expect(selected).toHaveBeenLastCalledWith('pass');
  });

  it('does not treat taps, vertical scrolling, or cancelled gestures as choices', () => {
    const { card, selected } = setup();
    pointer(card, 'pointerdown', 100, 100);
    pointer(card, 'pointerup', 120, 100);
    pointer(card, 'pointerdown', 100, 100);
    pointer(card, 'pointerup', 200, 300);
    pointer(card, 'pointerdown', 100, 100);
    pointer(card, 'pointermove', 230, 100);
    pointer(card, 'pointercancel', 230, 100);
    pointer(card, 'pointerup', 230, 100);
    expect(selected).not.toHaveBeenCalled();
  });

  it('disables gestures while a favorite is being saved', () => {
    const { fixture, card, selected } = setup();
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    pointer(card, 'pointerdown', 100, 100);
    pointer(card, 'pointerup', 230, 100);
    expect(selected).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('button.like').disabled).toBe(true);
  });
});
