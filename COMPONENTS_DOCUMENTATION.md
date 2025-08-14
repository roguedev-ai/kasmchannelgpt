# CustomGPT UI Components Documentation

## Overview

This document provides comprehensive documentation for all React components and TypeScript files in the CustomGPT UI codebase. The architecture follows Next.js 14 App Router patterns with TypeScript, Zustand state management, and Tailwind CSS styling.

## Architecture Summary

### Core Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **API Layer**: Custom proxy client with server-side authentication

### Deployment Modes
1. **Standalone**: Full Next.js application with dashboard
2. **Widget**: Embeddable chat widget (webpack bundle)
3. **Iframe**: Isolated iframe deployment for secure embedding

---

## App Router Structure (src/app/)

### Core Pages

#### `src/app/page.tsx` - Home/Landing Page
**Purpose**: Main entry point handling initial setup flow and authentication

**Key Features**:
- API key validation and setup
- Conditional rendering based on configuration state
- Dynamic ChatLayout import to prevent SSR issues
- Toast notifications for user feedback
- Responsive viewport-filling layout

**Flow**:
1. Check API key configuration
2. Show setup screen if not configured
3. Render chat interface once authenticated

---

#### `src/app/layout.tsx` - Root Layout
**Purpose**: Global layout wrapper with theme and state providers

**Provides**:
- Theme configuration and CSS globals
- Global state store initialization
- SEO metadata and viewport settings
- Font optimization and loading

---

#### `src/app/dashboard/page.tsx` - Dashboard Overview
**Purpose**: Main dashboard landing page with system overview

**Features**:
- Quick stats and metrics
- Agent management overview
- Recent activity feed
- Navigation shortcuts

---

### Dashboard Pages

#### `src/app/dashboard/analytics/page.tsx` - Analytics Dashboard
**Purpose**: Comprehensive analytics and reporting interface

**Components Used**:
- MetricCard for KPI display
- LineChart/BarChart for visualizations
- DateRangePicker for time filtering
- Various analytics-specific UI elements

---

#### `src/app/dashboard/projects/create/page.tsx` - Project Creation
**Purpose**: Agent/project creation workflow

**Features**:
- Multi-step form wizard
- File upload for knowledge base
- Configuration options
- Progress tracking

---

### API Proxy Routes (src/app/api/)

All API routes use the proxy pattern to handle server-side authentication and CORS.

#### Core Proxy Handler
- **Location**: `src/app/api/proxy/[...path]/route.ts`
- **Purpose**: Catch-all proxy for CustomGPT API endpoints
- **Security**: Adds authentication headers server-side
- **Features**: CORS handling, request/response transformation

---

## Core Components

### Chat System (src/components/chat/)

#### `ChatContainer.tsx` - Main Chat Interface
**Purpose**: Primary chat component managing the entire chat experience

**Key Features**:
- Message display with real-time streaming
- Agent selection and switching
- Citation handling with modal details
- Multiple deployment mode support
- Welcome screen with example prompts
- Comprehensive error handling
- Authorization checks

**State Management**:
- Uses Zustand stores for messages, conversations, agents
- Handles streaming state and message updates
- Manages citation data and modal states

**Integration Points**:
- Connects to streaming API endpoints
- Handles voice input/output
- Manages file uploads and attachments

---

#### `ChatInput.tsx` - Rich Input Component
**Purpose**: Advanced input field for message composition and file uploads

**Features**:
- Auto-expanding textarea (max 200px height)
- Drag-and-drop file upload support
- Speech-to-text transcription (OpenAI Whisper)
- File validation and progress tracking
- Character count display
- Keyboard shortcuts (Enter/Shift+Enter)
- Animated file chips and drag overlays

**File Handling**:
- Supports multiple file types
- Size and type validation
- Upload progress tracking
- Drag-and-drop visual feedback

---

#### `Message.tsx` - Message Display Component
**Purpose**: Individual message rendering with rich content support

**Features**:
- Markdown rendering support
- Code syntax highlighting
- Citation link handling
- User/Assistant message styling
- Timestamp display
- Message actions (copy, feedback)
- Loading states for streaming messages

---

#### `AgentSelector.tsx` - Agent/Project Selector
**Purpose**: Dropdown interface for switching between agents/projects

**Features**:
- Project list with search/filter
- Project metadata display
- Loading states during switches
- Responsive design (mobile/desktop variants)
- Agent capability indicators

---

#### `ConversationSidebar.tsx` - Conversation History
**Purpose**: Sidebar showing conversation history and management

**Features**:
- Conversation list with timestamps
- New conversation creation
- Conversation deletion
- Search/filter capabilities
- Mobile-responsive drawer

---

#### `CitationDetailsModal.tsx` - Citation Modal
**Purpose**: Modal for displaying detailed citation information

**Features**:
- Citation metadata display
- Source file preview
- Related citations
- Action buttons (view, share)

---

### Dashboard Components (src/components/dashboard/)

#### `DashboardLayout.tsx` - Dashboard Layout Wrapper
**Purpose**: Main layout for dashboard pages with sidebar navigation

