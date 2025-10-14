import { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
  partnerId: string;
}

export function ChatLayout({ children, partnerId }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
}
