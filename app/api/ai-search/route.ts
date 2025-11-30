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

    const response = await cohere.generate({
      model: 'command',
      prompt,
      maxTokens: 300,
      temperature: 0.3,
    });

    const generatedText = response.generations[0]?.text?.trim() || '{}';
    
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
    return NextResponse.json(
      { error: 'Failed to process AI search' },
      { status: 500 }
    );
  }
}
