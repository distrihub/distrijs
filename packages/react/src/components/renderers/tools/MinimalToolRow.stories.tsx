import type { Meta, StoryObj } from '@storybook/react';
import { MinimalToolRow, getToolSummary } from '@distri/react';
import { mockStates } from './_mockData';

const meta: Meta<typeof MinimalToolRow> = {
  title: 'Tools/MinimalToolRow',
  component: MinimalToolRow,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof MinimalToolRow>;

export const HttpSuccess: Story = {
  render: () => (
    <MinimalToolRow
      summary={getToolSummary('distri_request', { method: 'GET', path: '/public/skills/zippy/grade' })}
      state={mockStates.httpSuccess}
    />
  ),
};

export const HttpError: Story = {
  render: () => (
    <MinimalToolRow
      summary={getToolSummary('distri_request', { method: 'POST', path: '/api/sessions' })}
      state={mockStates.httpError}
    />
  ),
};

export const FileRead: Story = {
  render: () => (
    <MinimalToolRow
      summary={getToolSummary('read_file', { path: 'src/client_config.rs' })}
      state={mockStates.fileRead}
    />
  ),
};

export const FileEdit: Story = {
  render: () => (
    <MinimalToolRow
      summary={getToolSummary('edit_file', { path: 'Cargo.toml' })}
      state={mockStates.fileEdit}
    />
  ),
};

export const Search: Story = {
  render: () => (
    <MinimalToolRow
      summary={getToolSummary('search', { query: 'bearer token' })}
      state={mockStates.searchResult}
    />
  ),
};

export const Running: Story = {
  render: () => (
    <MinimalToolRow
      summary={getToolSummary('execute_shell', { command: 'cargo build --release' })}
      state={mockStates.running}
    />
  ),
};
