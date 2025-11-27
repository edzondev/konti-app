import { ChatLoading } from './chat-loading';
import { ChatError } from './chat-error';

interface ChatFooterProps {
  isLoading: boolean;
  error: string | null;
}

export function ChatFooter({ isLoading, error }: ChatFooterProps) {
  if (isLoading && !error) {
    return <ChatLoading />;
  }

  if (!isLoading && error) {
    return <ChatError message={error} />;
  }

  return null;
}
