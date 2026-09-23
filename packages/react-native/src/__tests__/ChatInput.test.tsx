import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatInput } from '../ChatInput';
vi.mock('react-native', async () => import('./react-native.mock'));

describe('ChatInput', () => {
  afterEach(cleanup);

  it('sends trimmed text and clears the multiline composer', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText('Message…'), { target: { value: '  hello native  ' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    expect(onSend).toHaveBeenCalledWith('hello native');
    expect((screen.getByPlaceholderText('Message…') as HTMLTextAreaElement).value).toBe('');
  });

  it('preserves line breaks when sending a multiline draft', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} placeholder="Write a reply" />);

    fireEvent.change(screen.getByPlaceholderText('Write a reply'), {
      target: { value: 'First line\nSecond line' },
    });
    fireEvent.click(screen.getByLabelText('Send message'));

    expect(onSend).toHaveBeenCalledWith('First line\nSecond line');
  });

  it('disables sending while busy', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled />);

    expect((screen.getByLabelText('Send message') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows a working stop action while a response is streaming', () => {
    const onStop = vi.fn();
    render(<ChatInput onSend={vi.fn()} onStop={onStop} disabled />);

    fireEvent.click(screen.getByLabelText('Stop generation'));
    expect(onStop).toHaveBeenCalledOnce();
  });
});
