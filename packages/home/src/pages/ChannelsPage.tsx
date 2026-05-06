import { Send } from 'lucide-react';
import { NotAvailableInOss } from '../blocks/NotAvailableInOss';

/**
 * ChannelsPage — placeholder for OSS. Channels (Slack/Telegram/Discord bots,
 * channel-scoped chat) are a cloud-only feature today.
 */
export function ChannelsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <Send className="h-4 w-4" />
        <h1 className="text-base font-semibold sm:text-lg">Channels</h1>
      </div>
      <NotAvailableInOss
        feature="Channels"
        description="Connect agents to Slack, Telegram, Discord, and other messaging platforms. Available in Distri Cloud."
        icon={Send}
      />
    </div>
  );
}
