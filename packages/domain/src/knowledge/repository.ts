// Transitional stub for Task 3 (schemas/types/barrel only).
// Real repository interface lands in Task 4.
export type KnowledgeRepository = {
  list: () => Promise<never>;
  getById: () => Promise<never>;
};
