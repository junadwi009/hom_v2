// Transitional stub for Task 3 (schemas/types/barrel only).
// Real policy-guard logic lands in a later task.
export function evaluateKnowledgeAnswer(a: { answer: string }) {
  return { answer: a.answer, policyFlags: [] as string[] };
}
