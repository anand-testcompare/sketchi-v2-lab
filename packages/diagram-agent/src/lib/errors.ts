import { Data } from "effect";

/**
 * Typed failure modes for one diagram attempt. Adapters never need to
 * string-match: malformed args and structurally broken diagrams arrive as
 * distinct tagged errors that map cleanly onto transport-safe JSON.
 */

/** Raw tool args failed the Zod boundary decode. */
export class DiagramToolInputError extends Data.TaggedError(
  "DiagramToolInputError",
)<{
  readonly issues: ReadonlyArray<string>;
}> {}

/**
 * Decoded args produced an IR the core contract refused, e.g. an edge whose
 * target node does not exist. `nodeIds` carries the cleaned ids so adapters
 * can hand the model a concrete repair hint.
 */
export class DiagramStructureError extends Data.TaggedError(
  "DiagramStructureError",
)<{
  readonly reason: string;
  readonly nodeIds: ReadonlyArray<string>;
}> {}

export type DiagramAttemptError = DiagramToolInputError | DiagramStructureError;
