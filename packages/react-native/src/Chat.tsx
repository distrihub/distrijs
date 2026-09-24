import { ComponentType, ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DistriChatMessage, DistriPart } from '@distri/core';
import { ChatInput, NativeImageAttachment } from './ChatInput';
import { UseChatOptions, useChat } from './useChat';
import { ChatMessageList } from './ChatMessageList';
import { LoadingStrip } from './renderers/LoadingStrip';
import { isAwaitingReply, isVisibleMessage } from './messageVisibility';
import { DistriNativeTheme, useDistriTheme } from './theme';
import type { NativeToolRendererMap, RenderingMode } from './types';

export interface ChatHeaderHelpers {
  /** Send a message as if the user typed it, e.g. from a suggestion chip. */
  sendMessage: (content: string | DistriPart[]) => void;
  /** True until the transcript has a visible message. */
  isEmpty: boolean;
}

export interface ChatProps extends UseChatOptions {
  renderMessage?: (message: DistriChatMessage) => ReactNode;
  rendering?: RenderingMode;
  toolRenderers?: NativeToolRendererMap;
  placeholder?: string;
  /** Rendered above the transcript: a welcome, suggestions, a date label. */
  renderHeader?: (helpers: ChatHeaderHelpers) => ReactNode;
  /** Cycling words next to the dots while waiting for a reply. */
  loadingWords?: string[];
  onPickImage?: () => Promise<NativeImageAttachment | null | undefined>;
  /** FlatList-compatible list, e.g. `BottomSheetFlatList`. */
  ListComponent?: ComponentType<any>;
  /** TextInput-compatible input, e.g. `BottomSheetTextInput`. */
  InputComponent?: ComponentType<any>;
  sendLabel?: ReactNode;
  errorMessage?: (error: Error) => string;
}

export function Chat({
  renderMessage,
  rendering = 'minimal',
  toolRenderers,
  placeholder,
  renderHeader,
  loadingWords,
  onPickImage,
  ListComponent,
  InputComponent,
  sendLabel,
  errorMessage,
  ...chatOptions
}: ChatProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const chat = useChat(chatOptions);
  const running = chat.isLoading || chat.isStreaming;
  const awaiting = isAwaitingReply(chat.messages, running);
  const isEmpty = !chat.messages.some(isVisibleMessage);
  const send = (content: string | DistriPart[]) => { void chat.sendMessage(content); };

  return (
    <View style={styles.container}>
      <ChatMessageList
        messages={chat.messages}
        store={chat.store}
        rendering={rendering}
        renderMessage={renderMessage}
        toolRenderers={toolRenderers}
        ListComponent={ListComponent}
        ListHeaderComponent={renderHeader ? <View>{renderHeader({ sendMessage: send, isEmpty })}</View> : null}
        ListFooterComponent={
          <View>
            {awaiting && <LoadingStrip words={loadingWords} />}
            {chat.error && <Text accessibilityRole="alert" style={styles.error}>{errorMessage ? errorMessage(chat.error) : chat.error.message}</Text>}
          </View>
        }
      />
      <ChatInput
        onSend={send}
        onStop={chat.isStreaming ? chat.stopStreaming : undefined}
        disabled={!chatOptions.agent || (chat.isLoading && !chat.isStreaming)}
        placeholder={placeholder}
        onPickImage={onPickImage}
        InputComponent={InputComponent}
        sendLabel={sendLabel}
      />
    </View>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    error: { paddingVertical: 8, color: theme.colors.danger, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
  });
}