**Features**:
- Collapsible sidebar navigation
- Multi-level navigation menu
- Badge support for notifications
- User profile dropdown
- Search functionality
- Responsive mobile design
- Smooth animations
- Active page highlighting

**Navigation Structure**:
- Dashboard overview
- Agent management
- Conversation history
- Analytics & reports
- Page/document management
- Data source configuration
- Settings

---

#### `DashboardOverview.tsx` - Dashboard Main Content
**Purpose**: Dashboard home page content with key metrics

**Features**:
- Usage statistics cards
- Recent activity feed
- Quick action buttons
- Performance metrics
- System status indicators

---

#### `AgentManagement.tsx` - Agent Administration
**Purpose**: Interface for managing agents/projects

**Features**:
- Agent list with search/filter
- Bulk operations
- Agent creation wizard
- Settings access
- Status indicators

---

### Project Settings (src/components/projects/)

#### `AdvancedSettings.tsx` - Advanced Configuration
**Purpose**: Advanced project configuration options

**Settings Categories**:
- Model selection (GPT variants)
- Agent capabilities
- Feedback enablement
- Loading indicators
- Knowledge base awareness
- Markdown support

**Features**:
- Real-time settings updates
- Validation and error handling
- Demo mode restrictions
- Mobile-responsive design

---

#### `CitationsSettings.tsx` - Citation Configuration
**Purpose**: Configure how citations are displayed and handled

**Options**:
- Citation display format
- Source linking behavior
- Citation grouping
- Metadata inclusion

---

#### `ConversationsSettings.tsx` - Conversation Management
**Purpose**: Configure conversation behavior and storage

**Settings**:
- Conversation retention
- Auto-save behavior
- Export options
- Privacy settings

---

### UI Components (src/components/ui/)

#### Core UI Primitives
Built on Radix UI with Tailwind styling:

- **`button.tsx`**: Button component with variants and sizes
- **`card.tsx`**: Card container with header/content/footer
- **`dialog.tsx`**: Modal dialog with overlay and animations
- **`input.tsx`**: Input field with validation states
- **`select.tsx`**: Dropdown select with search support
- **`loading.tsx`**: Loading indicators (spinner, skeleton, dots)

#### Specialized UI Components

##### `loading.tsx` - Loading States
**Components**:
- `Spinner`: Rotating loading indicator
- `MessageSkeleton`: Chat message placeholder
- `ConversationSkeleton`: Conversation list placeholder
- `LoadingOverlay`: Full overlay with backdrop blur
- `LoadingDots`: Animated dots for typing indication

---

### Voice Components (src/components/voice/)

#### `VoiceModal.tsx` - Voice Interface
**Purpose**: Modal interface for voice interactions

**Features**:
- Speech-to-text recording
- Text-to-speech playback
- Visual audio feedback
- Multiple voice themes
- Canvas-based visualizations

#### `AnimatedVoiceIcon.tsx` - Voice Indicator
**Purpose**: Animated icon showing voice activity

**Features**:
- Real-time audio visualization
- Multiple animation themes
- Responsive design
- Performance optimization

---

### Demo/Trial Components (src/components/demo/)

#### `DemoModeProvider.tsx` - Demo Mode Context
**Purpose**: Manages demo/trial mode state and restrictions

**Features**:
- Trial time tracking
- Usage limit enforcement
- Feature restrictions
- Captcha integration

#### `SimpleCaptcha.tsx` - Bot Protection
**Purpose**: Simple math-based captcha for trial users

**Features**:
- Random math problems
- Input validation
- Rate limiting protection

---

## State Management (src/store/)

### Core Stores

#### `agents.ts` - Agent/Project State
**Purpose**: Manages agent data and operations

**State**:
- Current agent selection
- Agent list and metadata
- Loading/error states
- Agent settings cache

**Actions**:
- Fetch agents list
- Switch current agent
- Update agent settings
- Create/delete agents

---

#### `conversations.ts` - Conversation Management
**Purpose**: Handles conversation history and state

**State**:
- Conversation list
- Current conversation
- Conversation metadata

**Actions**:
- Create new conversations
- Fetch conversation history
- Delete conversations
- Switch active conversation

---

#### `messages.ts` - Message State
**Purpose**: Manages chat messages and streaming

**State**:
- Messages by conversation
- Streaming state
- Message metadata
- Error states

**Actions**:
- Send messages
- Handle streaming responses
- Update message status
- Add citations

---

#### `config.ts` - Application Configuration
**Purpose**: Global app configuration and settings

**State**:
- API configuration
- UI preferences
- Feature flags
- Environment settings

---

### Widget-Specific Stores (src/store/widget-stores/)

Isolated versions of core stores for widget deployment mode:
- `agents.ts` - Widget agent management
- `conversations.ts` - Widget conversation handling  
- `messages.ts` - Widget message state

**Purpose**: Prevent state conflicts when embedding as widget

---

## Widget System (src/widget/)

### Core Widget Components

#### `index.tsx` - Widget Entry Point
**Purpose**: Main entry point for embeddable widget

**Features**:
- Isolated CSS scoping
- PostMessage communication
- Responsive sizing
- Theme isolation

