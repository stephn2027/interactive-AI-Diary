export interface ParsedJournalDataProps {
  firstDraft: string;
  revisedDraft: string;
  explanations: { [key: string]: string };
}

export const parseJournalData = (journalData: string): ParsedJournalDataProps => {
  // Consolidated RegEx to capture firstDraft, revisedDraft, and explanations
  const regex = /First Draft:\s*"([\s\S]*?)"\s*Revised Draft(?: with highlighted improvements)?:\s*"([\s\S]*?)"\s*Explanations for Improvements:\s*([\s\S]*)/i;
  
  const match = journalData.match(regex);
  
  if (!match) {
    console.error('Failed to parse journal data');
    return {
      firstDraft: '',
      revisedDraft: '',
      explanations: {},
    };
  }

  const [_, firstDraft, revisedDraft, explanationsText] = match;
  
  const explanations: { [key: string]: string } = {};
  const explanationRegex = /^\d+\.\s*\*(.+?)\*:\s*(.+)$/gm;
  let excMatch;
  while ((excMatch = explanationRegex.exec(explanationsText)) !== null) {
    const key = excMatch[1].trim();
    const value = excMatch[2].trim();
    explanations[key] = value;
  }

  return {
    firstDraft: firstDraft.trim(),
    revisedDraft: revisedDraft.trim(),
    explanations,
  };
};