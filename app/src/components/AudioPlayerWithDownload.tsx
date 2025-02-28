
import { Box, Button } from '@mui/material';
import React, { useCallback } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import DownloadIcon from '@mui/icons-material/Download';
import 'react-h5-audio-player/lib/styles.css';

interface AudioPlayerWithDownloadProps {
    audioUrl: string;
    downloadFileName?: string;
}

export default function AudioPlayerWithDownload({
  audioUrl,
  downloadFileName,
}: AudioPlayerWithDownloadProps) {

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.setAttribute('download', downloadFileName || 'audio.mp3');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },[audioUrl, downloadFileName]);

  return (
    <Box sx={{ width: '90%' }}>
    <AudioPlayer
      src={audioUrl}
      customAdditionalControls={[
        <Button
          key="download"
          onClick={handleDownload}
          variant='contained'
          color='primary'
          startIcon={<DownloadIcon />}
          size='small'
        >
         Download
        </Button>,
      ]}
        showDownloadProgress={true}
    />
    </Box>
  );
}
