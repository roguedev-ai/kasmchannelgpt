import { useEffect, useState } from 'react';
import { ChatContainer } from '../components/chat/ChatContainer';

interface Config {
  mode: 'widget' | 'floating';
  partnerId: string;
}

export function IframeApp() {
  const [config, setConfig] = useState<Config>({
    mode: 'widget',
    partnerId: 'demo',
  });
  
  useEffect(() => {
    const setupMessageHandling = () => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'config') {
          setConfig(event.data.config);
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    };
    
    setupMessageHandling();
  }, []);
  
  const handleClose = () => {
    window.parent.postMessage({ type: 'close' }, '*');
  };
  
  return (
    <div className="h-screen bg-gray-50">
      <ChatContainer partnerId={config.partnerId} />
    </div>
  );
}
