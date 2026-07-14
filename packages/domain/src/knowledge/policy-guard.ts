const RULES: { flag: string; pattern: RegExp }[] = [
  { flag: "medical_diagnosis", pattern: /\b(diagnos|you have|anda menderita|pasti (sakit|cedera))\b/i },
  { flag: "healing_promise", pattern: /\b(pasti sembuh|guaranteed cure|dijamin sembuh)\b/i },
  { flag: "refund_promise", pattern: /\b(pasti .*refund|refund penuh|guaranteed refund)\b/i },
  { flag: "unapproved_discount", pattern: /\b(diskon khusus|special discount|potongan .*%)\b/i },
  { flag: "reschedule_confirmation", pattern: /\b(sudah saya reschedule|reschedule confirmed|jadwal (sudah )?diubah)\b/i },
];

const SAFE_FALLBACK =
  "Maaf, belum ada informasi yang cukup di knowledge base untuk menjawab ini. Silakan tambahkan dokumen terkait atau eskalasi ke tim.";

export function evaluateKnowledgeAnswer(input: {
  answer: string;
  hasSources: boolean;
}): { answer: string; policyFlags: string[] } {
  if (!input.hasSources) {
    return { answer: SAFE_FALLBACK, policyFlags: ["no_sources"] };
  }
  const policyFlags = RULES.filter((r) => r.pattern.test(input.answer)).map((r) => r.flag);
  if (policyFlags.length > 0) {
    return {
      answer:
        "Jawaban ditahan karena melanggar kebijakan (tidak boleh mendiagnosis, menjanjikan refund/kesembuhan, atau mengonfirmasi reschedule). Silakan tinjau manual.",
      policyFlags,
    };
  }
  return { answer: input.answer, policyFlags };
}
