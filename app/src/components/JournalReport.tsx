import React from 'react';
import {
  Document,
  Page,
  Text,
  StyleSheet,
  Font,
  View,
} from '@react-pdf/renderer';

// Import your fonts
import NotoSans from '../assets/fonts/NotoSans-VariableFont_wdth,wght.ttf';


// Define the props for the component
interface JournalReportProps {
  journalData: string;
  language: LanguageKey;
}

type LanguageKey = 'en' | 'it' | 'fr' | 'ja' | 'ko' | 'zh';

// Register fonts

Font.register({
  family: 'NotoSans',
  src: NotoSans,
});

// Helper to get font family based on language
const getFontFamily = (language: LanguageKey): string => {
  switch (language) {
    case 'ja':
      return 'NotoSansCJKjp';
    case 'ko':
      return 'NotoSansCJKkr';
    case 'zh':
      return 'NotoSansCJKsc'; // or 'NotoSansTC' for Traditional Chinese
    case 'en':
    case 'it':
    case 'fr':
    default:
      return 'NotoSans';
  }
};

// Define styles for PDF
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
    marginBottom: 5,
  },
  listItemKey: {
    fontWeight: 'bold',
  },
});

const JournalReport: React.FC<JournalReportProps> = ({
  journalData,
  language = 'en',
}) => {
  const fontFamily = getFontFamily(language);
  const sections = journalData.split('\n\n').map((section) => section.trim());

  // Helper function to render highlighted text
  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    // Use a regular expression to split the text by asterisks, retaining the asterisks
    const regex = /(\*[^*]+\*)/g;
    const parts = text.split(regex);
    console.log('Parts after splitting in JournalReport:', parts); // Debugging statement

    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const content = part.slice(1, -1).trim(); // Remove asterisks and trim spaces
        console.log(`Highlighting part ${index} in JournalReport: "${content}"`); // Debugging statement
        return (
          <Text
            key={index}
            style={
              language === 'ja' || language === 'ko' || language === 'zh'
                ? styles.highlightedText
                : styles.highlightedText
            }
          >
            {content}
          </Text>
        );
      } else {
        return <Text key={index} style={styles.text}>{part}</Text>;
      }
    });
  };

  // Helper function to render explanations in key-value format
  const renderExplanations = (explanationsText: string) => {
    if (!explanationsText) return null;
    const explanations = explanationsText
      .split(/\d+\.\s*/) // Split based on numbering like "1. ", "2. ", etc.
      .filter((item) => item.trim() !== '');
    return explanations.map((explanation, idx) => {
      const match = explanation.match(/\*([^*]+)\*:\s*(.+)/s); // Match *text*: explanation
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        return (
          <View key={idx} style={{ marginBottom: 5 }}>
            <Text style={styles.listItem}>
              <Text style={styles.listItemKey}>{key}:</Text> {value}
            </Text>
          </View>
        );
      } else {
        return (
          <View key={idx} style={{ marginBottom: 5 }}>
            <Text style={styles.listItem}>{explanation}</Text>
          </View>
        );
      }
    });
  };

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, fontFamily }}>
        {sections.map((section, index) => {
          if (!section.includes(':')) {
            console.warn(`Skipping section ${index} as it does not contain a colon: "${section}"`);
            return null; // Skip sections without colon
          }
          if (section.startsWith('First Draft:')) {
            const content = section.replace('First Draft:', '').trim();
            console.log(`Rendering First Draft in PDF: "${content}"`);
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.heading}>First Draft</Text>
                <Text style={styles.text}>{content}</Text>
              </View>
            );
          } else if (section.startsWith('Revised Draft')) {
            // Handles both 'Revised Draft:' and 'Revised Draft with highlighted improvements:'
            const content = section.split(':').slice(1).join(':').trim();
            console.log(`Rendering Revised Draft in PDF: "${content}"`);
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.heading}>Revised Draft</Text>
                {renderHighlightedText(content)}
              </View>
            );
          } else if (section.startsWith('Explanations for Improvements:')) {
            const explanationsText = section.replace('Explanations for Improvements:', '').trim();
            console.log(`Rendering Explanations for Improvements in PDF: "${explanationsText}"`);
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.heading}>Explanations for Improvements</Text>
                {renderExplanations(explanationsText)}
              </View>
            );
          } else {
            // Handle any other sections if present
            console.warn(`Rendering generic section ${index} in PDF: "${section}"`);
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.text}>{section}</Text>
              </View>
            );
          }
        })}
      </Page>
    </Document>
  );
};

export default JournalReport