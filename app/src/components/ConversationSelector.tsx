import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import React from 'react'

interface ConversationSelectorProps { 
    selectedConversationId: string;
    handleConversationChange: (event: SelectChangeEvent<string>) => void;
    conversations: { id: string; title: string }[];
}

export default function ConversationSelector({selectedConversationId,handleConversationChange,conversations}:ConversationSelectorProps) {
  return (
    <FormControl fullWidth>
          <InputLabel id="conversation-selector-label">
            Select Conversation
          </InputLabel>
          <Select
            labelId="conversation-selector-label"
            value={selectedConversationId}
            label="Select Conversation"
            onChange={handleConversationChange}
          >
            {conversations.map((conv) => (
              <MenuItem key={conv.id} value={conv.id}>
                {conv.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
  )
}
