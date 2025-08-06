# How to Enable Debug Mode

The Chat component now has a `debug` parameter that enables detailed console logging for message processing.

## Usage

```tsx
import { Chat } from '@distri/react';

function MyApp() {
  return (
    <Chat
      threadId="my-thread"
      agent={myAgent}
      debug={true}  // ← Enable debug logging
    />
  );
}
```

## What You'll See

When debug mode is enabled, you'll see detailed console output like this:

```
🔍 addMessage called with: {
  messageType: 'DistriMessage',
  eventType: 'text_message_start', 
  messageId: 'assistant-msg-456',
  content: 'No parts',
  eventData: { message_id: 'assistant-msg-456', role: 'assistant' }
}

📋 Current messages before processing: 1

⚡ Processing event: text_message_start

✅ Created new streaming message: {
  messageId: 'assistant-msg-456',
  role: 'assistant', 
  messageCount: 2
}

🔍 addMessage called with: {
  messageType: 'DistriMessage',
  eventType: 'text_message_content',
  messageId: 'assistant-msg-456', 
  content: 'No parts',
  eventData: { message_id: 'assistant-msg-456', delta: 'Hello world' }
}

📝 Processing text_message_content: {
  messageId: 'assistant-msg-456',
  deltaLength: 11,
  delta: 'Hello world...'
}

🔍 Looking for existing message: {
  messageId: 'assistant-msg-456',
  existingIndex: 1,
  totalMessages: 2
}

✅ Appended delta to message: {
  messageId: 'assistant-msg-456',
  prevLength: 0,
  newLength: 11, 
  deltaLength: 11,
  preview: 'Hello world...'
}
```

## What to Look For

### ✅ If Streaming is Working:
- You'll see `text_message_start` followed by multiple `text_message_content` events
- `existingIndex` will be >= 0 (finds the message to append to)
- `newLength` will increase with each delta
- Final message will contain concatenated text

### ❌ If Streaming is Broken:
- Missing `text_message_content` events (backend not streaming)
- `existingIndex` is -1 (message ID mismatch)
- Multiple complete messages instead of streaming events
- Warning: "Cannot find streaming message to append to"

## Quick Test

1. Add `debug={true}` to your Chat component
2. Send a message
3. Open browser dev tools console
4. Look for the debug messages above
5. Check if you see streaming events or complete messages

This will immediately show you what's happening with your message processing! 🔍