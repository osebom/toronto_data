import { Event } from '@/types';
import { fetchTorontoEvents } from './fetch-events';
import { getCachedEvents, setCachedEvents } from './indexeddb';
import { parseEvents } from './parse-events';
import { sampleApiEvents } from './sample-events';

const INITIAL_LOAD_COUNT = 20;

/**
 * Loads events progressively:
 * 1. Try to load from IndexedDB first (instant)
 * 2. Show first 20 events immediately
 * 3. Fetch fresh data in background
 * 4. Update when complete
 */
export async function loadEventsProgressive(
  onProgress: (events: Event[], loaded: number, total: number, isComplete: boolean) => void,
  signal?: AbortSignal
): Promise<void> {
  // Step 1: Try to load from IndexedDB first
  const cachedEvents = await getCachedEvents();
  
  if (cachedEvents && Array.isArray(cachedEvents) && cachedEvents.length > 0) {
    // Cached events are already Event objects
    const parsedCached = cachedEvents as Event[];
    
    if (parsedCached.length > 0) {
      // Show first 20 immediately
      const initialBatch = parsedCached.slice(0, INITIAL_LOAD_COUNT);
      onProgress(initialBatch, initialBatch.length, parsedCached.length, false);
      
      // Then show all cached events after a brief delay
      setTimeout(() => {
        if (!signal?.aborted) {
          onProgress(parsedCached, parsedCached.length, parsedCached.length, false);
        }
      }, 100);
    }
  } else {
    // No cache, show sample events as fallback
    const sampleEvents = parseEvents(sampleApiEvents);
    const initialBatch = sampleEvents.slice(0, INITIAL_LOAD_COUNT);
    onProgress(initialBatch, initialBatch.length, 0, false);
  }
  
  // Step 2: Fetch fresh data in background
  try {
    const freshEvents = await fetchTorontoEvents(signal);
    
    if (signal?.aborted) {
      return;
    }
    
    // Show first 20 fresh events immediately
    const initialFreshBatch = freshEvents.slice(0, INITIAL_LOAD_COUNT);
    onProgress(initialFreshBatch, initialFreshBatch.length, freshEvents.length, false);
    
    // Then progressively show more events
    const batchSize = 20;
    let currentIndex = INITIAL_LOAD_COUNT;
    
    while (currentIndex < freshEvents.length && !signal?.aborted) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for smooth animation
      
      const nextBatch = freshEvents.slice(0, Math.min(currentIndex + batchSize, freshEvents.length));
      onProgress(nextBatch, nextBatch.length, freshEvents.length, false);
      
      currentIndex += batchSize;
    }
    
    // Final update with all events
    if (!signal?.aborted) {
      await setCachedEvents(freshEvents);
      onProgress(freshEvents, freshEvents.length, freshEvents.length, true);
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    
    console.error('Failed to fetch fresh events:', error);
    
    // If we have cached events, keep showing them
    if (cachedEvents && Array.isArray(cachedEvents) && cachedEvents.length > 0) {
      const parsedCached = cachedEvents as Event[];
      if (parsedCached.length > 0) {
        onProgress(parsedCached, parsedCached.length, parsedCached.length, true);
      }
    }
  }
}

