import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getItemConversations } from '@/api/client';
import type { AIConversationSession, AIConversation } from '@/api/types';
import { Bot, User, MessageSquare, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface AIConversationViewerProps {
  client: string;
  batch: string;
  contentId: string;
  trigger?: React.ReactNode;
}

function getAgentLabel(agentType: string): string {
  switch (agentType) {
    case 'image_describer':
      return 'Image Describer';
    case 'caption_generator':
      return 'Caption Generator';
    case 'caption_supervisor':
      return 'Caption Supervisor';
    default:
      return agentType;
  }
}

function getAgentColor(agentType: string): string {
  switch (agentType) {
    case 'image_describer':
      return 'bg-blue-100 text-blue-700';
    case 'caption_generator':
      return 'bg-purple-100 text-purple-700';
    case 'caption_supervisor':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function ConversationEntry({ conv }: { conv: AIConversation }) {
  const isUser = conv.role === 'user';
  const agentColor = getAgentColor(conv.agent_type);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-start' : 'justify-start'}`}>
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-purple-600" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={agentColor} variant="secondary">
            {getAgentLabel(conv.agent_type)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Round {conv.round_number}
          </span>
          {conv.duration_ms && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(conv.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
          {conv.status === 'error' && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
        <div className="rounded-lg p-3 bg-muted/50 text-sm whitespace-pre-wrap">
          {isUser ? conv.prompt : conv.response}
        </div>
        {conv.error_message && (
          <p className="text-xs text-destructive">{conv.error_message}</p>
        )}
      </div>
    </div>
  );
}

export function AIConversationViewer({
  client,
  batch,
  contentId,
  trigger,
}: AIConversationViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<AIConversationSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getItemConversations(client, batch, contentId);
      setSessions(response.data?.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && sessions.length === 0) {
      loadConversations();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            AI Log
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Conversation Log
          </DialogTitle>
          <DialogDescription>
            View the AI agent conversation history for this content item
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading conversations...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadConversations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversation history found for this item.</p>
            <p className="text-sm mt-1">
              Conversations are recorded when captions are generated.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {sessions.map((session) => (
                <div key={session.session_id} className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span>Session: {session.session_id.slice(0, 20)}...</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {session.rounds.map((conv) => (
                    <ConversationEntry key={conv.id} conv={conv} />
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
