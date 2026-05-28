import type { Meta } from '@storybook/react';
import { MinimalToolRow, RichToolCard, getToolSummary } from '@distri/react';
import { mockStates } from './_mockData';

const meta: Meta = {
  title: 'Tools/ToolSequence',
  parameters: { layout: 'padded' },
};
export default meta;

const sequence = [
  { state: mockStates.fileRead, name: 'read_file', input: { path: 'lesson.docx' } },
  { state: mockStates.httpSuccess, name: 'distri_request', input: { method: 'POST', path: '/activities' } },
  { state: mockStates.searchResult, name: 'search', input: { query: 'student submissions' } },
  { state: mockStates.fileEdit, name: 'edit_file', input: { path: 'results.json' } },
  { state: mockStates.httpError, name: 'distri_request', input: { method: 'POST', path: '/api/sessions' } },
];

export const MinimalSequence = {
  render: () => (
    <div className="space-y-0.5 max-w-xl">
      {sequence.map(({ state, name, input }, i) => (
        <MinimalToolRow key={i} summary={getToolSummary(name, input)} state={state} />
      ))}
    </div>
  ),
};

export const RichSequence = {
  render: () => (
    <div className="space-y-2 max-w-xl">
      {sequence.map(({ state, name, input }, i) => (
        <RichToolCard key={i} summary={getToolSummary(name, input)} state={state} />
      ))}
    </div>
  ),
};
