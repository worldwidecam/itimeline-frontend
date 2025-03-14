import React, { useRef, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Clear as ClearIcon } from '@mui/icons-material';

const FileUpload = ({ onFileSelect, accept, maxSize }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    if (maxSize && file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', '/'));
        }
        return type === fileType;
      });

      if (!isAccepted) {
        setError('File type not supported');
        return;
      }
    }

    setSelectedFile(file);
    setError('');
    onFileSelect(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError('');
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {!selectedFile ? (
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            py: 2,
            textTransform: 'none'
          }}
        >
          Click to upload file
        </Button>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          <Typography noWrap sx={{ flex: 1 }}>
            {selectedFile.name}
          </Typography>
          <IconButton 
            size="small" 
            onClick={handleClearFile}
            sx={{ ml: 1 }}
          >
            <ClearIcon />
          </IconButton>
        </Box>
      )}

      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
