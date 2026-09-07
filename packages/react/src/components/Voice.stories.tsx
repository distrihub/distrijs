import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { VoiceState } from '@distri/core';
import { PushToTalkButton, type PushToTalkVoice } from './PushToTalkButton';

/**
 * The hold-to-talk button (spec §2.3), one story per `VoiceState`. The static
 * stories take a frozen `voice` object; `Interactive` runs a tiny fake state
 * machine so the press/release/cancel gestures can be tried without a mic.
 *
 * Story ids: `voice-pushtotalkbutton--idle`, `--ready`, `--listening`,
 * `--finalizing`, `--thinking`, `--speaking`, `--error`, `--sizes`, `--interactive`.
 */
const meta: Meta<typeof PushToTalkButton> = {
  title: 'Voice/PushToTalkButton',
  component: PushToTalkButton,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;
type Story = StoryObj<typeof PushToTalkButton>;

const noop = () => undefined;

function frozen(state: VoiceState): PushToTalkVoice {
  return { state, transcript: { interim: '', finals: [] }, press: noop, release: noop, cancel: noop };
}

export const Idle: Story = { args: { voice: frozen('idle'), size: 'lg' } };
export const Ready: Story = { args: { voice: frozen('ready'), size: 'lg' } };
export const Listening: Story = { args: { voice: frozen('listening'), size: 'lg' } };
export const Finalizing: Story = { args: { voice: frozen('finalizing'), size: 'lg' } };
export const Thinking: Story = { args: { voice: frozen('thinking'), size: 'lg' } };
export const Speaking: Story = { args: { voice: frozen('speaking'), size: 'lg' } };
export const Error: Story = { args: { voice: frozen('error'), size: 'lg' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <PushToTalkButton voice={frozen('ready')} size="sm" />
      <PushToTalkButton voice={frozen('ready')} size="md" />
      <PushToTalkButton voice={frozen('listening')} size="lg" />
    </div>
  ),
};

/** Press and hold: listening; release: finalizing → thinking → speaking → ready. Slide off to cancel. */
function InteractiveDemo({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const [state, setState] = useState<VoiceState>('ready');
  const [log, setLog] = useState<string[]>([]);
  const append = (line: string) => setLog((prev) => [...prev.slice(-5), line]);

  const voice: PushToTalkVoice = {
    state,
    transcript: { interim: '', finals: [] },
    press: () => {
      append('press()');
      setState('listening');
    },
    release: () => {
      append('release()');
      setState('finalizing');
      setTimeout(() => setState('thinking'), 600);
      setTimeout(() => setState('speaking'), 1400);
      setTimeout(() => setState('ready'), 3400);
    },
    cancel: () => {
      append('cancel()');
      setState('ready');
    },
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <PushToTalkButton voice={voice} size={size} pushToTalkKey="Space" />
      <div className="text-xs sm:text-sm text-muted-foreground">
        state: <span className="font-mono text-foreground">{state}</span> · hold the button or Space
      </div>
      <ul className="text-xs font-mono text-muted-foreground min-h-[6rem]">
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

export const Interactive: Story = {
  args: { size: 'lg' },
  render: (args) => <InteractiveDemo size={args.size ?? 'lg'} />,
};
