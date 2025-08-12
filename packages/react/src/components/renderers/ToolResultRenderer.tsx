import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, XCircle, Send } from 'lucide-react';

interface ToolResultRendererProps {
  toolCallId: string;
  toolName: string;
  result: string | number | boolean | null | object;
  success: boolean;
  error?: string;
  onSendResponse?: (toolCallId: string, response: string | number | boolean | null | object) => void;
  className?: string;
}

export function ToolResultRenderer({
  toolCallId,
  toolName,
  result,
  success,
  error,
  onSendResponse,
  className = ''
}: ToolResultRendererProps) {
  const getStatusIcon = () => {
    if (success) {
      return <CheckCircle className="w-4 h-4 text-primary" />;
    } else {
      return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = () => {
    if (success) {
      return 'bg-primary/10 text-primary';
    } else {
      return 'bg-destructive/10 text-destructive';
    }
  };

  const handleSendResponse = () => {
    if (onSendResponse) {
      onSendResponse(toolCallId, result);
    }
  };

  return (
    <Card className={`mb-4 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">{toolName}</CardTitle>
            <Badge variant="secondary" className={getStatusColor()}>
              {success ? 'Success' : 'Failed'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {toolCallId}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Result */}
        {result && (
          <div className="text-sm">
            <strong>Result:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1 max-h-32 overflow-y-auto">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm">
            <strong>Error:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-destructive/10 p-2 rounded mt-1 text-destructive">
              {error}
            </pre>
          </div>
        )}

        {/* Send Response Button */}
        {onSendResponse && success && (
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSendResponse}
              className="flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>Send Response</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 