import { ComponentType, ReactNode, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DistriPart } from '@distri/core';
import { DistriNativeTheme, useDistriTheme } from './theme';

/** A picked image, already base64-encoded by the app's picker. */
export interface NativeImageAttachment {
  uri: string;
  base64: string;
  mimeType: string;
  name?: string;
}

export interface ChatInputProps {
  onSend: (content: string | DistriPart[]) => void | Promise<void>;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Opens the app's image picker. When provided, an attach button appears and
   * picked images are sent as image parts, the format `@distri/react` sends.
   * The package ships no picker so apps choose theirs (e.g. expo-image-picker
   * with `base64: true`).
   */
  onPickImage?: () => Promise<NativeImageAttachment | null | undefined>;
  maxImages?: number;
  /** A TextInput-compatible component, e.g. `BottomSheetTextInput` inside a bottom sheet. */
  InputComponent?: ComponentType<any>;
  sendLabel?: ReactNode;
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  placeholder = 'Message…',
  onPickImage,
  maxImages = 4,
  InputComponent = TextInput,
  sendLabel = 'Send',
}: ChatInputProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [text, setText] = useState('');
  const [images, setImages] = useState<NativeImageAttachment[]>([]);
  const message = text.trim();
  const sendDisabled = disabled || (message.length === 0 && images.length === 0);

  const send = () => {
    if (sendDisabled) return;
    const parts: DistriPart[] = [
      ...(message ? [{ part_type: 'text' as const, data: message }] : []),
      ...images.map(image => ({
        part_type: 'image' as const,
        data: { type: 'bytes' as const, mime_type: image.mimeType, bytes: image.base64, name: image.name ?? 'image' },
      })),
    ];
    setText('');
    setImages([]);
    void onSend(images.length ? parts : message);
  };

  const attach = async () => {
    if (!onPickImage || images.length >= maxImages) return;
    const picked = await onPickImage();
    if (picked) setImages(current => [...current, picked].slice(0, maxImages));
  };

  return (
    <View style={[styles.wrap, theme.styles.composer]}>
      {images.length > 0 && (
        <View style={styles.previews}>
          {images.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.preview}>
              <Image accessibilityLabel={image.name || 'Attached image'} source={{ uri: image.uri }} style={styles.previewImage} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                onPress={() => setImages(current => current.filter((_, i) => i !== index))}
                style={styles.remove}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={styles.row}>
        {onPickImage && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach image"
            accessibilityState={{ disabled: disabled || images.length >= maxImages }}
            disabled={disabled || images.length >= maxImages}
            onPress={() => { void attach(); }}
            style={({ pressed }) => [styles.attach, pressed && styles.pressed]}
          >
            <Text style={styles.attachText}>+</Text>
          </Pressable>
        )}
        <InputComponent
          accessibilityLabel="Chat message"
          multiline
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedText}
          editable={!disabled}
          style={[styles.input, theme.styles.input]}
          textAlignVertical="top"
        />
        {onStop ? <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop generation"
          onPress={onStop}
          style={({ pressed }) => [styles.button, styles.stopButton, pressed && styles.pressed]}
        >
          <View style={styles.stopSquare} />
        </Pressable> : <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: sendDisabled }}
          disabled={sendDisabled}
          onPress={send}
          style={({ pressed }) => [styles.button, theme.styles.sendButton, sendDisabled && styles.buttonDisabled, pressed && !sendDisabled && styles.pressed]}
        >
          {typeof sendLabel === 'string' ? <Text style={[styles.buttonText, theme.styles.sendButtonText]}>{sendLabel}</Text> : sendLabel}
        </Pressable>}
      </View>
    </View>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    wrap: { gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    previews: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    preview: { width: 56, height: 56 },
    previewImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: theme.colors.codeBackground },
    remove: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.text },
    removeText: { color: theme.colors.surface, fontSize: 14, lineHeight: 16, fontWeight: '700' },
    attach: { width: 44, height: 44, borderRadius: theme.radii.button, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
    attachText: { color: theme.colors.mutedText, fontSize: 22, lineHeight: 24 },
    input: {
      flex: 1, minHeight: 44, maxHeight: 140, paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.radii.input,
      borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface,
      fontFamily: theme.fonts.body, fontSize: theme.fontSizes.body,
    },
    button: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: theme.radii.button, backgroundColor: theme.colors.primary },
    buttonDisabled: { opacity: 0.45 },
    stopButton: { backgroundColor: theme.colors.mutedText },
    stopSquare: { width: 12, height: 12, borderRadius: 2, backgroundColor: theme.colors.surface },
    pressed: { opacity: 0.8 },
    buttonText: { color: theme.colors.onPrimary, fontWeight: '600', fontFamily: theme.fonts.body },
  });
}
