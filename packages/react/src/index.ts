// Core hooks
export { useAgent } from './useAgent';
export { useAgents } from './useAgents';
export { useChat } from './useChat';
export { useThreads } from './useThreads';
export { useTools } from './useTools';

// Core components
export { DistriProvider } from './DistriProvider';
export { ChatContainer } from './components/ChatContainer';
export { Chat } from './components/Chat';
export { EmbeddableChat } from './components/EmbeddableChat';
export { FullChat } from './components/FullChat';
export { ThemeProvider, useTheme } from './components/ThemeProvider';

// UI Components - shadcn
export { Button } from './components/ui/button';
export { Input } from './components/ui/input';
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './components/ui/card';
export { Badge } from './components/ui/badge';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
export { Textarea } from './components/ui/textarea';

// Legacy exports (deprecated - use shadcn components instead)
export { AgentDropdown } from './components/AgentDropdown';
export { default as ApprovalDialog } from './components/ApprovalDialog';
export { ChatInput } from './components/ChatInput';
export { default as MessageRenderer } from './components/MessageRenderer';
export { ThemeToggle } from './components/ThemeToggle';
export { ThemeDropdown } from './components/ThemeDropdown';
export { ModeToggle } from './components/ModeToggle';
export { default as Toast } from './components/Toast';

export { createTool, createBuiltinTools } from './useTools';
// Utilities
export { cn } from './components/ui/utils';