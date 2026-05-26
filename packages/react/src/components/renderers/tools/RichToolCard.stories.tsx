import type { Meta, StoryObj } from '@storybook/react';
import { RichToolCard, getToolSummary } from '@distri/react';
import { mockStates } from './_mockData';

const meta: Meta<typeof RichToolCard> = {
  title: 'Tools/RichToolCard',
  component: RichToolCard,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof RichToolCard>;

export const HttpCollapsed: Story = {
  render: () => (
    <RichToolCard
      summary={getToolSummary('distri_request', { method: 'GET', path: '/public/skills/zippy/grade' })}
      state={mockStates.httpSuccess}
    />
  ),
};

export const HttpErrorExpanded: Story = {
  render: () => (
    <RichToolCard
      summary={getToolSummary('distri_request', { method: 'POST', path: '/api/sessions' })}
      state={mockStates.httpError}
    />
  ),
};

export const FileEditWithDiff: Story = {
  render: () => (
    <RichToolCard
      summary={getToolSummary('edit_file', { path: 'Cargo.toml' })}
      state={mockStates.fileEdit}
    />
  ),
};

export const SearchResults: Story = {
  render: () => (
    <RichToolCard
      summary={getToolSummary('search', { query: 'bearer token' })}
      state={mockStates.searchResult}
    />
  ),
};
