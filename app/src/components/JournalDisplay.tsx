import { Paper, Typography, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import React, { useMemo } from 'react';

interface JournalDisplayProps {
  journalData: string;
}

interface ExplanationMap {
  [key: string]: string;
}

const sampleJournalData = `
First Draft:
"I go to store buy laptop. Staff show two laptops. I choose big one. It very nice."

Revised Draft with highlighted improvements:
"*I went* to the store *to buy* a laptop. *The staff showed me* two laptops, and *I chose* the big one."

Explanations for Improvements:
1. *I went*: The verb "went" is used instead of "go," making the sentence past tense, which is grammatically correct. This change makes the timing of the action clear and consistent.
2. *to buy*: Adding "to buy" clarifies the purpose of the visit to the store, which makes the sentence more informative and specific.
3. *The staff showed me*: Adding "the" before "staff" and "showed me" clarifies who is performing the action and indicates interaction with the narrator, making the sentence clearer and more descriptive.
4. *I chose*: Changing "choose" to "chose" corrects the verb tense to past tense, matching the rest of the narrative.
`;

export default function JournalDisplay({ journalData }: JournalDisplayProps) {
  // Use sample data if journalData is not provided
  const dataToParse = journalData || sampleJournalData;
  console.log('JOURNAL DATA:', journalData);

  // Helper function to normalize strings
  const normalizeString = (str: string) =>
    str.trim().toLowerCase().replace(/[.,!?]/g, '');

  // Function to split the journalData into sections
  const parseSections = (text: string) => {
    const sections: { [key: string]: string } = {};
    const sectionRegex =
      /^\s*(First Draft:|Revised Draft with highlighted improvements:|Explanations for Improvements:)\s*([\s\S]*?)(?=^\s*(First Draft:|Revised Draft with highlighted improvements:|Explanations for Improvements:|$))/gmi;
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
      const sectionTitle = match[1].trim();
      const sectionContent = match[2].trim();
      sections[sectionTitle] = sectionContent;
      console.log(`Parsed Section - Title: "${sectionTitle}", Content: "${sectionContent}"`);
    }
    return sections;
  };

  const sections = useMemo(() => parseSections(dataToParse), [dataToParse]);
  console.log('Sections after parsing:', sections);

  // Parse explanations into a map for easy lookup
  const explanationMap: ExplanationMap = useMemo(() => {
    const explanationsText = sections['Explanations for Improvements:'] || '';
    console.log('Explanations Text:', explanationsText);
    const map: ExplanationMap = {};

    // Split explanations based on numbering (e.g., "1. ", "2. ")
    const explanationItems = explanationsText.split(/\d+\.\s*/).filter(item => item.trim() !== '');
    console.log('Explanation Items:', explanationItems);

    explanationItems.forEach(item => {
      // Match the pattern: *word*: explanation
      const match = item.match(/\*([^*]+)\*:\s*(.+)/s); // 's' flag for multiline support
      if (match) {
        const rawWord = match[1].trim();
        const word = normalizeString(rawWord);
        const explanation = match[2].trim();
        if (word && explanation) {
          map[word] = explanation;
          console.log(`Added to Explanation Map - Word: "${word}", Explanation: "${explanation}"`);
        }
      } else {
        console.warn(`Failed to parse explanation item: "${item}"`);
      }
    });
    console.log('Final Explanations Map:', map);
    return map;
  }, [sections]);

  const renderHighlightedText = (text: string) => {
    const regex = /\*([^*]+)\*/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      const precedingText = text.substring(lastIndex, start);
      const highlightedText = match[1];
      // Add preceding normal text
      if (precedingText) {
        elements.push(<span key={key++}>{precedingText}</span>);
      }
      // Normalize the highlighted word/phrase
      const keyWord = normalizeString(highlightedText);
      const explanation = explanationMap[keyWord] || 'No explanation provided';
      console.log(`Highlighted Word: "${highlightedText}", Explanation: "${explanation}"`);
      // Add Tooltip-wrapped highlighted text
      elements.push(
        <Tooltip
          title={explanation}
          key={key++}
          placement="top"
          arrow
          enterDelay={300}
        >
          <Typography
            component="span"
            sx={{
              backgroundColor: '#ffff00',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            aria-label={`Explanation: ${explanation}`}
          >
            {highlightedText}
          </Typography>
        </Tooltip>
      );
      lastIndex = end;
    }
    // Add any remaining normal text after the last highlight
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      elements.push(<span key={key++}>{remainingText}</span>);
    }
    return elements;
  };

  const getSectionText = (section: string): string => {
    return sections[section] || '';
  };

  return (
    <Box
      sx={{
        mt: 4,
        p: 2,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Draft Comparison
      </Typography>
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0f0f0' }}>
        <Typography variant="subtitle1" gutterBottom>
          Compare the drafts below:
        </Typography>
        {/* First Draft Section */}
        <Typography variant="body1" gutterBottom>
          <strong>First Draft:</strong>
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {renderHighlightedText(getSectionText('First Draft:'))}
        </Typography>
        {/* Revised Draft Section */}
        <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
          <strong>Revised Draft with highlighted improvements:</strong>
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {renderHighlightedText(
            getSectionText('Revised Draft with highlighted improvements:')
          )}
        </Typography>
        {/* Explanations Section */}
        <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
          <strong>Explanations for Improvements:</strong>
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {sections['Explanations for Improvements:']}
        </Typography>
      </Paper>
    </Box>
  );
}