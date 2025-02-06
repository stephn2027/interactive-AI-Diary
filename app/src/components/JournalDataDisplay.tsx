import React, { useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { pdf } from '@react-pdf/renderer';
import JournalReport from './JournalReport'; // Ensure this component is correctly implemented
import HighlightableTextWithPopover from './MobilePopover';
import { LanguageKey } from '../util/types';

// Define language key type
 // Add more language codes as needed

// Define the props for the component
interface JournalDataDisplayProps {
  journalData: string;
  language?: LanguageKey;
}


// Define constants for section headers
const SECTION_HEADERS = {
  FIRST_DRAFT: 'First Draft:',
  REVISED_DRAFT: 'Revised Draft with highlighted improvements:',
  EXPLANATIONS: 'Explanations for Improvements:',
} as const;

interface ParsedSection {
  header: string | null;
  content: string;
}

const JournalDataDisplay: React.FC<JournalDataDisplayProps> = ({
  journalData,
  language = 'en',
}) => {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const [isHovered, setIsHovered] = useState(false);

  // const handleTouchStart = (event: TouchEvent<HTMLSpanElement>) => {
  //   setIsHovered(true);
  //   event.preventDefault();
  // };
  // const handleTouchEnd = (event: TouchEvent<HTMLSpanElement>) => {
  //   setIsHovered(false);
  // };
  // PDF Generation Function
  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await pdf(
        <JournalReport journalData={journalData} language={language} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const date = new Date();
      const dateTimeForFileName = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date
        .getHours()
        .toString()
        .padStart(2, '0')}-${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `Journal_Report_${dateTimeForFileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setLoading(false);
    }
  };

  // Split the journalData into sections based on double newlines and trim each section
  const sections = journalData.split('\n\n').map((section) => section.trim());

  // Function to parse sections into header-content pairs
  const parseSections = (sections: string[]): ParsedSection[] => {
    const parsedSections: ParsedSection[] = [];
    let i = 0;

    while (i < sections.length) {
      const section = sections[i];
      let matchedHeader: keyof typeof SECTION_HEADERS | null = null;

      // Iterate over the keys of SECTION_HEADERS in a type-safe manner
      const headerKeys = Object.keys(SECTION_HEADERS) as Array<
        keyof typeof SECTION_HEADERS
      >;

      // Determine if the current section starts with any of the defined headers
      for (const headerKey of headerKeys) {
        if (section.startsWith(SECTION_HEADERS[headerKey])) {
          matchedHeader = headerKey;
          break;
        }
      }

      if (matchedHeader) {
        // Extract header name without colon
        const headerName =
          matchedHeader === 'REVISED_DRAFT'
            ? 'Revised Draft'
            : matchedHeader === 'FIRST_DRAFT'
            ? 'First Draft'
            : 'Explanations for Improvements';

        // Extract content from the current section
        let content = section
          .replace(SECTION_HEADERS[matchedHeader], '')
          .trim();

        // If content is empty, assume it's in the next section
        if (!content) {
          if (i + 1 < sections.length) {
            content = sections[i + 1];
            console.log(
              `Extracted content for "${headerName}" from section ${
                i + 1
              }: ${content}`
            );
            i++; // Skip next section as it's been consumed
          } else {
            console.warn(`No content found for header "${headerName}".`);
            content = '';
          }
        }

        parsedSections.push({ header: headerName, content });
      } else {
        // If the section doesn't start with any known header, treat it as generic content
        parsedSections.push({ header: null, content: section });
      }

      i++;
    }

    return parsedSections;
  };

  const parsedSections = parseSections(sections);

  const explanationsMap = useMemo(() => {
    const explanationsSection = parsedSections.find(
      (section) => section.header === 'Explanations for Improvements'
    );
    if (!explanationsSection) {
      return {};
    }
    const explanations: { [key: string]: string } = {};
    explanationsSection.content.split('\n').forEach((line) => {
      const match = line.match(/^\d+\.\s*\*(.+?)\*:\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        explanations[key] = value;
      }
    });
    return explanations;
  }, [parsedSections]);
  
  // Helper function to render text with highlighted parts
  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    // Use a regular expression to split the text by asterisks, retaining the asterisks
    const regex = /(\*[^*]+\*)/g;
    const parts = text.split(regex);

    // Render each part, highlighting the ones surrounded by asterisks

    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const content = part.slice(1, -1).trim(); // Remove asterisks and trim spaces
        if(isMobile){
          return (
            <HighlightableTextWithPopover
              key={index}
              text={content}
              detailText={explanationsMap[content]||'No explanation available'}
            />
          );
        }else{
        return (
          <Tooltip
            key={index}
            title={explanationsMap[content] || 'No explanation available'}
            arrow
            placement="top"
            PopperProps={{
              modifiers: [
                {
                  name: 'flip',
                  options: {
                    fallbackPlacements: ['top', 'bottom', 'left', 'right'],
                  },
                },
                {
                  name: 'preventOverflow',
                  options: {
                    boundary: 'none', // Ensure the tooltip stays within the viewport
                  },
                },
              ],
            }}

            slotProps={{
              tooltip: {
                sx: {
                  fontSize: '.9rem', // Increase font size
                  padding: '1rem', 
                 maxWidth: '25rem', // Increase padding and width
                },
              },
              arrow: {
                sx: {
                  fontSize: '1rem',   // Increase arrow size
                },
              },
            }}
          >
            <Typography
              component="span"
              key={index}
              // onTouchStart={handleTouchStart}
              // onTouchEnd={handleTouchEnd}
              sx={{
                color: 'primary.main',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-block',
                transition: 'transform 0.3s ease',
                borderRadius: 2,
                padding: '0.1rem 0.3rem',
                '&:hover': {
                  textDecoration: 'underline',
                  transform: 'scale(1.05)',
                  '@media (hover: none)': {
                    '&:active': {
                      textDecoration: 'underline',
                      transform: 'scale(1.05)',
                    },
                  },
                },
                // ...(isHovered && {
                //   textDecoration: 'underline',
                //   transform: 'scale(1.05)',
                // }),
              }}
            >
              {content}
            </Typography>
          </Tooltip>
        );
      }
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  // Helper function to render explanations in key-value format
  const renderExplanations = (explanationsText: string) => {
    if (!explanationsText) return null;

    const explanations = explanationsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    return (
      <List
        sx={{
          listStyleType: 'decimal',
          pl: 4,
        }}
      >
        {explanations.map((explanation, idx) => {
          // Match patterns like "1. *text*: explanation"
          const match = explanation.match(/^\d+\.\s*\*(.+?)\*:\s*(.+)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            return (
              <ListItem
                key={idx}
                sx={{ display: 'list-item', pl: 0, listStyle: 'none' }}
                disableGutters
                component="li"
              >
                <ListItemText
                  primary={
                    <>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 'bold', mr: 0.5 }}
                      >
                        {key}:
                      </Typography>
                      {value}
                    </>
                  }
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            );
          } else {
            // Fallback for unexpected formats
            return (
              <ListItem
                key={idx}
                sx={{ display: 'list-item', pl: 0, listStyle: 'none' }}
                disableGutters
                component="li"
              >
                <ListItemText
                  primary={explanation}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            );
          }
        })}
      </List>
    );
  };

  return (
    <Paper
      elevation={3}
      sx={{
        padding: 3,
        borderRadius: 2,
        backgroundColor: '#f9f9f9',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {parsedSections.map((section, index) => {
        if (section.header === 'First Draft') {
          const content = section.content.replace(/^"|"$/g, ''); // Remove surrounding quotes
          console.log(`Rendering First Draft: "${content}"`);
          return (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                First Draft
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontStyle: 'italic',
                  paddingInline: 6,
                }}
              >
                {content}
              </Typography>
            </Box>
          );
        } else if (section.header === 'Revised Draft') {
          const content = section.content.replace(/^"|"$/g, ''); // Remove surrounding quotes
          console.log(`Rendering Revised Draft: "${content}"`);
          return (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revised Draft
              </Typography>
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', paddingInline: 6 }}
              >
                {renderHighlightedText(content)}
                {/* {content} */}
              </Typography>
            </Box>
          );
        } else if (section.header === 'Explanations for Improvements') {
          const explanationsText = section.content;
          console.log(
            `Rendering Explanations for Improvements: "${explanationsText}"`
          );
          // return (
          //   <Box key={index} sx={{ mb: 3 }}>
          //     <Typography variant="h6" gutterBottom>
          //       Explanations for Improvements
          //     </Typography>
          //     {renderExplanations(explanationsText)}
          //   </Box>
          // );
        } else {
          // Handle any other sections if present
          return (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {section.content}
              </Typography>
            </Box>
          );
        }
      })}
      <Button
        variant="contained"
        color={loading ? 'secondary' : 'primary'}
        disabled={loading}
        onClick={handleDownload}
        startIcon={<DownloadIcon />}
        sx={{ marginTop: '1rem' }}
      >
        {loading ? 'Generating PDF...' : 'Download PDF Report'}
      </Button>
    </Paper>
  );
};

export default JournalDataDisplay;
