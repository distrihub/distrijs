# Distri Full Demo

A comprehensive demonstration of the Distri platform showcasing advanced features and capabilities.

## Features

- **Complete Agent Management**: Browse, search, and filter available agents
- **Real-time Chat Interface**: Interactive chat with streaming responses
- **Advanced Task Monitoring**: Track task progress and execution logs
- **Modern UI/UX**: Built with Tailwind CSS and Lucide icons
- **Agent Details**: View detailed information about each agent
- **Task Analytics**: Comprehensive task details and logging
- **Export Capabilities**: Export conversations and logs
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16+ 
- pnpm (recommended) or npm
- A running Distri server

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure the Distri server URL:
   - Edit `src/main.tsx` 
   - Set `VITE_DISTRI_BASE_URL` environment variable
   - Default: `http://localhost:8080`

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Building for Production

```bash
pnpm build
```

## Configuration

The demo can be configured through environment variables:

- `VITE_DISTRI_BASE_URL`: Distri server URL (default: http://localhost:8080)

## Components

### Core Components

- **App.tsx**: Main application layout and routing
- **AgentList.tsx**: Enhanced agent browser with search and filtering
- **Chat.tsx**: Advanced chat interface with streaming support
- **TaskMonitor.tsx**: Real-time task tracking and monitoring
- **MessageRenderer.tsx**: Rich message rendering with markdown support

### Dialog Components

- **AgentDetailsDialog.tsx**: Detailed agent information modal
- **TaskDetailsDialog.tsx**: Comprehensive task details and logs

## Features Demonstrated

### Agent Management
- Agent listing with search functionality
- Capability-based filtering
- Real-time agent status
- Detailed agent information

### Chat Interface
- Real-time streaming responses
- Message history
- Copy and export functionality
- Auto-scrolling and responsive design

### Task Monitoring
- Live task progress tracking
- Execution logs
- Task status indicators
- Export capabilities

### UI/UX
- Modern, clean design
- Responsive layout
- Loading states and error handling
- Accessibility features

## Architecture

This demo uses:

- **@distri/core**: Core Distri client functionality
- **@distri/react**: React hooks for Distri integration
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library
- **Vite**: Fast build tool and dev server

## API Integration

The demo integrates with the Distri platform using:

- REST API for agent and task management
- Server-Sent Events (SSE) for real-time updates
- JSON-RPC for agent communication
- WebSocket fallback for older browsers

## Troubleshooting

### Common Issues

1. **Connection Error**: Ensure the Distri server is running and accessible
2. **CORS Issues**: Configure CORS on the Distri server
3. **Build Errors**: Clear node_modules and reinstall dependencies

### Debug Mode

Enable debug mode by setting the `debug` flag in the DistriProvider configuration:

```typescript
const config = {
  baseUrl: 'http://localhost:8080',
  debug: true,
  // ... other options
}
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure TypeScript compilation passes

## License

MIT License - see the LICENSE file for details.