import React, { useRef } from 'react';
import { Box, Paper, Typography, Grid, IconButton, Tooltip } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { Pillar } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LegendProps {
  pillars: Pillar[];
}

export const Legend: React.FC<LegendProps> = ({ pillars }) => {
  const legendRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!legendRef.current) return;

    // Create a clone of the legend element for PDF generation
    const clone = legendRef.current.cloneNode(true) as HTMLElement;
    clone.style.width = '800px'; // Set a fixed width for better scaling
    document.body.appendChild(clone);
    
    try {
      const canvas = await html2canvas(clone, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: 800,
        height: clone.scrollHeight,
        windowWidth: 800,
        windowHeight: clone.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add padding to the PDF (20mm on each side)
      const padding = 20;
      const contentWidth = pdfWidth - (padding * 2);
      const contentHeight = (pdfHeight * contentWidth) / pdfWidth;
      
      pdf.addImage(
        imgData, 
        'PNG', 
        padding, 
        padding, 
        contentWidth, 
        contentHeight
      );
      
      pdf.save('legend.pdf');
    } finally {
      // Clean up the clone
      document.body.removeChild(clone);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Legend
        </Typography>
        <Tooltip title="Export Legend as PDF">
          <IconButton onClick={handleExportPDF} size="small">
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      </Box>
      <div ref={legendRef}>
        <Grid container spacing={2}>
          {pillars.map((pillar) => (
            <Grid item xs={12} sm={6} md={3} key={pillar.id}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {pillar.name}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {pillar.activities.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: activity.color,
                          borderRadius: '4px',
                        }}
                      />
                      <Typography variant="body2">{activity.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </div>
    </Paper>
  );
}; 