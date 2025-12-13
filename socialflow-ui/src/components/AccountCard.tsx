import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { LateAccount } from '@/api/types';

interface AccountCardProps {
  account: LateAccount;
  linkedClient?: string;
}

export function AccountCard({ account, linkedClient }: AccountCardProps) {
  const healthConfigs = {
    healthy: {
      variant: 'outline' as const,
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      text: 'Healthy',
    },
    warning: {
      variant: 'outline' as const,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      text: 'Warning',
    },
    expired: {
      variant: 'destructive' as const,
      className: '',
      text: 'Expired',
    },
  };

  const healthConfig = healthConfigs[account.health] || healthConfigs.healthy;

  const platformEmoji = account.platform === 'instagram' ? '📷' : '🎵';

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={account.profile_picture} alt={account.username} />
          <AvatarFallback>{(account.username || '?')[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{platformEmoji}</span>
            <span className="font-medium truncate">{account.username}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {account.display_name} • Profile: {account.late_profile_name}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={healthConfig.variant} className={healthConfig.className}>
              {healthConfig.text}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {account.days_until_expiry === 0
                ? 'Expires today!'
                : account.days_until_expiry < 0
                ? 'Expired'
                : `${account.days_until_expiry} days until expiry`}
            </span>
          </div>

          <p className="mt-2 text-sm">
            {linkedClient ? (
              <span className="text-muted-foreground">
                Linked to: <span className="font-medium text-foreground">{linkedClient}</span>
              </span>
            ) : (
              <span className="text-muted-foreground italic">Not linked to any client</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
