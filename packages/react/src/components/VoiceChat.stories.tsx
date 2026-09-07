import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { DistriChatMessage, SttTokenResponse } from '@distri/core';
import { FakeSttAdapter, FakeVad, type MicCaptureLike } from '@distri/state';
import { ChatInner, type ChatVoiceOptions } from './Chat';
import { DistriContext } from '../DistriProvider';

/**
 * `<Chat voice>` end to end without a network or a microphone: a fake mic that
 * emits silent 100 ms PCM frames, a `FakeSttAdapter` that "hears" a canned
 * question while frames arrive and finalizes it on release, a mocked client
 * whose `sttToken` resolves to a fake token, an agent whose stream yields a
 * few sentences, and a fake speaker that "speaks" each sentence for a moment.
 *
 * Hold the mic button (or press Space) for about a second and release. The
 * `HoldToTalk` story's `play` function does exactly that so the whole
 * hold → transcript → thinking → speaking → ready flow can be screenshotted.
 *
 * Story ids: `voice-chat--hold-to-talk`, `voice-chat--dictation-review`,
 * `voice-chat--manual-mode`, `voice-chat--auto-mode`.
 */
const meta: Meta = {
  title: 'Voice/Chat',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const HEARD = 'What is the capital of France?';
const REPLY = 'The capital of France is Paris. It sits on the Seine river. About two million people live in the city proper, and it is famous for the Eiffel Tower!';

const fakeToken: SttTokenResponse = {
  token_id: 'stt_story',
  provider: 'fake',
  model: 'fake-realtime',
  token: 'fake-jwt',
  expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  single_use: false,
  connect: { encoding: 'pcm16', sample_rate: 16000 },
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function makeMic(): MicCaptureLike {
  let timer: ReturnType<typeof setInterval> | null = null;
  return {
    async start(onFrame) {
      if (timer) return;
      timer = setInterval(() => onFrame(new Int16Array(1600)), 100);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}

/** Emits one more word of `HEARD` as an interim for every ~3 frames (300 ms), then finalizes on release. */
function makeAdapter(): FakeSttAdapter {
  let framesSinceTurn = 0;
  const words = HEARD.split(' ');
  return new FakeSttAdapter({
    provider: 'fake',
    onPushFrame: (adapter) => {
      framesSinceTurn += 1;
      const shown = Math.min(words.length, Math.floor(framesSinceTurn / 3));
      if (shown > 0 && framesSinceTurn % 3 === 0) adapter.emitInterim(words.slice(0, shown).join(' '));
    },
    onFinalize: (adapter) => {
      const shown = Math.max(1, Math.min(words.length, Math.floor(framesSinceTurn / 3)));
      framesSinceTurn = 0;
      setTimeout(() => {
        adapter.emitFinal(words.slice(0, shown).join(' '));
        adapter.emitFinalized();
      }, 250);
    },
  });
}

/** Auto mode needs a VAD: this one reports one speech segment — frames 1..20 (about two seconds) — then silence. */
class StoryVad extends FakeVad {
  private count = 0;
  processFrame(pcm16: Int16Array): void {
    super.processFrame(pcm16);
    this.count += 1;
    if (this.count === 1) this.emitSpeechStart();
    if (this.count === 20) this.emitSpeechEnd();
  }
}

async function* replyStream(): AsyncGenerator<DistriChatMessage> {
  yield { type: 'run_started', data: { runId: 'r1', taskId: 't1' } };
  await wait(600);
  yield { type: 'text_message_start', data: { message_id: 'm1', step_id: 's1', role: 'assistant' } };
  for (const word of REPLY.split(' ')) {
    await wait(70);
    yield { type: 'text_message_content', data: { message_id: 'm1', step_id: 's1', delta: `${word} ` } };
  }
  yield { type: 'text_message_end', data: { message_id: 'm1', step_id: 's1' } };
  yield { type: 'run_finished', data: { runId: 'r1', taskId: 't1' } };
}

function makeAgent() {
  return {
    name: 'story_agent',
    getDefinition: () => ({ name: 'story_agent', description: 'Storybook voice agent' }),
    client: {
      ensureAccessToken: async () => undefined,
      completeTool: async () => undefined,
    },
    invokeStream: async () => replyStream(),
  };
}

function makeClient() {
  const client = {
    getThread: async () => null,
    listTasks: async () => [],
    getTaskById: async () => null,
    cancelTask: async () => undefined,
    sttToken: async () => fakeToken,
    sttUsage: async () => undefined,
    ttsSpeech: async () => { throw new globalThis.Error('no TTS in Storybook'); },
  };
  return client as never;
}

/** "Speaks" a sentence for 90 ms per word; aborts immediately on interrupt. */
const fakeSpeak = (sentence: string, { signal }: { signal: AbortSignal }) => new Promise<void>((resolve, reject) => {
  const ms = 90 * sentence.split(' ').length;
  const t = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => {
    clearTimeout(t);
    reject(Object.assign(new globalThis.Error('aborted'), { name: 'AbortError' }));
  });
});

function VoiceChatStory({ voice }: { voice: ChatVoiceOptions }) {
  const agent = useMemo(() => makeAgent(), []);
  const client = useMemo(() => makeClient(), []);
  const options = useMemo<ChatVoiceOptions>(() => ({
    ...voice,
    stt: { adapter: makeAdapter(), ...voice.stt },
    tts: voice.tts === false ? false : { speak: fakeSpeak, ...voice.tts },
    deps: { mic: makeMic(), vad: new StoryVad(), ...voice.deps },
  }), [voice]);

  return (
    <DistriContext.Provider value={{ client, error: null, isLoading: false }}>
      <div className="h-[640px] max-w-3xl mx-auto border border-border rounded-xl overflow-hidden">
        <ChatInner agent={agent as never} threadId="voice-story" voice={options} />
      </div>
    </DistriContext.Provider>
  );
}

type Story = StoryObj<{ voice: ChatVoiceOptions }>;

/** Hold → transcript → release → thinking → speaking → ready. The play function performs the hold. */
export const HoldToTalk: Story = {
  args: { voice: {} },
  render: (args) => <VoiceChatStory voice={args.voice} />,
  play: async ({ canvasElement }) => {
    const button = await new Promise<HTMLElement>((resolve) => {
      const find = () => {
        const el = canvasElement.querySelector<HTMLElement>('[data-testid="push-to-talk"]');
        if (el) resolve(el);
        else setTimeout(find, 50);
      };
      find();
    });
    const pointer = (type: string) => button.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true }));
    pointer('pointerdown');
    await wait(1900);
    pointer('pointerup');
  },
};

/** `review: true`, `tts: false`: the committed transcript lands in the composer instead of being sent. */
export const DictationReview: Story = {
  args: { voice: { review: true, tts: false } },
  render: (args) => <VoiceChatStory voice={args.voice} />,
};

/** Manual mode: start listening, the check button commits. */
export const ManualMode: Story = {
  args: { voice: { turn: { mode: 'manual' } } },
  render: (args) => <VoiceChatStory voice={args.voice} />,
};

/** Auto mode: a scripted VAD reports ~2 s of speech after Start; the turn commits `silenceMs` later and listening resumes after the reply. */
export const AutoMode: Story = {
  args: { voice: { turn: { mode: 'auto', silenceMs: 900 } } },
  render: (args) => <VoiceChatStory voice={args.voice} />,
};
