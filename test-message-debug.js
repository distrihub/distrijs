#!/usr/bin/env node
// Debug message processing to see what's happening

console.log('🧪 Testing Message Processing Debug');
console.log('=' .repeat(50));

// Import the React testing utilities to create a simulated chat state
// We'll create manual test data instead of using the full React setup

// Simulate the message sequence that should happen for streaming
const testMessages = [
  // 1. User message
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
  },
  
  // 5. Complete assistant message (what should exist after streaming)
  {
    id: "assistant-msg-456",
    role: "assistant", 
    parts: [{ type: "text", text: "The founders of LangDB are Matteo Pelati and Vivek G." }],
    created_at: new Date().toISOString()
  }
];

// Test the type detection functions
const { isDistriEvent, isDistriMessage, isDistriArtifact } = require('./packages/core/dist/index.js');

console.log('1. Testing type detection...');
testMessages.forEach((msg, index) => {
  console.log(`   Message ${index + 1}:`, {
    id: msg.id || 'No ID',
    type: msg.type || msg.role || 'Unknown',
    isEvent: isDistriEvent(msg),
    isMessage: isDistriMessage(msg),
    isArtifact: isDistriArtifact(msg),
    hasContent: msg.parts ? `${msg.parts.length} parts` : msg.data ? 'Has data' : 'No content'
  });
});

console.log('\n2. Testing streaming simulation...');

// Simulate the message processing logic
let simulatedMessages = [];

function simulateAddMessage(message) {
  console.log('🔍 Processing:', {
    type: message.type || message.role || 'Unknown',
    id: message.id || (message.data && message.data.message_id) || 'No ID',
    content: message.parts ? 'Has parts' : message.data ? 'Has data' : 'No content'
  });
  
  if (isDistriEvent(message)) {
    console.log('⚡ Event detected:', message.type);
    
    if (message.type === 'text_message_start') {
      const messageId = message.data.message_id;
      const role = message.data.role;
      
      const newMessage = {
        id: messageId,
        role,
        parts: [{ type: 'text', text: '' }],
        created_at: new Date().toISOString()
      };
      
      simulatedMessages.push(newMessage);
      console.log('✅ Created streaming message:', messageId);
      
    } else if (message.type === 'text_message_content') {
      const messageId = message.data.message_id;
      const delta = message.data.delta;
      
      const existingIndex = simulatedMessages.findIndex(m => m.id === messageId);
      console.log('📝 Looking for message:', { messageId, existingIndex });
      
      if (existingIndex >= 0) {
        const existing = simulatedMessages[existingIndex];
        const textPart = existing.parts.find(p => p.type === 'text');
        if (textPart) {
          textPart.text += delta;
          console.log('✅ Appended delta:', { 
            messageId, 
            newLength: textPart.text.length,
            preview: textPart.text
          });
        }
      } else {
        console.warn('❌ Could not find message to append to:', messageId);
      }
      
    } else if (message.type === 'text_message_end') {
      const messageId = message.data.message_id;
      console.log('🏁 Finished streaming:', messageId);
    }
  } else if (isDistriMessage(message)) {
    simulatedMessages.push(message);
    console.log('📨 Added complete message:', message.id);
  }
  
  console.log('📋 Current message count:', simulatedMessages.length);
}

// Process the test messages
testMessages.slice(0, -1).forEach((msg, index) => { // Skip the last complete message
  console.log(`\n--- Processing Message ${index + 1} ---`);
  simulateAddMessage(msg);
});

console.log('\n3. Final Results:');
console.log('📋 Total messages:', simulatedMessages.length);

simulatedMessages.forEach((msg, index) => {
  console.log(`   Message ${index + 1}:`, {
    id: msg.id,
    role: msg.role,
    textContent: msg.parts && msg.parts[0] && msg.parts[0].text ? 
      `"${msg.parts[0].text}"` : 'No text',
    partsCount: msg.parts ? msg.parts.length : 0
  });
});

console.log('\n4. Expected vs Actual:');
const expectedStreamedText = "The founders of LangDB are Matteo Pelati and Vivek G.";
const streamedMessage = simulatedMessages.find(m => m.id === "assistant-msg-456");

if (streamedMessage && streamedMessage.parts && streamedMessage.parts[0]) {
  const actualText = streamedMessage.parts[0].text;
  console.log('   Expected text:', `"${expectedStreamedText}"`);
  console.log('   Actual text:  ', `"${actualText}"`);
  console.log('   Match:', actualText === expectedStreamedText ? '✅' : '❌');
} else {
  console.log('❌ Streamed message not found or has no text content');
}

console.log('\n💡 This test shows how streaming should work:');
console.log('   1. text_message_start creates empty message');
console.log('   2. text_message_content events append deltas');  
console.log('   3. text_message_end marks completion');
console.log('   4. Final message contains concatenated text');