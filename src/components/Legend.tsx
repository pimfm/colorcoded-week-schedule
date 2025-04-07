import React, { useRef } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
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

    try {
      // Create a clone of the legend element for PDF generation
      const clone = legendRef.current.cloneNode(true) as HTMLElement;
      
      // Remove the PDF export button from the clone
      const exportButton = clone.querySelector('button');
      if (exportButton) {
        exportButton.remove();
      }

      // Force the clone to display pillars in a single column for PDF
      const pillarsContainer = clone.querySelector('[data-legend-pillars]');
      if (pillarsContainer) {
        (pillarsContainer as HTMLElement).style.display = 'flex';
        (pillarsContainer as HTMLElement).style.flexDirection = 'column';
        (pillarsContainer as HTMLElement).style.width = '100%';
      }

      const pillarBoxes = clone.querySelectorAll('[data-legend-pillar]');
      pillarBoxes.forEach((box) => {
        (box as HTMLElement).style.width = '100%';
      });
      
      // Set a fixed width for better scaling
      clone.style.width = '600px';
      clone.style.position = 'absolute';
      clone.style.left = '0';
      clone.style.top = '0';
      document.body.appendChild(clone);
      
      // Create PDF with portrait orientation
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Create a canvas for the entire content
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Add padding to the PDF (20mm on each side)
      const padding = 20;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pdfWidth - (padding * 2);
      const contentHeight = Math.min(
        (canvas.height * contentWidth) / canvas.width,
        pdfHeight - (padding * 2)
      );
      
      // Add the canvas to the PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(
        imgData, 
        'JPEG', 
        padding, 
        padding, 
        contentWidth, 
        contentHeight
      );
      
      // Clean up
      document.body.removeChild(clone);
      
      // Save the PDF
      pdf.save('legend.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
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
        <Box 
          data-legend-pillars
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2 
          }}
        >
          {pillars.map((pillar) => (
            <Box 
              key={pillar.id} 
              data-legend-pillar
              sx={{ 
                width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(25% - 16px)' }, 
                mb: 2 
              }}
            >
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
          ))}
        </Box>
      </div>
    </Paper>
  );
}; 