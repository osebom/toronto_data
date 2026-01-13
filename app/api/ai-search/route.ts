import { NextResponse } from 'next/server';
import { CohereClient } from 'cohere-ai';
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
      });
    } catch (parseError) {
      console.error('[AI Search] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { query, availableThemes, availableCategories } = requestBody;

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

    // Build the prompt for Cohere
    const themesList = Array.isArray(availableThemes) ? availableThemes.join(', ') : '';
    const categoriesList = Array.isArray(availableCategories) ? availableCategories.join(', ') : '';

    console.log('[AI Search] Building prompt...', {
      themesCount: Array.isArray(availableThemes) ? availableThemes.length : 0,
      categoriesCount: Array.isArray(availableCategories) ? availableCategories.length : 0,
    });

    // Get current date info for relative date calculations
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSaturday = (6 - dayOfWeek + 7) % 7;
    const thisSaturday = new Date(now);
    thisSaturday.setDate(now.getDate() + daysToSaturday);
    const thisSunday = new Date(thisSaturday);
    thisSunday.setDate(thisSaturday.getDate() + 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const prompt = `Extract event search filters from this user query: "${query}"

IMPORTANT: Convert relative date phrases to actual ISO dates (YYYY-MM-DD format).
Current date: ${today}
- "today" = ${today}
- "tomorrow" = ${tomorrow.toISOString().split('T')[0]}
- "this weekend" = ${thisSaturday.toISOString().split('T')[0]} to ${thisSunday.toISOString().split('T')[0]}
- "next weekend" = ${new Date(thisSaturday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${new Date(thisSunday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- "next week" = ${nextWeek.toISOString().split('T')[0]} onwards

Available themes: ${themesList || 'None'}
Available categories: ${categoriesList || 'None'}

Extract the following information:
- Date range: Convert relative dates (today, tomorrow, this weekend, next week, etc.) to actual ISO dates (YYYY-MM-DD). Set dateStart and dateEnd to the actual dates, or null if no date mentioned.
- Free events preference (isFree: true/false/null)
- Accessibility preference (isAccessible: true/false/null)
- Matching themes from the available list (themes: array of strings)
- Matching categories from the available list (categories: array of strings)
- Keywords for text search (keywords: array of strings) - only use if date cannot be converted

CRITICAL: If the query mentions a time period like "this weekend", "tomorrow", "next week", you MUST convert it to actual dates in dateStart and dateEnd. Do NOT put time phrases in keywords if they can be converted to dates.

Return ONLY a valid JSON object with this structure:
{
  "dateStart": "YYYY-MM-DD" or null,
  "dateEnd": "YYYY-MM-DD" or null,
  "isFree": true/false/null,
  "isAccessible": true/false/null,
  "themes": ["theme1", "theme2"] or [],
  "categories": ["category1", "category2"] or [],
  "keywords": ["keyword1", "keyword2"] or []
}

JSON:`;

    let response;
    console.log('[AI Search] Calling Cohere API...');
    const cohereStartTime = Date.now();
    try {
      response = await cohere.chat({
        model: 'command-a-03-2025',
        message: prompt,
        maxTokens: 300,
        temperature: 0.3,
      });
      const cohereDuration = Date.now() - cohereStartTime;
      console.log('[AI Search] Cohere API call completed in', cohereDuration, 'ms');
    } catch (apiError) {
      const cohereDuration = Date.now() - cohereStartTime;
      console.error('[AI Search] Cohere API call failed after', cohereDuration, 'ms:', apiError);
      if (apiError instanceof Error) {
        console.error('[AI Search] API Error message:', apiError.message);
        console.error('[AI Search] API Error stack:', apiError.stack);
        console.error('[AI Search] API Error name:', apiError.name);
      }
      // Return a more helpful error
      return NextResponse.json(
        { 
          error: 'Cohere API call failed',
          details: apiError instanceof Error ? apiError.message : 'Unknown API error',
          // Fallback to keyword search
          filters: {
            keywords: query.split(/\s+/).filter(w => w.length > 2),
          }
        },
        { status: 500 }
      );
    }
    
    // Chat API v2 might return text in different places - try multiple options
    console.log('[AI Search] Extracting text from Cohere response...');
    let generatedText = '{}';
    if (response) {
      console.log('[AI Search] Response type:', typeof response);
      console.log('[AI Search] Response keys:', Object.keys(response || {}));
      try {
        // Try response.text first (most common)
        if ('text' in response && response.text) {
          generatedText = String(response.text).trim();
          console.log('[AI Search] Found text in response.text, length:', generatedText.length);
        }
        // Try response.message?.text (some API versions)
        else if ((response as any).message?.text) {
          generatedText = String((response as any).message.text).trim();
          console.log('[AI Search] Found text in response.message.text, length:', generatedText.length);
        }
        // Try response.message if it's a string
        else if (typeof (response as any).message === 'string') {
          generatedText = (response as any).message.trim();
          console.log('[AI Search] Found text in response.message (string), length:', generatedText.length);
        }
        // Try accessing the first message in an array
        else if (Array.isArray((response as any).messages) && (response as any).messages[0]?.text) {
          generatedText = String((response as any).messages[0].text).trim();
          console.log('[AI Search] Found text in response.messages[0].text, length:', generatedText.length);
        }
        // Try response.generations (legacy format)
        else if (Array.isArray((response as any).generations) && (response as any).generations[0]?.text) {
          generatedText = String((response as any).generations[0].text).trim();
          console.log('[AI Search] Found text in response.generations[0].text, length:', generatedText.length);
        } else {
          console.warn('[AI Search] Could not find text in any expected location. Response structure:', JSON.stringify(response, null, 2).substring(0, 500));
        }
      } catch (accessError) {
        console.error('[AI Search] Error accessing response properties:', accessError);
      }
    } else {
      console.error('[AI Search] Response is null or undefined');
    }
    
    if (!generatedText || generatedText === '{}') {
      console.error('[AI Search] Could not extract text from Cohere response. Generated text:', generatedText);
      console.error('[AI Search] Full response structure:', JSON.stringify(response, null, 2).substring(0, 1000));
      // Fallback to keywords
      console.log('[AI Search] Falling back to keyword search');
      return NextResponse.json({
        filters: {
          keywords: query.split(/\s+/).filter(w => w.length > 2),
        }
      });
    }
    
    console.log('[AI Search] Extracted text (first 200 chars):', generatedText.substring(0, 200));
    
    // Try to extract JSON from the response
    let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1];
      }
    }

    const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
    console.log('[AI Search] JSON text to parse (first 200 chars):', jsonText.substring(0, 200));
    
    let filters: ExtractedFilters;

    try {
      filters = JSON.parse(jsonText);
      console.log('[AI Search] Successfully parsed JSON filters:', {
        hasDateStart: !!filters.dateStart,
        hasDateEnd: !!filters.dateEnd,
        isFree: filters.isFree,
        isAccessible: filters.isAccessible,
        themesCount: filters.themes?.length || 0,
        categoriesCount: filters.categories?.length || 0,
        keywordsCount: filters.keywords?.length || 0,
      });
    } catch (parseError) {
      console.error('[AI Search] Failed to parse Cohere response as JSON:', parseError);
      console.error('[AI Search] JSON text that failed to parse:', jsonText);
      // Return empty filters if parsing fails
      filters = {
        keywords: query.split(/\s+/).filter(w => w.length > 2),
      };
      console.log('[AI Search] Using fallback keyword filters');
    }

    // Validate and clean the filters
    let validatedFilters: ExtractedFilters = {
      dateStart: filters.dateStart && typeof filters.dateStart === 'string' ? filters.dateStart : undefined,
      dateEnd: filters.dateEnd && typeof filters.dateEnd === 'string' ? filters.dateEnd : undefined,
      isFree: filters.isFree === true || filters.isFree === false ? filters.isFree : null,
      isAccessible: filters.isAccessible === true || filters.isAccessible === false ? filters.isAccessible : null,
      themes: Array.isArray(filters.themes) ? filters.themes.filter(t => typeof t === 'string') : undefined,
      categories: Array.isArray(filters.categories) ? filters.categories.filter(c => typeof c === 'string') : undefined,
      keywords: Array.isArray(filters.keywords) ? filters.keywords.filter(k => typeof k === 'string' && k.length > 0) : undefined,
    };
    
    // Post-process to enhance date filters from relative phrases
    console.log('[AI Search] Before enhancement:', JSON.stringify(validatedFilters));
    validatedFilters = enhanceDateFilters(validatedFilters, query);
    console.log('[AI Search] After enhancement:', JSON.stringify(validatedFilters));

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
    });
    
    return NextResponse.json(
      { filters: validatedFilters },
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
