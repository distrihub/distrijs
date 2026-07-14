import { Component, ViewChild } from '@angular/core';
import { DistriClient, DistriMessage } from '@distri/core';
import { DistriChatComponent } from '@distri/angular/components';
import { IncidentFormComponent } from './incident-form.component';
import { getFormHtml, getFormTools } from './tools';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DistriChatComponent, IncidentFormComponent],
  template: `
    <div class="app-shell">
      <div class="app-shell__form">
        <app-incident-form />
      </div>
      <div class="app-shell__chat">
        <distri-chat
          [client]="client"
          [agentIdOrDef]="agentId"
          [threadId]="threadId"
          [externalTools]="tools"
          [beforeSendMessage]="beforeSendMessage"
        />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .app-shell { display: flex; height: 100%; }
    .app-shell__form { flex: 1; position: relative; overflow: hidden; }
    .app-shell__chat { width: 380px; border-left: 1px solid rgba(255,255,255,0.1); height: 100%; }
  `],
})
export class AppComponent {
  @ViewChild(IncidentFormComponent) private formComponent?: IncidentFormComponent;

  client = new DistriClient({
    baseUrl: (window as unknown as { DISTRI_API_URL?: string }).DISTRI_API_URL ?? 'http://localhost:8080',
  });
  agentId = 'form_filler_agent_v2';
  threadId = `form-filler-${Date.now()}`;
  tools = getFormTools(() => this.formComponent);

  // Injects the form's HTML structure as context so the agent knows which
  // fields/options are available before it decides which tool to call.
  beforeSendMessage = async (message: DistriMessage): Promise<DistriMessage> => {
    const formContextPart = {
      part_type: 'text' as const,
      data: `[Form HTML for analysis]\n${getFormHtml()}`,
    };
    return { ...message, parts: [formContextPart, ...(message.parts || [])] };
  };
}
