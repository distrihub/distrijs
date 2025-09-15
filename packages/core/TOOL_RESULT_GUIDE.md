# ToolResult Creation Guide

## ⚠️ Important: Always Use Helper Functions

When creating `ToolResult` objects, **NEVER** create them directly. Always use the provided helper functions to ensure proper structure and prevent runtime errors.

## ✅ Correct Usage

```typescript
import { createSuccessfulToolResult, createFailedToolResult } from '@distri/core';

// For successful tool execution
const successResult = createSuccessfulToolResult(
  toolCall.tool_call_id,
  toolCall.tool_name,
  "Tool executed successfully"
);

// For failed tool execution
const failureResult = createFailedToolResult(
  toolCall.tool_call_id,
  toolCall.tool_name,
  "Something went wrong",
  "Error details here" // optional custom result
);
```

## ❌ Incorrect Usage (DO NOT DO THIS)

```typescript
// This is prone to structure errors and type mismatches
const badResult: ToolResult = {
  tool_call_id: toolCall.tool_call_id,
  tool_name: toolCall.tool_name,
  parts: [/* manually constructed parts - error prone! */]
};

// This old structure is no longer valid
const oldResult = {
  tool_call_id: "...",
  tool_name: "...",
  result: "...",     // ❌ This field doesn't exist anymore
  success: true,     // ❌ This field doesn't exist anymore
  error: undefined   // ❌ This field doesn't exist anymore
};
```

## Why Use Helper Functions?

1. **Type Safety**: Ensures the correct structure is always created
2. **Future Compatibility**: If the structure changes, only helper functions need updates
3. **Consistency**: All tool results follow the same pattern
4. **Error Prevention**: Prevents common mistakes like missing `parts` field

## Structure Details

The current `ToolResult` structure uses a `parts` array containing data parts:

```typescript
interface ToolResult {
  tool_call_id: string;
  tool_name: string;
  parts: DistriPart[]; // Contains structured data including result, success, error
}
```

The helper functions automatically create the correct internal structure:
- `parts[0].type` = `'data'`
- `parts[0].data` contains `{ result, success, error }`

## Migration from Old Code

If you have old code using direct object creation:

```typescript
// OLD (before structure change)
const result = {
  tool_call_id: "abc",
  tool_name: "my_tool",
  result: "success",
  success: true,
  error: undefined
};

// NEW (use helper function)
const result = createSuccessfulToolResult("abc", "my_tool", "success");
```

## Extracting Data from ToolResult

To safely extract data from a `ToolResult`:

```typescript
import { extractToolResultData } from '@distri/core';

const resultData = extractToolResultData(toolResult);
if (resultData) {
  console.log('Result:', resultData.result);
  console.log('Success:', resultData.success);
  console.log('Error:', resultData.error);
}
```

## Linting Rules

The ESLint configuration includes rules to help catch direct object creation patterns. Follow the linting suggestions to maintain code quality.

---

**Remember**: Always use `createSuccessfulToolResult()` and `createFailedToolResult()` - your future self will thank you! 🚀