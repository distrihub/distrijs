import { Component, ViewChild } from '@angular/core';
import { DistriMessage } from '@distri/core';
import { DistriChatComponent } from '@distri/angular/components';
import { IncidentFormComponent } from './incident-form.component';
import { getFormHtml, getFormTools } from './tools';

/**
 * The client comes from `provideDistri(...)` in `app.config.ts` — `<distri-chat>`
 * picks it up from DI, exactly like `@distri/react`'s components read it from
 * `<DistriProvider>`. Nothing to wire up here.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DistriChatComponent, IncidentFormComponent],
  template: `
    <div class="app-shell">
      <div class="app-shell__form">
        <app-incident-form />
      </div>
      <!-- The "dark" class flips the Distri design tokens to their dark values
           for the chat panel only, so it matches the dark shell. -->
      <div class="app-shell__chat dark">
        <distri-chat
          [agentIdOrDef]="agentId"
          [threadId]="threadId"
          [externalTools]="tools"
          [beforeSendMessage]="beforeSendMessage"
          [starterPrompts]="starterPrompts"
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

  agentId = 'form_filler_agent_v2';
  threadId = `form-filler-${Date.now()}`;
  tools = getFormTools(() => this.formComponent);

  /** One click fills the whole form — the point of the demo. */
  starterPrompts = [
    "I'm John Smith (john@example.com). Yesterday we had a phishing attack where several " +
      'employees received fake emails. Medium impact. We should implement additional email filtering.',
  ];

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
