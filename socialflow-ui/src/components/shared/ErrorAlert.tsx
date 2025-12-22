import { useState } from 'react';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ title = 'Error', message, onRetry }: ErrorAlertProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex items-start gap-2">
          <code className="flex-1 text-sm bg-destructive/10 p-2 rounded select-all break-all">
            {message}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleCopy}
            title="Copy error message"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
