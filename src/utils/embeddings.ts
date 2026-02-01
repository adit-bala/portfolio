/**
 * Browser-side embeddings using Transformers.js
 * Uses the same model as knowledge-base: all-MiniLM-L6-v2 (384 dimensions)
 */

import { pipeline } from '@huggingface/transformers';

// Singleton for the embedding pipeline
// Using 'any' to avoid complex union types that TypeScript can't represent
let embeddingPipeline: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Get or initialize the embedding pipeline.
 * Uses lazy loading and caches the pipeline for reuse.
 */
export async function getEmbeddingPipeline(): Promise<any> {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as Promise<any>;
  embeddingPipeline = await loadingPromise;
  loadingPromise = null;

  return embeddingPipeline;
}

/**
 * Generate an embedding for the given text.
 * Returns a 384-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embedder = await getEmbeddingPipeline();

  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Use tolist() to convert Tensor to nested array, then flatten
  // Output shape is [1, 384] for single input
  const list = output.tolist() as number[][];
  return list[0];
}

