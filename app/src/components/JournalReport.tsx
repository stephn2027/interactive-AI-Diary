import React from 'react';
import {
  Document,
  Page,
  Text,
  StyleSheet,
  Font,
  View,
} from '@react-pdf/renderer';
import NotoSans from '../assets/fonts/NotoSans-VariableFont_wdth,wght.ttf';

// Define the props interface
interface JournalReportProps {
  journalData: string;
  language?: LanguageKey;
}

// Define supported languages
type LanguageKey = 'en' | 'it' | 'fr' | 'ja' | 'ko' | 'zh';

// Register NotoSans font
Font.register({
  family: 'NotoSans',
  src: NotoSans,
});

// Optionally, register other NotoSans CJK fonts if needed
// Font.register({
//   family: 'NotoSansCJKjp',
//   src: '/path/to/NotoSansCJKjp-Regular.otf',
// });
// Similarly register NotoSansCJKkr and NotoSansCJKsc for Korean and Chinese

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'NotoSans',
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333333',
    fontFamily: 'NotoSans',
  },
  text: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'NotoSans',
  },
  highlightedText: {
    fontSize: 12,
    color: '#00796B',
    fontWeight: 'bold',
    fontFamily: 'NotoSans',
  },
  listItem: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'NotoSans',
    marginBottom: 10,
    flexDirection: 'row',
  },
  listItemKey: {
    fontWeight: 'bold',
    color: '#00796B',
    width:'40%',
    flexWrap:'wrap',
  },
  listItemValue: {
    flex: 1,
    marginLeft: 5,
  },
});

// Helper function to determine font family based on language
const getFontFamily = (language: LanguageKey): string => {
  switch (language) {
    case 'ja':
      return 'NotoSansCJKjp';
    case 'ko':
      return 'NotoSansCJKkr';
    case 'zh':
      return 'NotoSansCJKsc';
    default:
      return 'NotoSans';
  }
};

// Helper function to render text with highlighted parts
const renderTextWithHighlights = (content: string) => {
  if (!content) return null;
  // Split the content by *...* to identify highlighted parts
  const parts = content.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      // Remove the asterisks and apply highlighted style
      const highlightedContent = part.slice(1, -1);
      return (
        <Text key={index} style={styles.highlightedText}>
          {highlightedContent}
        </Text>
      );
    }
    // Regular text
    return <Text key={index} style={styles.text}>{part}</Text>;
  });
};

// Main JournalReport component
const JournalReport: React.FC<JournalReportProps> = ({
  journalData,
  language = 'en',
}) => {
  const fontFamily = getFontFamily(language);

  // Function to extract sections using regex
  const extractSections = (data: string): Record<string, string> => {
    const sections: Record<string, string> = {};

    // Regex patterns for each section
    const firstDraftRegex = /First Draft:\s*"([^"]*)"/i;
    const revisedDraftRegex = /Revised Draft(?: with highlighted improvements)?:\s*"([^"]*)"/i;
    const explanationsRegex = /Explanations for Improvements:\s*([\s\S]*)/i;

    const firstDraftMatch = data.match(firstDraftRegex);
    const revisedDraftMatch = data.match(revisedDraftRegex);
    const explanationsMatch = data.match(explanationsRegex);

    if (firstDraftMatch) {
      sections['First Draft'] = firstDraftMatch[1].trim();
    }

    if (revisedDraftMatch) {
      sections['Revised Draft'] = revisedDraftMatch[1].trim();
    }

    if (explanationsMatch) {
      sections['Explanations for Improvements'] = explanationsMatch[1].trim();
    }

    return sections;
  };

  const sections = extractSections(journalData);

  // Function to parse explanations into an array of { key, explanation }
  const parseExplanations = (explanationsText: string): Array<{ key: string; explanation: string }> => {
    const explanations: Array<{ key: string; explanation: string }> = [];
    const explanationRegex = /\*([^*]+)\*:\s*([^*].+)/g;
    let match;

    while ((match = explanationRegex.exec(explanationsText)) !== null) {
      const key = match[1].trim();
      const explanation = match[2].trim();
      explanations.push({ key, explanation });
    }

    return explanations;
  };

  const explanations = sections['Explanations for Improvements']
    ? parseExplanations(sections['Explanations for Improvements'])
    : [];

  const currentDate = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, fontFamily }}>
      <View style={styles.section}>
          <Text style={styles.text}>Date: {currentDate}</Text>
        </View>
        {/* First Draft Section */}
        {sections['First Draft'] && (
          <View style={styles.section}>
            <Text style={styles.heading}>First Draft</Text>
            <Text style={styles.text}>{sections['First Draft']}</Text>
          </View>
        )}

        {/* Revised Draft Section */}
        {sections['Revised Draft'] && (
          <View style={styles.section}>
            <Text style={styles.heading}>Revised Draft</Text>
            {renderTextWithHighlights(sections['Revised Draft'])}
          </View>
        )}

        {/* Explanations for Improvements Section */}
        {explanations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Explanations for Improvements</Text>
            {explanations.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemKey}>• {item.key}:</Text>
                <Text style={styles.listItemValue}>{item.explanation}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default JournalReport;