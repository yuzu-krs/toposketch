import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

/** 右下のトースト通知。 */
@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-sm shadow-lg backdrop-blur"
          [class.bg-green-600/95]="toast.kind === 'success'"
          [class.bg-red-600/95]="toast.kind === 'error'"
          [class.bg-slate-800/95]="toast.kind === 'info'"
          [class.text-white]="true"
        >
          <span class="shrink-0 pt-0.5">
            @switch (toast.kind) {
              @case ('success') {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              }
              @case ('error') {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              }
              @default {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>
              }
            }
          </span>
          <span class="leading-snug">{{ toast.message }}</span>
          <button class="ml-1 shrink-0 opacity-60 hover:opacity-100" (click)="toasts.dismiss(toast.id)" title="閉じる">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  readonly toasts = inject(ToastService);
}
