# @distri/admin-ui

A comprehensive admin interface for managing Distri AI agents, definitions, and prompt templates. Built with React, TypeScript, and modern web technologies.

## Features

### 🤖 Agent Management
- **Definitions Page**: Browse and manage AI agent definitions using the existing AgentList component
- **YAML Editor**: Create and edit agent definitions with real-time syntax highlighting and validation
- **Live Preview**: See parsed agent details and configuration in real-time
- **Chat Testing**: Test agents directly from the admin interface

### 📝 Prompt Templates
- **Template Library**: Manage reusable prompt templates with variable substitution
- **Template Types**: Support for CoT (Chain of Thought), ReAct, and Default prompt types  
- **Variable Detection**: Automatic parsing of template variables using `{{variable_name}}` syntax
- **Local Storage**: Templates are stored locally and persist between sessions

### 🎨 Modern UI
- **Dark/Light Theme**: Built-in theme switching with system preference detection
- **Responsive Design**: Works on desktop and mobile devices
- **Tailwind CSS**: Modern styling with the same design system as the main packages
- **Shadcn Components**: High-quality, accessible UI components

## Routes

- `/definitions` - Main agent definitions page with card view
- `/definitions/new` - YAML editor for creating new agent definitions
- `/definitions/chat` - Full chat interface for testing agents
- `/prompts` - Prompt template management

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Running Distri backend server

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:admin

# The admin UI will be available at http://localhost:5174
```

### Building

```bash
# Build for production
pnpm build
```

## Architecture

### Components
- **AdminSidebar**: Navigation sidebar with theme toggle
- **Pages**: Route-specific page components
- **UI Components**: Reusable UI components based on Radix UI primitives

### Data Management
- **Agent Data**: Fetched from the Distri backend via `@distri/react` hooks
- **Prompt Templates**: Stored in browser localStorage with JSON serialization
- **Theme State**: Managed via React Context with localStorage persistence

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Custom Properties**: Theme variables for consistent theming
- **Component Variants**: Type-safe component styling with class-variance-authority

## Prompt Template System

### Template Variables

Common variables available across all templates:

- `{{agent_name}}` - The name of the agent
- `{{agent_description}}` - Agent description
- `{{available_tools}}` - List of available tools/capabilities  
- `{{context}}` - Current conversation context
- `{{user_query}}` - The user's current query (ReAct templates)

### Template Types

1. **Default**: Basic assistant prompt
2. **CoT (Chain of Thought)**: Step-by-step reasoning prompts
3. **ReAct**: Reasoning and Acting pattern with tool usage

### Example Template

```handlebars
You are {{agent_name}}, {{agent_description}}.

Available tools: {{available_tools}}
Context: {{context}}

How can I help you today?
```

## Integration

The admin UI integrates seamlessly with the existing Distri ecosystem:

- **@distri/core**: Core types and client functionality
- **@distri/react**: React hooks and components (AgentList, FullChat)
- **Backend**: Connects to Distri backend for agent data

## Development Notes

- **Import Strategy**: Components from `@distri/react` are imported directly to leverage existing functionality
- **Type Safety**: Full TypeScript support with strict type checking
- **Code Splitting**: Route-based code splitting for optimal performance
- **Error Boundaries**: Graceful error handling throughout the application