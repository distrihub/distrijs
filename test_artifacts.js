// Test conversion of the provided artifacts
const artifacts = [
  {
    "artifactId": "d75f655e-9d2f-4304-aa6c-f945f5221ffa",
    "parts": [
      {
        "kind": "data",
        "data": null
      }
    ],
    "name": "d75f655e-9d2f-4304-aa6c-f945f5221ffa",
    "description": null
  },
  {
    "artifactId": "338cc2c7-bc4a-411e-a9c8-4713549410ba",
    "parts": [
      {
        "kind": "data",
        "data": {
          "id": "338cc2c7-bc4a-411e-a9c8-4713549410ba",
          "created_at": 1754101051998,
          "updated_at": 1754101051998,
          "type": "llm_response",
          "step_id": "1",
          "content": "",
          "tool_calls": [
            {
              "tool_call_id": "call_59lXAK3hM6iOt6vVxGzgA28U",
              "tool_name": "search",
              "input": "{\"query\":\"LangDB founders\"}"
            }
          ],
          "success": true,
          "rejected": false,
          "reason": null,
          "timestamp": 1754101051997
        }
      }
    ],
    "name": "338cc2c7-bc4a-411e-a9c8-4713549410ba",
    "description": null
  },
  {
    "artifactId": "a4e8e309-b1ad-496c-9f52-8ed33776f69b",
    "parts": [
      {
        "kind": "data",
        "data": {
          "id": "a4e8e309-b1ad-496c-9f52-8ed33776f69b",
          "created_at": 1754101054689,
          "updated_at": 1754101054689,
          "type": "tool_results",
          "step_id": "86d644d4-b98c-4237-a08a-7cfbe044a224",
          "results": [
            {
              "tool_call_id": "call_59lXAK3hM6iOt6vVxGzgA28U",
              "tool_name": "search",
              "result": "{\"answer\":null,\"results\":[{\"title\":\"Vivek G. - Co-Founder at LangDB - LinkedIn Singapore\",\"url\":\"https://sg.linkedin.com/in/vivekgudapuri\",\"content\":\"Vivek G.\\nCo-Founder at LangDB\\nSingapore\\n2294 connections, 2907 followers\\n\\n\\nAbout\\nExperienced technology professional with a demonstrated history of building and scaling platforms from scratch to success. <br><br>An entrepreneur, technology and product leader with strong expertise in areas of data and platform engineering. He has helped in bringing two startups to scale and recently co-founded LangDB.\\n\\n\\nExperience\\nCo-Founder\\n[LangDB](https://www.linkedin.com/company/langdb)  \\nJuly 2022 - Present\\nSingapore, Singapore\\nThe Fastest Enterprise AI Gateway. Built in Rust and Open Source.\\n\\n\\nEducation\\nN/A\",\"score\":0.74363416,\"raw_content\":null}]}"
            }
          ],
          "success": true,
          "rejected": false,
          "reason": null,
          "timestamp": 1754101054689
        }
      }
    ],
    "name": "a4e8e309-b1ad-496c-9f52-8ed33776f69b",
    "description": null
  }
];

// Expected conversion results:
console.log("Expected conversions:");

// First artifact (null data) -> GenericArtifact
console.log("1. GenericArtifact:", {
  id: "d75f655e-9d2f-4304-aa6c-f945f5221ffa",
  type: "artifact",
  timestamp: Date.now(),
  data: null,
  artifactId: "d75f655e-9d2f-4304-aa6c-f945f5221ffa",
  name: "d75f655e-9d2f-4304-aa6c-f945f5221ffa",
  description: null
});

// Second artifact (llm_response) -> AssistantWithToolCalls
console.log("2. AssistantWithToolCalls:", {
  id: "338cc2c7-bc4a-411e-a9c8-4713549410ba",
  type: "llm_response",
  timestamp: 1754101051997,
  content: "",
  tool_calls: [
    {
      "tool_call_id": "call_59lXAK3hM6iOt6vVxGzgA28U",
      "tool_name": "search",
      "input": "{\"query\":\"LangDB founders\"}"
    }
  ],
  step_id: "1",
  success: true,
  rejected: false,
  reason: null
});

// Third artifact (tool_results) -> ToolResults
console.log("3. ToolResults:", {
  id: "a4e8e309-b1ad-496c-9f52-8ed33776f69b",
  type: "tool_results",
  timestamp: 1754101054689,
  results: [
    {
      "tool_call_id": "call_59lXAK3hM6iOt6vVxGzgA28U",
      "tool_name": "search",
      "result": "{\"answer\":null,\"results\":[{\"title\":\"Vivek G. - Co-Founder at LangDB - LinkedIn Singapore\",\"url\":\"https://sg.linkedin.com/in/vivekgudapuri\",\"content\":\"Vivek G.\\nCo-Founder at LangDB\\nSingapore\\n2294 connections, 2907 followers\\n\\n\\nAbout\\nExperienced technology professional with a demonstrated history of building and scaling platforms from scratch to success. <br><br>An entrepreneur, technology and product leader with strong expertise in areas of data and platform engineering. He has helped in bringing two startups to scale and recently co-founded LangDB.\\n\\n\\nExperience\\nCo-Founder\\n[LangDB](https://www.linkedin.com/company/langdb)  \\nJuly 2022 - Present\\nSingapore, Singapore\\nThe Fastest Enterprise AI Gateway. Built in Rust and Open Source.\\n\\n\\nEducation\\nN/A\",\"score\":0.74363416,\"raw_content\":null}]}"
    }
  ],
  step_id: "86d644d4-b98c-4237-a08a-7cfbe044a224",
  success: true,
  rejected: false,
  reason: null
}); 