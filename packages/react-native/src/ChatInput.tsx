import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export interface ChatInputProps {
  onSend: (text: string) => void | Promise<void>;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onStop, disabled = false, placeholder = 'Message…' }: ChatInputProps) {
  const [text, setText] = useState('');
  const message = text.trim();
  const sendDisabled = disabled || message.length === 0;

  const send = () => {
    if (sendDisabled) return;
    setText('');
    void onSend(message);
  };

  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="Chat message"
        multiline
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        editable={!disabled}
        returnKeyType="default"
        style={styles.input}
        textAlignVertical="top"
      />
      {onStop ? <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop generation"
        onPress={onStop}
        style={({ pressed }) => [styles.stopButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Stop</Text>
      </Pressable> : <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: sendDisabled }}
        disabled={sendDisabled}
        onPress={send}
        style={({ pressed }) => [styles.button, sendDisabled && styles.buttonDisabled, pressed && !sendDisabled && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Send</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#d1d5db' },
  input: { flex: 1, minHeight: 44, maxHeight: 140, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', color: '#111827', backgroundColor: '#ffffff' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#1d4ed8' },
  buttonDisabled: { opacity: 0.45 },
  stopButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#475569' },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
