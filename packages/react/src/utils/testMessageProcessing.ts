import { DistriMessage, processA2AMessagesData } from '@distri/core';

/**
 * Test utility to process messages.json data and convert to DistriMessage format
 */
export function testMessageProcessing(messagesJsonData: any[]): DistriMessage[] {
  console.log('Processing A2A messages data:', messagesJsonData.length, 'items');
  
  const distriMessages = processA2AMessagesData(messagesJsonData);
  
  console.log('Converted to DistriMessages:', distriMessages.length, 'messages');
  console.log('Messages structure:', distriMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    partTypes: msg.parts.map(part => part.type),
    partCount: msg.parts.length
  })));
  
  return distriMessages;
}

/**
 * Example usage with the provided messages.json data
 */
export const exampleMessagesData = [
  {
    "kind": "message",
    "messageId": "1595e622-6a0d-4b48-8929-afc31bbd3d5e",
    "role": "user",
    "parts": [
      {
        "kind": "text",
        "text": "who are tazapay founders"
      }
    ],
    "contextId": "57fd0469-7e71-4332-b413-78d12950d0e1",
    "taskId": "6ded840d-e1d5-4cbe-9c3d-bdd5a2cc5fce",
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": "text"
  },
  {
    "artifactId": "89e0ea8a-ec32-44dd-9151-02da7488697a",
    "parts": [
      {
        "kind": "data",
        "data": {
          "id": "89e0ea8a-ec32-44dd-9151-02da7488697a",
          "created_at": 1754070975967,
          "updated_at": 1754070975967,
          "type": "llm_response",
          "step_id": "1",
          "content": "",
          "tool_calls": [
            {
              "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
              "tool_name": "search",
              "input": "{\"query\": \"Tazapay founders\"}"
            },
            {
              "tool_call_id": "call_Y3LYWV2jQ5ySahceV5Dspvf8",
              "tool_name": "extract_structured_data",
              "input": "{\"url\": \"https://www.tazapay.com\"}"
            }
          ],
          "success": true,
          "rejected": false,
          "reason": null,
          "timestamp": 1754070975967
        }
      }
    ],
    "name": "89e0ea8a-ec32-44dd-9151-02da7488697a",
    "description": null
  },
  {
    "artifactId": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
    "parts": [
      {
        "kind": "data",
        "data": {
          "id": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
          "created_at": 1754070978927,
          "updated_at": 1754070978927,
          "type": "tool_results",
          "step_id": "7c246028-737e-4239-8f62-fbd29b8402ef",
          "results": [
            {
              "tool_call_id": "call_ct3kfS2uhpkXb2xUhSHfXkl4",
              "tool_name": "search",
              "result": "{\"answer\":null,\"results\":[{\"title\":\"TazaPay - 2025 Founders and Board of Directors - Tracxn\",\"url\":\"https://tracxn.com/d/companies/tazapay/__rJPcCRN4b9Dubk5iNSIxkeLPWHAwjGAM-VrqoASnSAs/founders-and-board-of-directors\",\"content\":\"TazaPay - 2025 Founders and Board of Directors - Tracxn *   Customers   Investment Industry Venture Capital FundsPrivate Equity FundsAccelerators & IncubatorsInvestment Banks      Corporates and Startups Corp Dev and M&A TeamsCorporate InnovationStartup FoundersSales Team      Ecosystem Journalists and PublicationsUniversities     View All Customers Contact Us   TazaPay founders & board of directors TazaPay's Founders TazaPay's Team *   Saroj Mishra: Co-Founder & COO at TazaPay and 1 other company, angel Investor in 2 companies and on the board of 3 other companies. *   Rahul Shinghal: Co-Founder & CEO at TazaPay and on the board of 1 other company. *   Arul Kumaravel: Co-Founder & CTO at TazaPay and on the board of 1 other company. FAQ's about TazaPay's team Who are the founders of TazaPay?\",\"score\":0.8963332,\"raw_content\":null}]}"
            }
          ],
          "success": true,
          "rejected": false,
          "reason": null,
          "timestamp": 1754070978927
        }
      }
    ],
    "name": "f2123de7-0b17-4ca3-b9b3-d642c3188bbc",
    "description": null
  },
  {
    "artifactId": "db9f5f0d-810e-429c-9e18-42d46e949f33",
    "parts": [
      {
        "kind": "data",
        "data": {
          "id": "db9f5f0d-810e-429c-9e18-42d46e949f33",
          "created_at": 1754070995888,
          "updated_at": 1754070995888,
          "type": "llm_response",
          "step_id": "2d474328-ca0a-441d-a31b-9165c2aeadb0",
          "content": "Tazapay is a fintech company offering a comprehensive international payment gateway that enables businesses to manage cross-border transactions efficiently. It was co-founded by Rahul Shinghal (Co-Founder & CEO), Saroj Mishra (Co-Founder & COO), and Arul Kumaravel (Co-Founder & CTO). Rahul Shinghal has over 20 years of experience in payments at companies like PayPal and Stripe. Arul Kumaravel has extensive experience in technology leadership and product development, having worked with companies such as Microsoft, Amazon, and Grab. Tazapay is a Singapore-based startup backed by investors including Sequoia and offers solutions like integrated checkout, payment links, and escrow services.",
          "tool_calls": [],
          "success": true,
          "rejected": false,
          "reason": null,
          "timestamp": 1754070995888
        }
      }
    ],
    "name": "db9f5f0d-810e-429c-9e18-42d46e949f33",
    "description": null
  }
];

/**
 * Run the test with example data
 */
export function runTest() {
  console.log('=== Testing A2A Message Processing ===');
  const result = testMessageProcessing(exampleMessagesData);
  
  console.log('\n=== Expected Output Structure ===');
  console.log('1. User message: "who are tazapay founders"');
  console.log('2. Assistant message with tool calls: search + extract_structured_data');
  console.log('3. Assistant message with tool results: search results');
  console.log('4. Assistant message with final response about Tazapay founders');
  
  console.log('\n=== Rendered Steps ===');
  result.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.role}: ${msg.parts.map(p => p.type).join(', ')}`);
    if (msg.parts.some(p => p.type === 'tool_call')) {
      const toolCalls = msg.parts.filter(p => p.type === 'tool_call');
      toolCalls.forEach(tc => {
        console.log(`   - Tool: ${(tc as any).tool_call.tool_name}`);
      });
    }
    if (msg.parts.some(p => p.type === 'text')) {
      const textPart = msg.parts.find(p => p.type === 'text') as any;
      console.log(`   - Text: ${textPart?.text?.substring(0, 100)}...`);
    }
  });
  
  return result;
}