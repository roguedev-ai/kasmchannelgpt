# Demo Mode Documentation

## Overview

Demo Mode allows users to quickly try out CustomGPT UI by entering their API key directly in the browser, without needing server configuration. This is perfect for:

- Quick testing and evaluation
- Development and debugging
- Playground/sandbox environments
- Shared demo deployments

## How It Works

### Storage Method: Encrypted SessionStorage

Demo mode uses **encrypted sessionStorage** for API key storage:

- ✅ **Survives page refreshes** within the same tab
- ✅ **Automatically clears** when browser tab is closed
- ✅ **No cross-tab sharing** - each tab requires separate authentication
- ✅ **Basic encryption** to prevent casual observation
- ✅ **2-hour session timeout** for additional security

### Security Considerations

| Aspect | Details |
|--------|---------|
| **Visibility** | API key is sent with each request (visible in Network tab) |
| **Storage** | Encrypted in sessionStorage (not plain text) |
| **Persistence** | Only for browser tab session |
| **Sharing** | Cannot be shared via URL |
| **Timeout** | Auto-expires after 2 hours |

⚠️ **Important**: Demo mode is less secure than server-side configuration. Use it only for:
- Development environments
- Temporary testing
- Non-production deployments

## Configuration

### Enable Demo Mode (Default)

```bash
# In .env.local
NEXT_PUBLIC_DEMO_MODE=true
```

### Disable Demo Mode (Production)

```bash
# In .env.local
NEXT_PUBLIC_DEMO_MODE=false
CUSTOMGPT_API_KEY=your_server_side_api_key
```

## User Experience

### When Demo Mode is Enabled

1. User visits the app
2. Sees demo mode setup screen with:
   - CustomGPT API key input field (required)
   - Voice capability toggle (optional)
   - OpenAI API key input field (shown when voice is enabled)
   - Security warnings
   - Instructions for secure setup
3. Enters API key(s)
4. Keys are encrypted and stored in sessionStorage
5. App shows with demo mode banner
6. Session expires after 2 hours

### Demo Mode Banner

While in demo mode, users see a persistent banner showing:
- Demo mode active indicator
- Time remaining in session
- Option to end session
- Can be minimized to corner icon

## Technical Implementation

### Components

- `DemoModeProvider` - Wraps app and handles authentication flow
- `DemoModeScreen` - Initial API key entry screen
- `DemoModeBanner` - Persistent session indicator
- `useDemoStore` - Zustand store for demo state management

### API Integration

The proxy client automatically includes the demo API key in requests:

```typescript
// Automatic in demo mode
headers['X-CustomGPT-API-Key'] = demoApiKey
```

Server-side proxy checks for demo mode and uses appropriate key:

```typescript
if (isDemoMode) {
  apiKey = request.headers.get('X-CustomGPT-API-Key')
} else {
  apiKey = process.env.CUSTOMGPT_API_KEY
}
```

### Security Features

1. **Encryption**: Simple XOR encryption (obfuscation)
2. **Session Timeout**: 2-hour automatic expiration
3. **Validation**: API key format validation
4. **Clear Warnings**: Security notices throughout
5. **No URL Sharing**: Keys never appear in URL

### Voice Capability (Optional)

When voice capability is enabled:
- Users can provide their OpenAI API key for voice features
- Enables voice-to-text (Whisper) and text-to-speech (TTS)
- OpenAI key is stored with same security measures as CustomGPT key
- Both keys are cleared together on session end
- Voice features are only available when OpenAI key is provided

## URL Sharing Behavior

When a user shares a URL from a demo mode deployment:

1. **Recipient sees**: Fresh demo mode setup screen
2. **No key shared**: Each user must enter their own key
3. **Safe sharing**: No risk of accidental API key exposure
4. **Independent sessions**: Each browser tab is isolated

## Best Practices

### For Development

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE=true
# Use your development API key
```

### For Production

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE=false
CUSTOMGPT_API_KEY=your_production_key
# Never expose production keys to browser
```

### For Shared Demos

1. Deploy with `NEXT_PUBLIC_DEMO_MODE=true`
2. Share the URL freely
3. Each user provides their own API key
4. Monitor usage via CustomGPT dashboard

## Migration Path

To migrate from demo mode to production:

1. Set `NEXT_PUBLIC_DEMO_MODE=false`
2. Add `CUSTOMGPT_API_KEY` to server environment
3. Remove any stored demo keys from browsers
4. Deploy the updated configuration

## Troubleshooting

### Session Expired
- **Issue**: "Session expired" message
- **Solution**: Re-enter API key (automatic after 2 hours)

### Invalid API Key
- **Issue**: "Invalid API key format" error
- **Solution**: Check key format (alphanumeric, 20+ characters)

### API Errors
- **Issue**: 401 Unauthorized errors
- **Solution**: Verify API key is correct and active

### Page Refresh Required
- **Issue**: After closing/reopening tab
- **Solution**: Re-enter API key (by design for security)