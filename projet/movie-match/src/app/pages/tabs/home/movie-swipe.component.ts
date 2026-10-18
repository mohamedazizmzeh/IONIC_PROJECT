import { Component, OnChanges, SimpleChanges, input, output, signal } from '@angular/core';
import { TmdbMovie } from '../../../core/services/tmdb.service';

@Component({
  selector: 'app-movie-swipe',
  standalone: true,
  templateUrl: './movie-swipe.component.html'
})
export class MovieSwipeComponent implements OnChanges {
  movie = input<TmdbMovie>();
  poster = input('');
  nextPoster = input('');
  progress = input('');
  busy = input(false);
  favorite = input(false);
  canRewind = input(false);
  selected = output<'like' | 'pass'>();
  undo = output<void>();
  restart = output<void>();
  dragX = signal(0);
  dragging = signal(false);
  imageUnavailable = signal(false);
  private pointer?: { id: number; x: number; y: number };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['movie']) {
      this.cancelDrag();
      this.imageUnavailable.set(false);
    }
  }

  select(direction: 'like' | 'pass') {
    if (!this.busy() && this.movie()) this.selected.emit(direction);
  }

  pointerDown(event: PointerEvent) {
    if (this.busy() || !this.movie() || event.button !== 0 || !event.isPrimary || this.pointer) return;
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  pointerMove(event: PointerEvent) {
    if (this.pointer?.id !== event.pointerId || this.busy()) return;
    const x = event.clientX - this.pointer.x;
    const y = event.clientY - this.pointer.y;
    this.dragging.set(Math.abs(x) > 8 && Math.abs(x) > Math.abs(y));
    this.dragX.set(this.dragging() ? x : 0);
  }

  pointerUp(event: PointerEvent) {
    if (this.pointer?.id !== event.pointerId) return;
    const x = event.clientX - this.pointer.x;
    const y = event.clientY - this.pointer.y;
    const element = event.currentTarget as HTMLElement;
    if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
    this.cancelDrag();
    if (Math.abs(x) >= 80 && Math.abs(x) > Math.abs(y) * 1.2) this.select(x > 0 ? 'like' : 'pass');
  }

  cancelDrag() {
    this.pointer = undefined;
    this.dragX.set(0);
    this.dragging.set(false);
  }
}
