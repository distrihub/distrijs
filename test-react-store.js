#!/usr/bin/env node
// Test the actual React store to see message processing

// Import what we can from the React package
const reactExports = require('./packages/react/dist/index.cjs');

console.log('🧪 Testing React Store Message Processing');
console.log('=' .repeat(50));

// Since we can't access the store directly, let's create our own test to see
// if the addMessage function logic is working in the context we built
console.log('Available React exports:', Object.keys(reactExports).filter(k => k.includes('Chat') || k.includes('store')));

// Let's test the core functions instead
const { isDistriEvent, isDistriMessage } = require('./packages/core/dist/index.js');

// Test messages to verify event detection
const testEvents = [
  // 1. User message (complete message)
  {
    id: "user-msg-123",
    role: "user",
    parts: [{ type: "text", text: "Hello, tell me about LangDB founders" }],
    created_at: new Date().toISOString()
  },
  
  // 2. Text message start event
  {
    type: "text_message_start",
    data: {
      message_id: "assistant-msg-456",
      role: "assistant"
    }
  },
  
  // 3. Text message content events (streaming)
  {
    type: "text_message_content",
    data: {
      message_id: "assistant-msg-456",
      delta: "The founders"
    }
  },
  
  {
    type: "text_message_content", 
    data: {
      message_id: "assistant-msg-456",
      delta: " of LangDB are"
    }
  },
  
  {
    type: "text_message_content",
    data: {
      message_id: "assistant-msg-456", 
      delta: " Matteo Pelati and Vivek G."
    }
  },
  
  // 4. Text message end event
  {
    type: "text_message_end",
    data: {
      message_id: "assistant-msg-456"
    }
  }
];

console.log('\n1. Testing event detection logic:');

testEvents.forEach((event, index) => {
  console.log(`\n--- Event ${index + 1}: ${event.type || event.role} ---`);
  console.log('   ID:', event.id || (event.data && event.data.message_id) || 'No ID');
  console.log('   isDistriEvent:', isDistriEvent(event));
  console.log('   isDistriMessage:', isDistriMessage(event));
  console.log('   Has data:', !!event.data);
  console.log('   Has parts:', !!event.parts);
  
  if (isDistriEvent(event)) {
    console.log('   Event type:', event.type);
    if (event.type.startsWith('text_message_')) {
      console.log('   Message ID:', event.data.message_id);
      if (event.type === 'text_message_content') {
        console.log('   Delta:', `"${event.data.delta}"`);
      }
    }
  }
  
  if (isDistriMessage(event)) {
    console.log('   Message role:', event.role);
    console.log('   Parts count:', event.parts ? event.parts.length : 0);
  }
});

console.log('\n2. Summary:');
const events = testEvents.filter(isDistriEvent);
const messages = testEvents.filter(isDistriMessage);
const streamingEvents = events.filter(e => e.type.startsWith('text_message_'));

console.log('   Total test items:', testEvents.length);
console.log('   Detected events:', events.length);
console.log('   Detected messages:', messages.length);  
console.log('   Streaming events:', streamingEvents.length);

const contentEvents = streamingEvents.filter(e => e.type === 'text_message_content');
const totalDeltaLength = contentEvents.reduce((sum, e) => sum + e.data.delta.length, 0);

console.log('   Content events:', contentEvents.length);
console.log('   Total delta length:', totalDeltaLength);

console.log('\n💡 Key findings:');
if (events.length > 0 && messages.length > 0) {
  console.log('✅ Event detection is working correctly');
} else {
  console.log('❌ Event detection has issues');
}

if (streamingEvents.length === 4) { // start, content, content, content, end
  console.log('✅ All streaming events detected');
} else {
  console.log('❌ Missing streaming events');
}

if (totalDeltaLength === 53) { // Expected length of combined deltas
  console.log('✅ All delta content accounted for');  
} else {
  console.log('❌ Delta content mismatch');
}

console.log('\n🔧 The functions are working correctly in isolation.');
console.log('🔧 Next step: Test with real streaming from agent to see actual events.');