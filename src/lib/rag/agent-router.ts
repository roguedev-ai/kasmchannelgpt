import { backendConfig } from '../config/backend';

export type AgentFunction = 'sales' | 'support' | 'technical' | 'general';

export interface AgentConfig {
  agentId: string;
  function: AgentFunction;
  description: string;
}

/**
 * Get CustomGPT agent ID for a specific function
 */
export function getAgentForFunction(func: AgentFunction): string | undefined {
  const agentMap: Record<AgentFunction, string | undefined> = {
    sales: backendConfig.customGptAgents?.sales,
    support: backendConfig.customGptAgents?.support,
    technical: backendConfig.customGptAgents?.technical,
    general: backendConfig.customGptAgents?.general,
  };
  
  const agentId = agentMap[func] || backendConfig.customGptDefaultAgentId;
  
  console.log(`[Agent Router] Function '${func}' -> Agent ID: ${agentId || 'none'}`);
  
  return agentId;
}

/**
 * Detect function from query using keyword matching
 */
export function detectFunctionFromQuery(query: string): AgentFunction {
  const lowerQuery = query.toLowerCase();
  
  // Sales keywords
  const salesKeywords = [
    'buy', 'purchase', 'price', 'pricing', 'cost', 'quote', 
    'sale', 'discount', 'order', 'payment', 'invoice', 'billing'
  ];
  if (salesKeywords.some(kw => new RegExp(`\\b${kw}\\b`).test(lowerQuery))) {
    console.log('[Agent Router] Detected function: sales');
    return 'sales';
  }
  
  // Support keywords
  const supportKeywords = [
    'help', 'issue', 'problem', 'error', 'bug', 'trouble',
    'support', 'assistance', 'fix', 'broken', 'not working'
  ];
  if (supportKeywords.some(kw => new RegExp(`\\b${kw}\\b`).test(lowerQuery))) {
    console.log('[Agent Router] Detected function: support');
    return 'support';
  }
  
  // Technical keywords
  const technicalKeywords = [
    'api', 'integration', 'technical', 'code', 'develop',
    'configure', 'setup', 'install', 'implementation', 'documentation'
  ];
  if (technicalKeywords.some(kw => new RegExp(`\\b${kw}\\b`).test(lowerQuery))) {
    console.log('[Agent Router] Detected function: technical');
    return 'technical';
  }
  
  // Default to general
  console.log('[Agent Router] Detected function: general (default)');
  return 'general';
}

/**
 * Get all configured agents
 */
export function getAvailableAgents(): AgentConfig[] {
  const agents: AgentConfig[] = [];
  
  if (backendConfig.customGptAgents?.sales) {
    agents.push({
      agentId: backendConfig.customGptAgents.sales,
      function: 'sales',
      description: 'Sales inquiries, pricing, and orders',
    });
  }
  
  if (backendConfig.customGptAgents?.support) {
    agents.push({
      agentId: backendConfig.customGptAgents.support,
      function: 'support',
      description: 'Customer support and troubleshooting',
    });
  }
  
  if (backendConfig.customGptAgents?.technical) {
    agents.push({
      agentId: backendConfig.customGptAgents.technical,
      function: 'technical',
      description: 'Technical documentation and API questions',
    });
  }
  
  if (backendConfig.customGptAgents?.general || backendConfig.customGptDefaultAgentId) {
    agents.push({
      agentId: backendConfig.customGptAgents?.general || backendConfig.customGptDefaultAgentId!,
      function: 'general',
      description: 'General questions and information',
    });
  }
  
  return agents;
}
