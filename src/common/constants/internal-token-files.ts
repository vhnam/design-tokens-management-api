/** Reserved `token_files` rows bootstrapped for token APIs; hidden from projects CRUD. */
export const INTERNAL_TOKEN_FILE_NAMES = [
  '__primitive_tokens__',
  '__semantic_tokens__',
  '__component_tokens__',
] as const;

export function isReservedInternalTokenFileName(name: string): boolean {
  return (INTERNAL_TOKEN_FILE_NAMES as readonly string[]).includes(name);
}
