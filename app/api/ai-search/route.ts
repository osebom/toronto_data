import { NextResponse } from 'next/server';
import { Cohere, CohereClient } from 'cohere-ai';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/server-rate-limit';

// Log that the module is loaded
console.log('[AI Search API] Module loaded at', new Date().toISOString());
process.stdout.write('[AI Search API] Module loaded (stdout)\n');

// Initialize Cohere client only when API key is available
function getCohereClient(): CohereClient | null {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new CohereClient({ token: apiKey });
}

export interface ExtractedFilters {
  dateStart?: string;
  dateEnd?: string;
  isFree?: boolean | null;
  isAccessible?: boolean | null;
  themes?: string[];
  categories?: string[];
  keywords?: string[];
}

/**
 * Post-process filters to convert relative date phrases to actual dates
 * This is a fallback if Cohere doesn't convert them
 */
function enhanceDateFilters(filters: ExtractedFilters, query: string): ExtractedFilters {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const queryLower = query.toLowerCase();
  
  // Only enhance if dates are not already set
  if (filters.dateStart || filters.dateEnd) {
    return filters; // Already has dates
  }
  
  // Check for relative date phrases in query
  const enhancedFilters = { ...filters };
  
  // "this weekend" or "weekend" (if it's before Saturday, use this weekend; otherwise next weekend)
  if (queryLower.includes('weekend') && !queryLower.includes('next weekend')) {
    const daysToSaturday = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysToSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    
    enhancedFilters.dateStart = saturday.toISOString().split('T')[0];
    enhancedFilters.dateEnd = sunday.toISOString().split('T')[0];
    
    // Remove "weekend" from keywords if it's there
    if (enhancedFilters.keywords) {
      enhancedFilters.keywords = enhancedFilters.keywords.filter(
        k => !k.toLowerCase().includes('weekend')
      );
    }
    
    console.log('[AI Search] Enhanced: converted "weekend" to dates', {
      dateStart: enhancedFilters.dateStart,
      dateEnd: enhancedFilters.dateEnd,
    });
  }
  
  // "tomorrow"
  else if (queryLower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    enhancedFilters.dateStart = tomorrow.toISOString().split('T')[0];
    enhancedFilters.dateEnd = tomorrow.toISOString().split('T')[0];
    
    if (enhancedFilters.keywords) {
      enhancedFilters.keywords = enhancedFilters.keywords.filter(
        k => k.toLowerCase() !== 'tomorrow'
      );
    }
    
    console.log('[AI Search] Enhanced: converted "tomorrow" to date', {
      dateStart: enhancedFilters.dateStart,
    });
  }
  
  // "today"
  else if (queryLower.includes('today')) {
    enhancedFilters.dateStart = today;
    enhancedFilters.dateEnd = today;
    
    if (enhancedFilters.keywords) {
      enhancedFilters.keywords = enhancedFilters.keywords.filter(
        k => k.toLowerCase() !== 'today'
      );
    }
    
    console.log('[AI Search] Enhanced: converted "today" to date', {
      dateStart: enhancedFilters.dateStart,
    });
  }
  
  // "next week"
  else if (queryLower.includes('next week')) {
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(now.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
    
    enhancedFilters.dateStart = nextWeekStart.toISOString().split('T')[0];
    enhancedFilters.dateEnd = nextWeekEnd.toISOString().split('T')[0];
    
    if (enhancedFilters.keywords) {
      enhancedFilters.keywords = enhancedFilters.keywords.filter(
        k => !k.toLowerCase().includes('next week')
      );
    }
    
    console.log('[AI Search] Enhanced: converted "next week" to dates', {
      dateStart: enhancedFilters.dateStart,
      dateEnd: enhancedFilters.dateEnd,
    });
  }
  
  return enhancedFilters;
}

// Test endpoint to verify route is accessible
export async function GET() {
  console.log('[AI Search] GET request received - route is accessible');
  process.stdout.write('[AI Search] GET request received\n');
  return NextResponse.json({ 
    message: 'AI Search API is working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  // Multiple logging methods to ensure we see something
  console.log('[AI Search] ====== POST REQUEST RECEIVED ======');
  console.log('[AI Search] Request received at', new Date().toISOString());
  console.log('[AI Search] Request URL:', request.url);
  console.log('[AI Search] Request method:', request.method);
  console.log('[AI Search] Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Use stderr which always shows in Next.js
  console.error('[AI Search] POST REQUEST RECEIVED - CHECK TERMINAL');
  process.stdout.write(`[AI Search] POST request received at ${new Date().toISOString()}\n`);
  
  try {
    // Check server-side rate limit first
    console.log('[AI Search] Checking rate limit...');
    const rateLimitResult = checkRateLimit(request);
    console.log('[AI Search] Rate limit check result:', {
      allowed: rateLimitResult.allowed,
      remaining: rateLimitResult.remaining,
      resetAt: new Date(rateLimitResult.resetAt).toISOString(),
    });
    
    if (!rateLimitResult.allowed) {
      console.warn('[AI Search] Rate limit exceeded:', {
        retryAfter: rateLimitResult.retryAfter,
        resetAt: new Date(rateLimitResult.resetAt).toISOString(),
      });
      const headers = getRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded the rate limit of ${process.env.AI_SEARCH_RATE_LIMIT || '4'} requests per ${Math.floor(parseInt(process.env.AI_SEARCH_RATE_LIMIT_WINDOW_MS || '120000', 10) / 1000 / 60)} minutes. Please try again later.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    console.log('[AI Search] Parsing request body...');
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('[AI Search] Request body parsed successfully:', {
        hasQuery: !!requestBody.query,
        queryLength: requestBody.query?.length || 0,
        hasThemes: Array.isArray(requestBody.availableThemes),
        hasCategories: Array.isArray(requestBody.availableCategories),
        hasChatContext: Array.isArray(requestBody.chatContext),
        chatContextLength: Array.isArray(requestBody.chatContext) ? requestBody.chatContext.length : 0,
      });
    } catch (parseError) {
      console.error('[AI Search] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { query, availableThemes, availableCategories, chatContext } = requestBody;
    
    // Validate and truncate chat context to max 5 messages
    const MAX_CONTEXT_MESSAGES = 5;
    let validChatContext: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (Array.isArray(chatContext)) {
      validChatContext = chatContext
        .filter((msg: any) => 
          msg && 
          typeof msg === 'object' && 
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.content === 'string'
        )
        .slice(-MAX_CONTEXT_MESSAGES) // Truncate to last 5 messages
        .map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content as string,
        }));
    }
    
    console.log('[AI Search] Chat context:', {
      received: Array.isArray(chatContext) ? chatContext.length : 0,
      valid: validChatContext.length,
    });

    if (!query || typeof query !== 'string') {
      console.error('[AI Search] Invalid query:', { query, type: typeof query });
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('[AI Search] Query received:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));

    console.log('[AI Search] Initializing Cohere client...');
    const cohere = getCohereClient();
    if (!cohere) {
      console.error('[AI Search] COHERE_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Cohere API key not configured' },
        { status: 500 }
      );
    }
    console.log('[AI Search] Cohere client initialized successfully');

    // Get current date info for relative date calculations
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const themesEnum = Array.isArray(availableThemes) && availableThemes.length > 0 ? [...new Set(availableThemes)].sort() : [];
    const categoriesEnum = Array.isArray(availableCategories) && availableCategories.length > 0 ? [...new Set(availableCategories)].sort() : [];
    const themesList = themesEnum.length > 0 ? themesEnum.join(', ') : 'None';
    const categoriesList = categoriesEnum.length > 0 ? categoriesEnum.join(', ') : 'None';

    // Tool: filter_events — only apply filters when the query implies them. Category/theme must be from the API lists only.
    const tools: Cohere.Tool[] = [
      {
        name: 'filter_events',
        description: 'ALWAYS use this tool when the user asks about finding events in Toronto. Extract search filters from their query. Only include date/category/theme/free/accessible when the user clearly asks for them. Current date: ' + today + '. Available themes (use only these exact strings or omit): ' + themesList + '. Available categories (use only these exact strings or omit): ' + categoriesList + '.',
        parameterDefinitions: {
          dateStart: {
            description: 'Start date in ISO format YYYY-MM-DD. Convert relative dates like today, tomorrow, this weekend, next week to actual dates. Only include if the user mentions a specific date or time period.',
            type: 'str',
            required: false,
          },
          dateEnd: {
            description: 'End date in ISO format YYYY-MM-DD. Use same as dateStart for single-day events.',
            type: 'str',
            required: false,
          },
          isFree: {
            description: 'True for free events only, false for paid only, omit for no preference. Preserve from context unless changed.',
            type: 'bool',
            required: false,
          },
          isAccessible: {
            description: 'True for accessible events only, false otherwise, omit for no preference. Preserve from context unless changed.',
            type: 'bool',
            required: false,
          },
          themes: {
            description: 'Comma-separated or JSON array of theme names. Use ONLY from: ' + themesList + '. Omit if no theme filter.',
            type: 'str',
            required: false,
          },
          categories: {
            description: 'Comma-separated or JSON array of category names. Use ONLY from: ' + categoriesList + '. Omit if no category filter.',
            type: 'str',
            required: false,
          },
          keywords: {
            description: 'Comma-separated or JSON array of keywords for text search. Only use if date cannot be converted to ISO format.',
            type: 'str',
            required: false,
          },
        },
      },
    ];

    // Build chat history for Cohere (role: USER | CHATBOT, message: string)
    const chatHistory: Array<{ role: 'USER' | 'CHATBOT'; message: string }> = [];
    for (const msg of validChatContext) {
      chatHistory.push({
        role: msg.role === 'user' ? 'USER' : 'CHATBOT',
        message: msg.content,
      });
    }

    // Build system message and current query
    const systemMessage = `You are a helpful assistant that ONLY answers questions about events in Toronto. 
If the user asks about anything other than events (like general questions, math, weather, etc.), politely redirect them to ask about events.
For ALL event-related queries, you MUST use the filter_events tool to extract search filters. Only respond directly with text if the user asks something completely unrelated to events.`;

    console.log('[AI Search] Calling Cohere API with tool calling...');
    const cohereStartTime = Date.now();
    let response;
    let filters: ExtractedFilters = {};
    let conversationalResponse = '';

    try {
      // Step 1: Call API with tools (optional tool calling)
      // Using chatHistory for multi-turn and system_prompt for system message
      response = await cohere.chat({
        model: 'command-a-03-2025',
        message: query,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
        preamble: systemMessage,
        tools,
        temperature: 0.3,
        maxTokens: 300,
      });
      
      const cohereDuration = Date.now() - cohereStartTime;
      console.log('[AI Search] Cohere API call completed in', cohereDuration, 'ms');

      // NonStreamedChatResponse: text, toolCalls (array of { name, parameters })
      // When the model calls a tool, it may also return "plan" text (e.g. "I will use the filter_events tool...").
      // We must NOT return that as the response — only return text when there was no tool call (direct answer).
      const responseAny = response as { text?: string; toolCalls?: Array<{ name: string; parameters?: Record<string, unknown> }> };
      const toolCalls = responseAny.toolCalls;

      if (toolCalls && toolCalls.length > 0) {
        console.log('[AI Search] Tool was called:', toolCalls.length, 'call(s)');
        
        const toolCall = toolCalls[0];
        const functionName = toolCall.name;
        const toolArgsRaw = toolCall.parameters;
        
        if (functionName === 'filter_events' && toolArgsRaw) {
          try {
            const toolArgs = typeof toolArgsRaw === 'object' && toolArgsRaw !== null ? toolArgsRaw as Record<string, unknown> : {};
            const parseStringOrArray = (v: unknown): string[] | undefined => {
              if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
              if (typeof v === 'string') {
                try {
                  const parsed = JSON.parse(v);
                  return Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === 'string') : v.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
                } catch {
                  return v.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
                }
              }
              return undefined;
            };
            filters = {
              dateStart: typeof toolArgs.dateStart === 'string' ? toolArgs.dateStart : undefined,
              dateEnd: typeof toolArgs.dateEnd === 'string' ? toolArgs.dateEnd : undefined,
              isFree: toolArgs.isFree === true || toolArgs.isFree === false ? toolArgs.isFree : null,
              isAccessible: toolArgs.isAccessible === true || toolArgs.isAccessible === false ? toolArgs.isAccessible : null,
              themes: parseStringOrArray(toolArgs.themes),
              categories: parseStringOrArray(toolArgs.categories),
              keywords: parseStringOrArray(toolArgs.keywords),
            };
            console.log('[AI Search] Extracted filters from tool call:', filters);
          } catch (parseError) {
            console.error('[AI Search] Failed to parse tool arguments:', parseError);
            filters = { keywords: query.split(/\s+/).filter(w => w.length > 2) };
          }
        }
      } else {
        // No tool call - model responded directly (e.g. non-event question or redirect)
        console.log('[AI Search] No tool call - model responded directly');
        if (responseAny.text) {
          const rawText = String(responseAny.text).trim();
          // Ignore "tool plan" text (model explaining it would call the tool) so we don't show it as the reply
          const isToolPlan = /I will use the|I'll use the|filter_events|extract_event_filters|I will search|I'll search/i.test(rawText);
          
          // Validate text quality - check for corruption patterns (repeating text, date format spam, etc.)
          const isCorrupted = 
            rawText.length > 500 || // Too long
            /(.)\1{10,}/.test(rawText) || // Repeating characters
            /DD-DD-DD/.test(rawText) || // Date format spam
            /I'm looking for.*I'm looking for.*I'm looking for/.test(rawText) || // Repeating phrases
            rawText.split(' ').length > 200; // Too many words
            
          if (!isToolPlan && !isCorrupted) {
            conversationalResponse = rawText;
          } else if (isCorrupted) {
            console.warn('[AI Search] Detected corrupted response text, ignoring:', rawText.substring(0, 100));
            // Fall back to keyword extraction for event queries
            const isEventQuery = /event|show|concert|festival|exhibition|workshop|class|meeting|gathering|activity/i.test(query);
            if (isEventQuery) {
              filters = { keywords: query.split(/\s+/).filter(w => w.length > 2) };
            }
          }
        }
        
        // If no filters set yet, use keyword extraction
        if (!filters.dateStart && !filters.dateEnd && !filters.categories && !filters.themes && !filters.keywords) {
          filters = { keywords: query.split(/\s+/).filter(w => w.length > 2) };
        }
      }

      // Step 2: Generate conversational response with event results
      // This will be done on the frontend after filtering events
      // For now, we'll return the filters and let frontend generate the response
      // OR we can generate it here if we have event results passed in

    } catch (apiError) {
      const cohereDuration = Date.now() - cohereStartTime;
      console.error('[AI Search] Cohere API call failed after', cohereDuration, 'ms:', apiError);
      if (apiError instanceof Error) {
        console.error('[AI Search] API Error message:', apiError.message);
        console.error('[AI Search] API Error stack:', apiError.stack);
      }
      // Return fallback filters
      filters = { keywords: query.split(/\s+/).filter(w => w.length > 2) };
    }

    // Post-process to enhance date filters from relative phrases
    console.log('[AI Search] Before enhancement:', JSON.stringify(filters));
    filters = enhanceDateFilters(filters, query);
    console.log('[AI Search] After enhancement:', JSON.stringify(filters));

    // Validate and clean the filters — only allow categories/themes that exist in the API
    let validatedFilters: ExtractedFilters = {
      dateStart: filters.dateStart && typeof filters.dateStart === 'string' ? filters.dateStart : undefined,
      dateEnd: filters.dateEnd && typeof filters.dateEnd === 'string' ? filters.dateEnd : undefined,
      isFree: filters.isFree === true || filters.isFree === false ? filters.isFree : null,
      isAccessible: filters.isAccessible === true || filters.isAccessible === false ? filters.isAccessible : null,
      themes: Array.isArray(filters.themes)
        ? filters.themes.filter((t): t is string => typeof t === 'string' && themesEnum.includes(t))
        : undefined,
      categories: Array.isArray(filters.categories)
        ? filters.categories.filter((c): c is string => typeof c === 'string' && categoriesEnum.includes(c))
        : undefined,
      keywords: Array.isArray(filters.keywords) ? filters.keywords.filter(k => typeof k === 'string' && k.length > 0) : undefined,
    };

    // If no filters extracted, use keywords from the query
    if (!validatedFilters.dateStart && !validatedFilters.dateEnd && 
        validatedFilters.isFree === null && validatedFilters.isAccessible === null &&
        (!validatedFilters.themes || validatedFilters.themes.length === 0) &&
        (!validatedFilters.categories || validatedFilters.categories.length === 0) &&
        (!validatedFilters.keywords || validatedFilters.keywords.length === 0)) {
      validatedFilters.keywords = query.split(/\s+/).filter(w => w.length > 2);
    }

    // Include rate limit headers in successful response
    const headers = getRateLimitHeaders(rateLimitResult);
    const totalDuration = Date.now() - startTime;
    console.log('[AI Search] Request completed successfully in', totalDuration, 'ms');
    console.log('[AI Search] Returning validated filters:', {
      hasDateStart: !!validatedFilters.dateStart,
      hasDateEnd: !!validatedFilters.dateEnd,
      isFree: validatedFilters.isFree,
      isAccessible: validatedFilters.isAccessible,
      themesCount: validatedFilters.themes?.length || 0,
      categoriesCount: validatedFilters.categories?.length || 0,
      keywordsCount: validatedFilters.keywords?.length || 0,
      hasConversationalResponse: !!conversationalResponse,
    });
    
    return NextResponse.json(
      { 
        filters: validatedFilters,
        response: conversationalResponse || undefined, // Include if model responded directly
      },
      { headers }
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('[AI Search] Unhandled error after', totalDuration, 'ms:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[AI Search] Error message:', error.message);
      console.error('[AI Search] Error stack:', error.stack);
      console.error('[AI Search] Error name:', error.name);
    } else {
      console.error('[AI Search] Non-Error object:', JSON.stringify(error, null, 2));
    }
    return NextResponse.json(
      { 
        error: 'Failed to process AI search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
