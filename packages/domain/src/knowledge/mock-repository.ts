// Transitional stub for Task 3 (schemas/types/barrel only).
// Real mock repository lands in Task 4.
export const mockKnowledgeSources = [] as const;

export function createMockKnowledgeRepository() {
  return {
    async list() {
      throw new Error("stub");
    },
    async getById() {
      throw new Error("stub");
    },
  };
}
