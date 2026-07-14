import { Component, ViewChild } from '@angular/core';
import { DistriClient } from '@distri/core';
import { DistriChatComponent } from '@distri/angular/components';
import { DataReconciliationGridComponent } from './data-reconciliation-grid.component';
import { getReconciliationTools } from './tools';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DistriChatComponent, DataReconciliationGridComponent],
  template: `
    <div class="app-shell">
      <div class="app-shell__grid">
        <app-data-reconciliation-grid />
      </div>
      <div class="app-shell__chat">
        <distri-chat
          [client]="client"
          [agentIdOrDef]="agentId"
          [threadId]="threadId"
          [externalTools]="tools"
        />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .app-shell { display: flex; height: 100%; }
    .app-shell__grid { flex: 1; position: relative; overflow: hidden; }
    .app-shell__chat { width: 380px; border-left: 1px solid rgba(255,255,255,0.1); height: 100%; }
  `],
})
export class AppComponent {
  @ViewChild(DataReconciliationGridComponent) private gridComponent?: DataReconciliationGridComponent;

  client = new DistriClient({
    baseUrl: (window as unknown as { DISTRI_API_URL?: string }).DISTRI_API_URL ?? 'http://localhost:8080',
  });
  agentId = 'reconciliation_agent';
  threadId = `reconciliation-${Date.now()}`;
  tools = getReconciliationTools(() => this.gridComponent);
}
