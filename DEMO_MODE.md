# Demo Mode Documentation

## Overview

CustomGPT UI now supports runtime deployment mode selection. When you first visit the app, you can choose between:

- **Demo Mode**: Enter API keys directly in the browser for quick testing
- **Production Mode**: Use server-side API keys for secure production deployments

This flexible approach allows:
- Quick testing and evaluation without server setup
- Secure production deployments with server-side keys
- Easy switching between modes
- No build-time configuration required

## How It Works

### Runtime Mode Selection

When you first visit the app:

1. You'll see a deployment mode selection screen
2. Choose either "Demo Mode" or "Production Mode"
3. Your choice is saved in localStorage
4. The app configures itself accordingly

### Demo Mode

Demo mode uses **encrypted sessionStorage** for API key storage:

- ✅ **Survives page refreshes** within the same tab
- ✅ **Automatically clears** when browser tab is closed
- ✅ **No cross-tab sharing** - each tab requires separate authentication
- ✅ **Basic encryption** to prevent casual observation
- ✅ **2-hour session timeout** for additional security

### Production Mode

Production mode uses server-side API keys:

- ✅ **Secure**: API keys never sent to browser
- ✅ **Persistent**: Works across all sessions
- ✅ **Shared**: All users share the same server configuration
- ✅ **Professional**: Suitable for production deployments

## Security Considerations

### Demo Mode Security

| Aspect | Details |
|--------|---------|
| **Visibility** | API key is sent with each request (visible in Network tab) |
| **Storage** | Encrypted in sessionStorage (not plain text) |
| **Persistence** | Only for browser tab session |
| **Sharing** | Cannot be shared via URL |
| **Timeout** | Auto-expires after 2 hours |

⚠️ **Important**: Demo mode is less secure than production mode. Use it only for:
- Development environments
- Temporary testing
- Personal use
- Proof of concepts

### Production Mode Security

| Aspect | Details |
|--------|---------|
| **Visibility** | API key never exposed to browser |
| **Storage** | Secure server environment variables |
| **Persistence** | Permanent server configuration |
| **Sharing** | All users share server's API access |
| **Best Practice** | Recommended for production use |

## Configuration

### For Production Deployments

Add your API keys to the server environment:

```bash
# In .env.local
CUSTOMGPT_API_KEY=your_server_side_api_key
OPENAI_API_KEY=your_openai_key  # Optional, for voice features
```

### For Development

No configuration needed! Just run the app and select your preferred mode.

## User Experience

### First Visit

1. User visits the app
2. Sees deployment mode selection screen
3. Chooses between Demo Mode or Production Mode
4. Proceeds based on selection

### Demo Mode Flow

1. User selects "Demo Mode"
2. Enters their CustomGPT API key
3. Optionally enters OpenAI API key for voice features
4. Starts using the app immediately

### Production Mode Flow

1. User selects "Production Mode"
2. If server keys are configured:
   - User proceeds directly to the app
3. If server keys are missing:
   - User sees setup instructions
   - Admin must configure server environment

## Switching Modes

To switch between modes:

1. Clear your browser's localStorage
2. Refresh the page
3. Select the new mode

Or programmatically:
```javascript
localStorage.removeItem('customgpt.deploymentMode');
location.reload();
```

## Voice Features

Voice features require an OpenAI API key:

- **Demo Mode**: Enter OpenAI key in the demo settings
- **Production Mode**: Add `OPENAI_API_KEY` to server environment

## Common Use Cases

### For Developers

1. Run the app locally
2. Select "Demo Mode"
3. Use your development API keys
4. Test features quickly

### For Production

1. Deploy with server-side API keys
2. Users automatically use "Production Mode"
3. No API key management for end users

### For Shared Demos

1. Deploy without server keys
2. Share the URL
3. Each user selects "Demo Mode"
4. Each user provides their own API key

## Migration Guide

### From Old Demo Mode to New System

The old `NEXT_PUBLIC_DEMO_MODE` environment variable is no longer needed. The app now:

1. Automatically detects runtime mode from localStorage
2. Shows mode selection on first visit
3. Respects user's choice across sessions

### To Force Production Mode

If you want to prevent demo mode entirely:

1. Configure server-side API keys
2. Modify the deployment mode selection logic
3. Or set a server-side flag to skip selection

## Troubleshooting

### "API Configuration Required" in Demo Mode

- Ensure you've entered your API key in demo settings
- Check that the key is valid
- Try refreshing the page

### Can't Switch Modes

- Clear browser localStorage
- Use incognito/private browsing
- Check browser console for errors

### Voice Features Not Working

- Ensure OpenAI API key is provided
- Check browser microphone permissions
- Verify both CustomGPT and OpenAI keys are valid

## Technical Details

### Storage Locations

- **Deployment Mode**: `localStorage.getItem('customgpt.deploymentMode')`
- **Demo Keys**: Encrypted in sessionStorage
- **User Preferences**: localStorage with `customgpt.` prefix

### API Request Headers

Demo mode automatically adds:
- `X-Deployment-Mode: demo`
- `X-CustomGPT-API-Key: [user's key]`
- `X-OpenAI-API-Key: [user's key]` (if provided)

### Session Management

- Session validated every 60 seconds
- Expires after 2 hours of inactivity
- Cleared on browser tab close