import { useEffect, useRef } from 'react';
import { createChatStore, ChatStoreContext } from '../stores/chatStateStore';
import { ChatMessageList } from '../components/ChatMessageList';
import type { RenderingMode, ToolRendererMap } from '../types';
import type { ReplayState } from './types';

export interface ReplayChatProps {
  state: ReplayState;
  /** 'rich' (expanded tool cards) or 'minimal' (compact rows). Default 'rich'. */
  rendering?: RenderingMode;
  className?: string;
  /**
   * Custom renderers by tool name, passed straight through to `ChatMessageList`.
   * `ToolExecutionRenderer` checks these before its own built-in dispatch, so
   * this is how a HITL cassette wires a real `onComplete` into
   * `InteractiveToolCard` (see `interactiveTools.tsx`).
   */
  toolRenderers?: ToolRendererMap;
}

/**
 * Renders a recorded run through the real `@distri/react` chat components.
 *
 * The replay state is projected into a genuine chat store, so `ChatMessageList`
 * renders exactly what the live product renders — a demo (or a replayed real
 * thread) cannot drift from the real UI. Makes no network calls and needs no
 * `DistriProvider`.
 */
export function ReplayChat({ state, rendering = 'rich', className, toolRenderers }: ReplayChatProps) {
  const storeRef = useRef<ReturnType<typeof createChatStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createChatStore();
  }
  const store = storeRef.current;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    store.setState({
      messages: state.messages,
      toolCalls: state.toolCalls,
      isStreaming: state.isStreaming,
      rendering,
    });
  }, [store, state, rendering]);

  // Follow the tail as the run streams, so the newest tool call is always in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages, state.toolCalls]);

  return (
    <ChatStoreContext.Provider value={store}>
      <div
        ref={scrollRef}
        className={className}
        style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
        <ChatMessageList messages={state.messages} rendering={rendering} toolRenderers={toolRenderers} />
      </div>
    </ChatStoreContext.Provider>
  );
}
