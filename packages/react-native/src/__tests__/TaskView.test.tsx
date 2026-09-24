import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import type { Agent, DistriEvent } from '@distri/core';
import * as native from '../index';

vi.mock('react-native', async () => import('./react-native.mock'));

afterEach(cleanup);

describe('native TaskView', () => {
  it('exports a read-only native task activity view', () => {
    expect(native.TaskView).toBeTypeOf('function');
  });

  it('renders a followed task transcript without a composer', async () => {
    const taskId = 'task-view-1';
    const asEvent = (event: DistriEvent) => event;
    const agent = {
      resubscribe: async function* () {
        yield asEvent({ type: 'text_message_start', taskId, data: { message_id: 'task-message', step_id: 's1', role: 'assistant' } });
        yield asEvent({ type: 'text_message_content', taskId, data: { message_id: 'task-message', step_id: 's1', delta: 'Read-only task result' } });
        yield asEvent({ type: 'text_message_end', taskId, data: { message_id: 'task-message', step_id: 's1' } });
        yield asEvent({ type: 'run_finished', taskId, data: { taskId } });
      },
    } as unknown as Agent;
    const api = native as unknown as { TaskView: React.ComponentType<{ agent: Agent; taskId: string }> };

    const { container } = render(<api.TaskView agent={agent} taskId={taskId} />);
    await waitFor(() => expect(screen.getByText('Read-only task result')).toBeTruthy());

    expect(container.querySelector('textarea')).toBeNull();
    expect(screen.getByLabelText('Task activity')).toBeTruthy();
  });

  it('keeps forked task messages inside their native subtask card', async () => {
    const taskId = 'root-task';
    const asEvent = (event: DistriEvent) => event;
    const agent = {
      resubscribe: async function* () {
        yield asEvent({ type: 'run_started', taskId, data: { taskId } });
        yield asEvent({ type: 'run_started', taskId: 'child-task', parentTaskId: taskId, data: { taskId: 'child-task' } });
        yield asEvent({ type: 'text_message_start', taskId: 'child-task', parentTaskId: taskId, data: { message_id: 'child-message', step_id: 'child-step', role: 'assistant' } });
        yield asEvent({ type: 'text_message_content', taskId: 'child-task', parentTaskId: taskId, data: { message_id: 'child-message', step_id: 'child-step', delta: 'Nested agent result' } });
        yield asEvent({ type: 'text_message_end', taskId: 'child-task', parentTaskId: taskId, data: { message_id: 'child-message', step_id: 'child-step' } });
        yield asEvent({ type: 'text_message_start', taskId, data: { message_id: 'root-message', step_id: 'root-step', role: 'assistant' } });
        yield asEvent({ type: 'text_message_content', taskId, data: { message_id: 'root-message', step_id: 'root-step', delta: 'Root task narrative' } });
        yield asEvent({ type: 'text_message_end', taskId, data: { message_id: 'root-message', step_id: 'root-step' } });
        yield asEvent({ type: 'run_finished', taskId, data: { taskId } });
      },
    } as unknown as Agent;
    const api = native as unknown as { TaskView: React.ComponentType<{ agent: Agent; taskId: string }> };
    render(<api.TaskView agent={agent} taskId={taskId} />);

    const tree = await screen.findByLabelText('Subtask progress');
    await waitFor(() => expect(within(tree).getByText('Nested agent result')).toBeTruthy());
    const chatLists = screen.getAllByLabelText('Chat messages');
    expect(within(chatLists[0]).queryByText('Nested agent result')).toBeNull();
    expect(within(chatLists[0]).getByText('Root task narrative')).toBeTruthy();
  });

  it('renders a caller-provided empty state when no task is selected', () => {
    const api = native as unknown as { TaskView: React.ComponentType<{ agent: Agent | null; taskId: null; enabled: false; emptyState: React.ReactNode }> };
    render(<api.TaskView agent={null} taskId={null} enabled={false} emptyState={<span>Select a task to follow</span>} />);

    expect(screen.getByText('Select a task to follow')).toBeTruthy();
  });
});
