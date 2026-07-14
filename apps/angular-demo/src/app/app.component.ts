import { Component } from '@angular/core';
import { DistriClient } from '@distri/core';
import { DistriChatComponent } from '@distri/angular/components';

/**
 * Minimal proof that @distri/angular works: resolves an agent and drives a
 * live chat via <distri-chat>. No attempt at UI parity with the React demo —
 * see @distri/angular's basic components (message list, input, tool-call
 * row, typing indicator) for what's covered in v1.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DistriChatComponent],
  template: `
    <div class="app-shell">
      <header class="app-shell__header">Distri Angular Demo</header>
      <distri-chat
        class="app-shell__chat"
        [client]="client"
        [agentIdOrDef]="agentId"
        [threadId]="threadId"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: system-ui, sans-serif;
    }
    .app-shell__header {
      padding: 12px 16px;
      font-weight: 600;
      border-bottom: 1px solid rgba(127, 127, 127, 0.25);
    }
    .app-shell__chat {
      flex: 1;
      min-height: 0;
    }
  `],
})
export class AppComponent {
  client = new DistriClient({
    baseUrl: (window as unknown as { DISTRI_API_URL?: string }).DISTRI_API_URL ?? 'http://localhost:8080',
  });
  agentId = 'default';
  threadId = 'angular-demo-thread';
}
