/**
 * Browser-side embeddings and reranking using Transformers.js
 * - Embeddings: all-MiniLM-L6-v2 (384 dimensions)
 * - Reranker: jina-reranker-v2-base-multilingual (cross-encoder)
 */

import { pipeline, AutoTokenizer, AutoModel } from '@huggingface/transformers';

// Singleton for the embedding pipeline
// Using 'any' to avoid complex union types that TypeScript can't represent
let embeddingPipeline: any = null;
let embeddingLoadingPromise: Promise<any> | null = null;

// Singleton for the reranker model
let rerankerModel: any = null;
let rerankerTokenizer: any = null;
let rerankerLoadingPromise: Promise<void> | null = null;

/**
 * Get or initialize the embedding pipeline.
 * Uses lazy loading and caches the pipeline for reuse.
 */
export async function getEmbeddingPipeline(): Promise<any> {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (embeddingLoadingPromise) {
    return embeddingLoadingPromise;
  }

  embeddingLoadingPromise = pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
  ) as Promise<any>;
  embeddingPipeline = await embeddingLoadingPromise;
  embeddingLoadingPromise = null;

  return embeddingPipeline;
}

/**
 * Get or initialize the reranker model.
 * Uses lazy loading and caches the model for reuse.
 */
async function getReranker(): Promise<{ model: any; tokenizer: any }> {
  if (rerankerModel && rerankerTokenizer) {
    return { model: rerankerModel, tokenizer: rerankerTokenizer };
  }

  if (rerankerLoadingPromise) {
    await rerankerLoadingPromise;
    return { model: rerankerModel!, tokenizer: rerankerTokenizer! };
  }

  rerankerLoadingPromise = (async () => {
    const model_id = 'jinaai/jina-reranker-v2-base-multilingual';
    rerankerModel = await AutoModel.from_pretrained(model_id, {
      dtype: 'fp32',
    });
    rerankerTokenizer = await AutoTokenizer.from_pretrained(model_id);
  })();

  await rerankerLoadingPromise;
  rerankerLoadingPromise = null;

  return { model: rerankerModel!, tokenizer: rerankerTokenizer! };
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

/**
 * Preload both embedding and reranker models.
 * Call this on page load to avoid delays on first search.
 * Returns a promise that resolves when both models are loaded.
 */
export async function preloadModels(): Promise<void> {
  // Start loading both models in parallel
  const embeddingPromise = getEmbeddingPipeline();
  const rerankerPromise = getReranker();

  // Wait for both to complete
  await Promise.all([embeddingPromise, rerankerPromise]);
}

/**
 * Rerank documents using Jina Reranker v2 cross-encoder.
 * Takes a query and a list of documents, returns scores for each document.
 * Higher scores indicate higher relevance.
 *
 * @param query The search query
 * @param documents Array of document texts to rerank
 * @returns Array of scores (0-1 range after sigmoid), one per document
 */
export async function rerank(
  query: string,
  documents: string[],
): Promise<number[]> {
  const { model, tokenizer } = await getReranker();

  // Tokenize query-document pairs
  const inputs = tokenizer(new Array(documents.length).fill(query), {
    text_pair: documents,
    padding: true,
    truncation: true,
  });

  // Get model output
  const output = await model(inputs);

  // For XLMRobertaModel used as reranker, we need to access the logits
  // The model should have a classifier head that outputs logits
  const logits = output.logits || output;

  // Apply sigmoid to convert logits to scores (0-1 range)
  const scores = logits.sigmoid().tolist() as number[][];

  // Extract the score from each result (shape is [batch_size, 1])
  return scores.map(([score]) => score);
}
