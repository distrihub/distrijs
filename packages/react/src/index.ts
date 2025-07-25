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
export { AppSidebar } from './components/AppSidebar';
export { ThemeProvider, useTheme } from './components/ThemeProvider';

// UI Components - shadcn
export { Button } from './components/ui/button';
export { Input } from './components/ui/input';
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './components/ui/card';
export { Badge } from './components/ui/badge';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
export { Textarea } from './components/ui/textarea';
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './components/ui/sidebar';
export { Separator } from './components/ui/separator';
export { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './components/ui/sheet';
export { Skeleton } from './components/ui/skeleton';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

// Legacy exports (deprecated - use shadcn components instead)
export { AgentSelect } from './components/AgentSelect';
export { AgentDropdown } from './components/AgentDropdown';
export { default as ApprovalDialog } from './components/ApprovalDialog';
export { ChatInput } from './components/ChatInput';
export { default as MessageRenderer } from './components/MessageRenderer';

export { createBuiltinTools } from './useTools';
// Utilities
export { cn } from './lib/utils';