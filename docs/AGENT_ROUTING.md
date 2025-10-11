# Function-Based Agent Routing

The platform supports routing queries to different CustomGPT agents based on the query intent.

## Agent Functions

### Sales
- **Keywords**: buy, purchase, price, pricing, cost, quote, sale, discount, order, payment
- **Use case**: Pricing inquiries, purchase processes, billing questions
- **Config**: `CUSTOMGPT_AGENT_SALES`

### Support
- **Keywords**: help, issue, problem, error, bug, trouble, support, assistance
- **Use case**: Customer service, troubleshooting, problem resolution
- **Config**: `CUSTOMGPT_AGENT_SUPPORT`

### Technical
- **Keywords**: api, integration, technical, code, develop, configure, setup, install
- **Use case**: Developer documentation, API usage, technical implementation
- **Config**: `CUSTOMGPT_AGENT_TECHNICAL`

### General
- **Default**: Any query that doesn't match above patterns
- **Use case**: General information, company info, basic questions
- **Config**: `CUSTOMGPT_AGENT_GENERAL` or `CUSTOMGPT_DEFAULT_AGENT_ID`

## Configuration

### Single Agent (Default)
Use one agent for all queries:
```env
CUSTOMGPT_DEFAULT_AGENT_ID=123456
```

### Function-Specific Agents
Configure different agents for different functions:
```env
CUSTOMGPT_DEFAULT_AGENT_ID=123456  # Fallback
CUSTOMGPT_AGENT_SALES=111111      # Sales agent
CUSTOMGPT_AGENT_SUPPORT=222222    # Support agent
CUSTOMGPT_AGENT_TECHNICAL=333333  # Technical agent
CUSTOMGPT_AGENT_GENERAL=444444    # General agent
```

If a function-specific agent is not configured, it falls back to `CUSTOMGPT_DEFAULT_AGENT_ID`.

## Auto-Detection

The system automatically detects the query intent based on keywords:

| Query | Detected Function |
|-------|------------------|
| "What's the price of your pro plan?" | Sales |
| "I'm having trouble logging in" | Support |
| "How do I integrate your API?" | Technical |
| "What is your company about?" | General |

## Manual Selection

You can override auto-detection by specifying the agent function in the API request:

```bash
curl -X POST https://your-domain.com/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about your product",
    "agentFunction": "sales"
  }'
```

## Adding Custom Keywords

To customize keyword detection, edit `src/lib/rag/agent-router.ts` and modify the keyword arrays:

```typescript
const salesKeywords = [
  'buy', 'purchase', 'price',
  // Add your custom keywords here
];
```

## System Prompts

Each function gets a specialized system prompt:

### Sales Agent
```
You are a helpful AI assistant specialized in sales. Use the following context 
from the user's documents to answer their question...
```

### Support Agent
```
You are a helpful AI assistant specialized in support. Use the following context 
from the user's documents to answer their question...
```

### Technical Agent
```
You are a helpful AI assistant specialized in technical documentation. Use the 
following context from the user's documents to answer their question...
```

### General Agent
```
You are a helpful AI assistant. Use the following context from the user's 
documents to answer their question...
```

## Monitoring & Debugging

Enable debug logging in `.env.local`:
```env
DEBUG=true
```

This will show:
- Function detection process
- Selected agent IDs
- System prompt generation
- API responses

## Best Practices

1. **Agent Configuration**
   - Configure specialized agents for your most common query types
   - Use descriptive agent names in CustomGPT dashboard
   - Test each agent with sample queries

2. **Keyword Management**
   - Review and update keywords based on actual usage
   - Add domain-specific terminology
   - Consider language variations

3. **System Prompts**
   - Keep prompts focused on the function
   - Include function-specific instructions
   - Reference relevant documentation

4. **Monitoring**
   - Track function detection accuracy
   - Monitor fallback usage
   - Review agent performance

## Future Enhancements

1. Machine learning-based function detection
2. Multi-language keyword support
3. Custom function definitions
4. Function-specific rate limiting
5. Usage analytics by function