#### `FloatingButton.tsx` - Floating Chat Button
**Purpose**: Floating action button to open chat widget

**Features**:
- Customizable positioning
- Unread message indicators
- Smooth animations
- Mobile optimization

#### `WidgetContext.tsx` - Widget-Specific Context
**Purpose**: Context provider for widget-specific functionality

**Features**:
- Widget mode detection
- Parent page communication
- Isolated state management

---

## Hooks (src/hooks/)

### Custom Hooks

#### `useWidgetStore.ts` - Widget Store Hook
**Purpose**: Provides access to widget-specific stores

**Usage**: Automatically detects widget mode and returns appropriate stores

#### `useMediaQuery.ts` - Responsive Hook
**Purpose**: Responsive breakpoint detection

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

#### `useLimits.ts` - Usage Limits Hook
**Purpose**: Tracks and enforces usage limits for demo mode

**Features**:
- Message count tracking
- Time-based limits
- Feature restrictions

---

## API Layer (src/lib/api/)

### Core API Components

#### `proxy-client.ts` - API Client
**Purpose**: Client-side interface to CustomGPT API via proxy

**Methods**:
- `getProjects()`: Fetch user projects
- `sendMessage()`: Send chat message
- `uploadFile()`: Upload documents
- `getConversations()`: Fetch conversation history

#### `proxy-handler.ts` - Proxy Server Logic
**Purpose**: Server-side API proxy handling

**Features**:
- Authentication header injection
- Request/response transformation
- Error handling and logging
- Rate limiting support

---

## Utilities (src/lib/)

### Core Utilities

#### `utils.ts` - General Utilities
**Functions**:
- `cn()`: Tailwind class merging
- `formatFileSize()`: Human-readable file sizes
- `generateId()`: Unique ID generation
- `validateEmail()`: Email validation

#### `streaming/handler.ts` - Stream Management
**Purpose**: Handles Server-Sent Events for message streaming

**Features**:
- Concurrent stream management
- Automatic cleanup and error recovery
- Message parsing and routing

---

## Type Definitions (src/types/)

### Core Types

#### `index.ts` - Main Type Exports
**Key Types**:
- `Agent`: Project/agent data structure
- `ChatMessage`: Message interface
- `Conversation`: Conversation metadata
- `Citation`: Citation reference data

#### `message.types.ts` - Message Types
**Types**:
- `MessageType`: User/Assistant/System
- `MessageStatus`: Sent/Delivered/Read/Error
- `MessageContent`: Text/File/Voice content

---

## Performance Optimizations

### Loading Strategies
- **Component Splitting**: Dynamic imports for non-critical components
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Separate chunks for widget and main app

### State Optimization
- **Selective Persistence**: Only critical state persisted to localStorage
- **Computed Values**: Zustand computed selectors for derived state
- **Subscription Optimization**: Component-level store subscriptions

### Mobile Optimizations
- **Touch Gestures**: Custom touch handling for mobile interactions
- **Viewport Optimization**: Proper viewport meta configuration
- **Performance Monitoring**: Real-time performance metrics

---

## Development Guidelines

### Component Structure
```typescript
interface ComponentProps {
  // Props interface
}

export function Component({ prop }: ComponentProps) {
  // Hooks
  // Local state
  // Effects
  // Handlers
  // Render
}
```

### State Management Patterns
```typescript
// Store definition
interface StoreState {
  // State interface
}

interface StoreActions {
  // Actions interface
}

export const useStore = create<StoreState & StoreActions>()((set, get) => ({
  // State and actions implementation
}));
```

### Error Handling
- Use toast notifications for user-facing errors
- Log errors to console in development
- Graceful degradation for failed API calls
- Loading states during async operations

---

## Testing Strategy

### Component Testing
- Jest + React Testing Library
- Mock API responses
- Test user interactions
- Accessibility testing

### Integration Testing
- End-to-end with Playwright
- Widget embedding scenarios
- Cross-browser compatibility
- Mobile responsiveness

---

## Deployment Configuration

### Build Outputs
- **Standalone**: `.next/` - Next.js application
- **Widget**: `dist/widget/customgpt-widget.js` - Self-contained bundle
- **Iframe**: `dist/iframe/` - Separate HTML application

### Environment Variables
```bash
CUSTOMGPT_API_KEY=your_api_key_here
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
ALLOWED_ORIGINS=https://yourdomain.com
```

### Security Considerations
- API keys never exposed to client-side
- CORS restrictions enforced
- Content Security Policy headers
- Rate limiting on API endpoints

---

## Customization Guide

### Styling
- Modify `tailwind.config.js` for design system changes
- Update CSS variables in `globals.css`
- Use Tailwind utilities throughout components

### Branding
- Update logo and images in `public/` directory
- Modify welcome messages in `ChatContainer`
- Customize theme colors and typography

### Features
- Add new API endpoints in `src/app/api/proxy/`
- Create new pages under `src/app/`
- Extend stores for additional state management
- Add new components following established patterns

---

This documentation provides a comprehensive overview of the CustomGPT UI codebase architecture, components, and functionality. Each component is designed for modularity, reusability, and maintainability while following modern React and TypeScript best practices.