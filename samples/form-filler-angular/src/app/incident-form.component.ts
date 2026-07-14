import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface IncidentFormData {
  fullName: string;
  email: string;
  incidentType: string;
  dateOfIncident: string;
  impactLevel: string;
  description: string;
  suggestedActions: string;
}

const defaultValues: IncidentFormData = {
  fullName: '',
  email: '',
  incidentType: '',
  dateOfIncident: '',
  impactLevel: '',
  description: '',
  suggestedActions: '',
};

const incidentTypeOptions = ['Data Breach', 'Unauthorized Access', 'Malware', 'Phishing', 'Other'];
const impactLevelOptions = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Angular port of the React sample's IncidentForm. Angular has no
 * `useImperativeHandle` equivalent, so the parent gets at this component's
 * `setValue`/`getValues`/`reset`/`submit`/`getFieldOptions` API the native
 * way: via `@ViewChild(IncidentFormComponent)`.
 */
@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2 class="title">Security Incident Report</h2>
          <p class="subtitle">Please fill out the form below to report an incident</p>
        </div>

        <form class="form" (submit)="onSubmit($event)">
          <div class="field-group">
            <label class="label">Full Name</label>
            <input class="input" type="text" [(ngModel)]="data.fullName" name="fullName" placeholder="Enter your full name" (ngModelChange)="onDirty()" />
          </div>

          <div class="field-group">
            <label class="label">Email</label>
            <input class="input" type="email" [(ngModel)]="data.email" name="email" placeholder="your.email@company.com" (ngModelChange)="onDirty()" />
          </div>

          <div class="row">
            <div class="field-group-half">
              <label class="label">Incident Type</label>
              <select class="select" [(ngModel)]="data.incidentType" name="incidentType" (ngModelChange)="onDirty()">
                <option value="">Select type...</option>
                @for (opt of incidentTypeOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </div>
            <div class="field-group-half">
              <label class="label">Date of Incident</label>
              <input class="input" type="date" [(ngModel)]="data.dateOfIncident" name="dateOfIncident" (ngModelChange)="onDirty()" />
            </div>
          </div>

          <div class="field-group">
            <label class="label">Impact Level</label>
            <select class="select" [(ngModel)]="data.impactLevel" name="impactLevel" (ngModelChange)="onDirty()">
              <option value="">Select impact level...</option>
              @for (opt of impactLevelOptions; track opt) {
                <option [value]="opt">{{ opt }}</option>
              }
            </select>
          </div>

          <div class="field-group">
            <label class="label">Incident Description</label>
            <textarea class="textarea" rows="4" [(ngModel)]="data.description" name="description" placeholder="Describe the incident in detail..." (ngModelChange)="onDirty()"></textarea>
          </div>

          <div class="field-group">
            <label class="label">Suggested Actions</label>
            <textarea class="textarea" rows="3" [(ngModel)]="data.suggestedActions" name="suggestedActions" placeholder="Any recommended actions or remediation steps..." (ngModelChange)="onDirty()"></textarea>
          </div>

          @if (submitStatus() === 'success') {
            <div class="success-message">Report submitted successfully!</div>
          }
          @if (submitStatus() === 'error') {
            <div class="error-message">Please fill in all required fields.</div>
          }

          <button type="submit" class="submit-button">Submit Report</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container { display: flex; align-items: flex-start; justify-content: center; padding: 24px; height: 100%; overflow: auto; background: #0f0f1a; box-sizing: border-box; }
    .card { width: 100%; max-width: 480px; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.3); overflow: hidden; }
    .header { padding: 24px 24px 16px; border-bottom: 1px solid #e5e7eb; }
    .title { margin: 0; font-size: 20px; font-weight: 600; color: #111827; }
    .subtitle { margin: 6px 0 0; font-size: 14px; color: #6b7280; }
    .form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-group-half { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; gap: 12px; }
    .label { font-size: 13px; font-weight: 500; color: #374151; }
    .input, .select, .textarea { padding: 10px 12px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; background: #fff; color: #111827; font-family: inherit; }
    .textarea { resize: vertical; }
    .select { cursor: pointer; }
    .submit-button { margin-top: 8px; padding: 12px 20px; font-size: 14px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border: none; border-radius: 8px; cursor: pointer; }
    .success-message { padding: 12px 16px; background: #d1fae5; color: #065f46; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .error-message { padding: 12px 16px; background: #fee2e2; color: #991b1b; border-radius: 8px; font-size: 14px; font-weight: 500; }
  `],
})
export class IncidentFormComponent {
  data: IncidentFormData = { ...defaultValues };
  submitStatus = signal<'idle' | 'success' | 'error'>('idle');

  readonly incidentTypeOptions = incidentTypeOptions;
  readonly impactLevelOptions = impactLevelOptions;

  onDirty(): void {
    this.submitStatus.set('idle');
  }

  setValue(field: keyof IncidentFormData, value: string): void {
    this.data = { ...this.data, [field]: value };
    this.submitStatus.set('idle');
  }

  getValues(): IncidentFormData {
    return this.data;
  }

  reset(): void {
    this.data = { ...defaultValues };
    this.submitStatus.set('idle');
  }

  async submit(): Promise<{ success: boolean; message: string }> {
    const required: (keyof IncidentFormData)[] = ['fullName', 'email', 'incidentType', 'dateOfIncident', 'impactLevel', 'description'];
    const missing = required.filter((field) => !this.data[field]);

    if (missing.length > 0) {
      this.submitStatus.set('error');
      return { success: false, message: `Missing required fields: ${missing.join(', ')}` };
    }

    this.submitStatus.set('success');
    return { success: true, message: 'Security incident report submitted successfully!' };
  }

  getFieldOptions(field: string): string[] | null {
    if (field === 'incidentType') return incidentTypeOptions;
    if (field === 'impactLevel') return impactLevelOptions;
    return null;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    void this.submit();
  }
}
