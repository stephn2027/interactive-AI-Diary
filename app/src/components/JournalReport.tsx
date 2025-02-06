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
import NotosansJP from '../assets/fonts/NotoSansJP-VariableFont_wght.ttf';
import NotosansKR from '../assets/fonts/NotoSansKR-VariableFont_wght.ttf';
import NotoSansZH from '../assets/fonts/NotoSansSC-VariableFont_wght.ttf';
import { LanguageKey } from '../util/types';
// Define the props interface
interface JournalReportProps {
  journalData: string;
  language?: LanguageKey;
}

// Register NotoSans font
Font.register({
  family: 'NotoSans',
  src: NotoSans,
});
Font.register({
  family: 'NotoSansJP',
  src: NotosansJP,
});

Font.register({
  family: 'NotoSansKR',
  src: NotosansKR,
});
Font.register({
  family: 'NotoSansZH',
  src: NotoSansZH,
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#f2f2f2',
    fontFamily: 'NotoSans',

  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#ffffff', 
    borderRadius: 8, // Rounded corners for a modern look
  },
  heading: {
    fontSize: 20, // Increased font size for headings
    marginBottom: 12, // More spacing below headings
    color: '#333333', // Darker color for better contrast
    fontWeight: 'semibold', // Semi-bold for emphasis
    
  },
  text: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 5,
    
  },
  highlightedText: {
    fontSize: 12,
    color: '#238dbe',
    fontWeight: 'bold',
   
  },
  listItem: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 10,
    flexDirection: 'row',
  },
  listItemKey: {
    fontWeight: 'bold',
    color: '#238dbe',
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
      return 'NotoSansJP';
    case 'ko':
      return 'NotoSansKR';
    case 'zh':
      return 'NotoSansZH';
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
  language,
}) => {
  

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
  const fontFamily = getFontFamily(language ?? 'en');
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