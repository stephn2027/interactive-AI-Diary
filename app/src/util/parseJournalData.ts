export interface ParsedJournalDataProps {
    firstDraft: string;
    revisedDraft: string;
    explanations: { [key: string]: string };
  }
  
  export const parseJournalData = (journalData: string): ParsedJournalDataProps => {
    const firstDraftRegex = /First Draft:\s*"([^"]*)"/i;
    const revisedDraftRegex = /Revised Draft(?: with highlighted improvements)?:\s*"([^"]*)"/i;
    const explanationsRegex = /Explanations for Improvements:\s*([\s\S]*)/i;
  
    const firstDraftMatch = journalData.match(firstDraftRegex);
    const revisedDraftMatch = journalData.match(revisedDraftRegex);
    const explanationsMatch = journalData.match(explanationsRegex);
  
    const firstDraft = firstDraftMatch ? firstDraftMatch[1].trim() : '';
    const revisedDraft = revisedDraftMatch ? revisedDraftMatch[1].trim() : '';
    const explanationsText = explanationsMatch ? explanationsMatch[1].trim() : '';
  
    const explanations: { [key: string]: string } = {};
    const explanationRegex = /^\d+\.\s*\*(.+?)\*:\s*(.+)$/gm;
    let match;
    while ((match = explanationRegex.exec(explanationsText)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      explanations[key] = value;
    }
  
    return {
      firstDraft,
      revisedDraft,
      explanations,
    };
  };