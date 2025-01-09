import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import React from 'react'

interface LanguageSelectorProps {
    selectedLanguage: string;
    handleLanguageChange: (event: SelectChangeEvent<string>) => void;
}

export default function LanguageSelector({selectedLanguage,handleLanguageChange}:LanguageSelectorProps) {
  return (
    <FormControl fullWidth>
          <InputLabel id="language-selector-label">Select Language</InputLabel>
          <Select
            labelId="language-selector-label"
            value={selectedLanguage}
            label="Select Language"
            onChange={handleLanguageChange}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ja">Japanese</MenuItem>
          </Select>
        </FormControl>
  )
}
