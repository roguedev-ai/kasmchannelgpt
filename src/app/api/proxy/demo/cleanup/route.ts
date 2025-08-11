/**
 * Demo Cleanup API
 * 
 * Handles cleanup of resources created during free trial sessions.
 * Deletes projects, conversations, and other resources when session expires.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionResources, clearSessionTracking } from '@/lib/api/demo-limits-middleware';
import { DEMO_API_HEADERS } from '@/lib/constants/demo-limits';
import { getApiHeaders } from '@/lib/api/headers';

interface CleanupResult {
  success: boolean;
  resourceId: string;
  resourceType: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    let sessionId: string | null = null;
    let reason: string = 'unknown';
    
    // Check if request is FormData (from sendBeacon)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        sessionId = formData.get('sessionId') as string;
        reason = formData.get('reason') as string || 'unknown';
      } catch (e) {
        console.error('[Demo Cleanup] Failed to parse FormData:', e);
      }
    } else {
      // Regular JSON request
      const isFreeTrialMode = request.headers.get(DEMO_API_HEADERS.FREE_TRIAL) === 'true';
      
      if (!isFreeTrialMode) {
        return NextResponse.json(
          { error: 'This endpoint is only available in free trial mode' },
          { status: 403 }
        );
      }
      
      // Get session ID from header
      sessionId = request.headers.get(DEMO_API_HEADERS.SESSION_ID);
    }
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    console.log(`[Demo Cleanup] Starting cleanup for session ${sessionId}, reason: ${reason}`);
    
    // Get demo API key for cleanup operations
    const demoApiKey = process.env.CUSTOMGPT_API_KEY_DEMO_USE_ONLY;
    if (!demoApiKey) {
      console.error('[Demo Cleanup] No demo API key configured');
      return NextResponse.json(
        { error: 'Demo cleanup not available' },
        { status: 503 }
      );
    }
    
    // Get resources created in this session
    const resources = getSessionResources(sessionId);
    console.log(`[Demo Cleanup] Found ${resources.length} resources to clean up for session ${sessionId}`);
    
    const results: CleanupResult[] = [];
    const baseUrl = 'https://app.customgpt.ai/api/v1';
    const headers = getApiHeaders(demoApiKey);
    
    // Delete resources in reverse order (messages, conversations, then projects)
    // This ensures we don't try to delete a project that still has conversations
    const sortedResources = [...resources].sort((a, b) => {
      const order = { message: 0, conversation: 1, project: 2 };
      return order[a.type] - order[b.type];
    });
    
    for (const resource of sortedResources) {
      try {
        let deleteUrl = '';
        
        switch (resource.type) {
          case 'project':
            deleteUrl = `${baseUrl}/projects/${resource.id}`;
            break;
          case 'conversation':
            // Conversations might need to be deleted through their project
            // Skip for now as deleting the project should cascade
            console.log(`[Demo Cleanup] Skipping conversation ${resource.id} - will be deleted with project`);
            results.push({
              success: true,
              resourceId: resource.id,
              resourceType: resource.type,
            });
            continue;
          case 'message':
            // Messages are deleted with conversations
            console.log(`[Demo Cleanup] Skipping message ${resource.id} - will be deleted with conversation`);
            results.push({
              success: true,
              resourceId: resource.id,
              resourceType: resource.type,
            });
            continue;
        }
        
        if (deleteUrl) {
          console.log(`[Demo Cleanup] Deleting ${resource.type} ${resource.id}`);
          
          const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers,
          });
          
          if (response.ok) {
            results.push({
              success: true,
              resourceId: resource.id,
              resourceType: resource.type,
            });
          } else {
            const errorText = await response.text();
            console.error(`[Demo Cleanup] Failed to delete ${resource.type} ${resource.id}:`, errorText);
            results.push({
              success: false,
              resourceId: resource.id,
              resourceType: resource.type,
              error: `Failed with status ${response.status}`,
            });
          }
        }
      } catch (error) {
        console.error(`[Demo Cleanup] Error deleting resource ${resource.id}:`, error);
        results.push({
          success: false,
          resourceId: resource.id,
          resourceType: resource.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    // Clear session tracking
    clearSessionTracking(sessionId);
    
    // Return cleanup results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`[Demo Cleanup] Cleanup completed: ${successCount} successful, ${failureCount} failed`);
    
    return NextResponse.json({
      status: 'success',
      data: {
        sessionId,
        totalResources: resources.length,
        successCount,
        failureCount,
        results,
      },
    });
  } catch (error) {
    console.error('[Demo Cleanup API] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to perform cleanup' },
      { status: 500 }
    );
  }
}

// Also support GET for checking cleanup status
export async function GET(request: NextRequest) {
  const sessionId = request.headers.get(DEMO_API_HEADERS.SESSION_ID);
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'No session ID provided' },
      { status: 400 }
    );
  }
  
  const resources = getSessionResources(sessionId);
  
  return NextResponse.json({
    status: 'success',
    data: {
      sessionId,
      resourceCount: resources.length,
      resources: resources.map(r => ({
        type: r.type,
        id: r.id,
        createdAt: r.createdAt,
      })),
    },
  });
}