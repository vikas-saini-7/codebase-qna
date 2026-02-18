// TypeScript module declaration for @xenova/transformers
declare module "@xenova/transformers" {
  // Minimal type for the feature-extraction pipeline
  export type FeatureExtractionOptions = {
    pooling: string;
    normalize: boolean;
  };
  export type FeatureExtractionResult =
    | { data: number[]; dims: number[] }
    | Float32Array
    | number[][]
    | number[];
  export type FeatureExtractionPipeline = (
    text: string,
    options: FeatureExtractionOptions,
  ) => Promise<FeatureExtractionResult>;

  export function pipeline(
    task: "feature-extraction",
    model: string,
  ): Promise<FeatureExtractionPipeline>;
}
