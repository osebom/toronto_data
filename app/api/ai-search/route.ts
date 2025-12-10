import { NextResponse } from 'next/server';
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '',
});

export interface ExtractedFilters {
  dateStart?: string;
  dateEnd?: string;
  isFree?: boolean | null;
  isAccessible?: boolean | null;
  themes?: string[];
  categories?: string[];
  keywords?: string[];
}

export async function POST(request: Request) {
  try {
    const { query, availableThemes, availableCategories } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!process.env.COHERE_API_KEY) {
      console.error('COHERE_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Cohere API key not configured' },
        { status: 500 }
      );
    }

    // Build the prompt for Cohere
    const themesList = Array.isArray(availableThemes) ? availableThemes.join(', ') : '';
    const categoriesList = Array.isArray(availableCategories) ? availableCategories.join(', ') : '';

    const prompt = `Extract event search filters from this user query: "${query}"

Available themes: ${themesList || 'None'}
Available categories: ${categoriesList || 'None'}

Extract the following information:
- Date range (dateStart and dateEnd in ISO format YYYY-MM-DD, or null if not specified)
- Free events preference (isFree: true/false/null)
- Accessibility preference (isAccessible: true/false/null)
- Matching themes from the available list (themes: array of strings)
- Matching categories from the available list (categories: array of strings)
- Keywords for text search (keywords: array of strings)

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
    try {
      response = await cohere.chat({
        model: 'command-a-03-2025',
        message: prompt,
        maxTokens: 300,
        temperature: 0.3,
      });
    } catch (apiError) {
      console.error('Cohere API call failed:', apiError);
      if (apiError instanceof Error) {
        console.error('API Error message:', apiError.message);
        console.error('API Error stack:', apiError.stack);
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
    let generatedText = '{}';
    if (response) {
      try {
        // Try response.text first (most common)
        if ('text' in response && response.text) {
          generatedText = String(response.text).trim();
        }
        // Try response.message?.text (some API versions)
        else if ((response as any).message?.text) {
          generatedText = String((response as any).message.text).trim();
        }
        // Try response.message if it's a string
        else if (typeof (response as any).message === 'string') {
          generatedText = (response as any).message.trim();
        }
        // Try accessing the first message in an array
        else if (Array.isArray((response as any).messages) && (response as any).messages[0]?.text) {
          generatedText = String((response as any).messages[0].text).trim();
        }
        // Try response.generations (legacy format)
        else if (Array.isArray((response as any).generations) && (response as any).generations[0]?.text) {
          generatedText = String((response as any).generations[0].text).trim();
        }
      } catch (accessError) {
        console.error('Error accessing response properties:', accessError);
      }
    }
    
    if (!generatedText || generatedText === '{}') {
      console.error('Could not extract text from Cohere response. Full response:', response);
      // Fallback to keywords
      return NextResponse.json({
        filters: {
          keywords: query.split(/\s+/).filter(w => w.length > 2),
        }
      });
    }
    
    // Try to extract JSON from the response
    let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1];
      }
    }

    const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
    let filters: ExtractedFilters;

    try {
      filters = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Cohere response:', jsonText);
      // Return empty filters if parsing fails
      filters = {
        keywords: query.split(/\s+/).filter(w => w.length > 2),
      };
    }

    // Validate and clean the filters
    const validatedFilters: ExtractedFilters = {
      dateStart: filters.dateStart && typeof filters.dateStart === 'string' ? filters.dateStart : undefined,
      dateEnd: filters.dateEnd && typeof filters.dateEnd === 'string' ? filters.dateEnd : undefined,
      isFree: filters.isFree === true || filters.isFree === false ? filters.isFree : null,
      isAccessible: filters.isAccessible === true || filters.isAccessible === false ? filters.isAccessible : null,
      themes: Array.isArray(filters.themes) ? filters.themes.filter(t => typeof t === 'string') : undefined,
      categories: Array.isArray(filters.categories) ? filters.categories.filter(c => typeof c === 'string') : undefined,
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

    return NextResponse.json({ filters: validatedFilters });
  } catch (error) {
    console.error('AI search error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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
