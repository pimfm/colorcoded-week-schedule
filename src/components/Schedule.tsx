import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
} from '@mui/material';
import { Pillar, Activity, WeekSchedule, Week } from '../types';
import { ChevronLeft, ChevronRight, PictureAsPdf, Edit, Delete as DeleteIcon, GitHub } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Legend } from './Legend';
import { getContrastColor } from '../utils/colors';

interface ScheduleProps {
  pillars: Pillar[];
  weeks: Week[];
  currentWeekIndex: number;
  onWeekChange: (index: number) => void;
  onScheduleChange: (weekId: string, schedule: WeekSchedule) => void;
  onUpdateWeekDate: (weekId: string, newDate: string) => void;
}

export const Schedule: React.FC<ScheduleProps> = ({
  pillars,
  weeks = [],
  currentWeekIndex = 0,
  onWeekChange,
  onScheduleChange,
  onUpdateWeekDate,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    hour: string;
  } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [endTime, setEndTime] = useState<string>('');
  const [isEditDateDialogOpen, setIsEditDateDialogOpen] = useState(false);
  const [editingWeekDate, setEditingWeekDate] = useState('');
  const [detailsCell, setDetailsCell] = useState<{
    day: string;
    hour: string;
    activity: Activity;
  } | null>(null);
  const [showCellText, setShowCellText] = useState(() => {
    // Load preference from localStorage, default to true if not set
    const savedPreference = localStorage.getItem('showActivityNames');
    return savedPreference !== null ? savedPreference === 'true' : true;
  });
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('showActivityNames', showCellText.toString());
  }, [showCellText]);

  // Ensure we have valid weeks data
  if (!weeks || weeks.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="error">
          No weeks available. Please add a week to get started.
        </Typography>
      </Box>
    );
  }

  const currentWeek = weeks[currentWeekIndex];
  if (!currentWeek) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="error">
          Invalid week selected. Please try again.
        </Typography>
      </Box>
    );
  }

  const handleCellClick = (day: string, hour: string) => {
    // Check if the cell already has an activity
    const existingActivity = getActivityForCell(day, hour);
    
    if (existingActivity) {
      // If the cell has an activity, show the details dialog
      setDetailsCell({ day, hour, activity: existingActivity });
    } else {
      // If the cell is empty, open the activity selection dialog
      setSelectedCell({ day, hour });
      
      // Set default end time to 1 hour after the selected time
      const hourNum = parseInt(hour);
      const nextHour = (hourNum + 1) % 24;
      const defaultEndTime = `${nextHour.toString().padStart(2, '0')}:00`;
      setEndTime(defaultEndTime);
    }
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    
    // Save immediately when an activity is selected
    if (selectedCell) {
      const startHour = parseInt(selectedCell.hour);
      const endHour = endTime ? parseInt(endTime.split(':')[0]) : startHour + 1;
      
      // Create a new schedule object
      const newSchedule = { ...currentWeek.schedule };
      
      // Initialize the day if it doesn't exist
      if (!newSchedule[selectedCell.day]) {
        newSchedule[selectedCell.day] = {};
      }
      
      // Determine if we need to span to the next day
      const spansToNextDay = endHour <= startHour;
      
      // Get the next day
      const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(selectedCell.day);
      const nextDayIndex = (dayIndex + 1) % 7;
      const nextDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][nextDayIndex];
      
      // Initialize the next day if it doesn't exist
      if (spansToNextDay && !newSchedule[nextDay]) {
        newSchedule[nextDay] = {};
      }
      
      // Fill the time slots
      if (spansToNextDay) {
        // Fill from start hour to end of day
        for (let hour = startHour; hour < 24; hour++) {
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          
          // Only fill if the cell is empty
          if (!newSchedule[selectedCell.day][hourStr]?.activityId) {
            newSchedule[selectedCell.day][hourStr] = {
              activityId: activity.id,
              endTime: null,
            };
          }
        }
        
        // Fill from start of next day to end hour
        for (let hour = 0; hour < endHour; hour++) {
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          
          // Only fill if the cell is empty
          if (!newSchedule[nextDay][hourStr]?.activityId) {
            newSchedule[nextDay][hourStr] = {
              activityId: activity.id,
              endTime: hour === endHour - 1 ? endTime : null,
            };
          }
        }
      } else {
        // Normal case - fill within the same day
        for (let hour = startHour; hour < endHour; hour++) {
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          
          // Only fill if the cell is empty
          if (!newSchedule[selectedCell.day][hourStr]?.activityId) {
            newSchedule[selectedCell.day][hourStr] = {
              activityId: activity.id,
              endTime: hour === endHour - 1 ? endTime : null,
            };
          }
        }
      }

      onScheduleChange(currentWeek.id, newSchedule);
      setSelectedCell(null);
      setSelectedActivity(null);
      setEndTime('');
    }
  };

  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value);
  };

  const handleDeleteActivity = () => {
    if (!detailsCell) return;
    
    const { day, hour } = detailsCell;
    
    // Create a new schedule object
    const newSchedule = { ...currentWeek.schedule };
    
    // Initialize the day if it doesn't exist
    if (!newSchedule[day]) {
      newSchedule[day] = {};
    }
    
    // Remove the activity from this time slot
    newSchedule[day][hour] = {
      activityId: null,
      endTime: null,
    };
    
    // Also check if this was part of a block and remove the end time from the last cell
    const nextHour = (parseInt(hour) + 1) % 24;
    const nextHourStr = `${nextHour.toString().padStart(2, '0')}:00`;
    
    if (newSchedule[day][nextHourStr]?.endTime === hour) {
      // This was the last cell of a block, remove the end time reference
      newSchedule[day][nextHourStr] = {
        activityId: newSchedule[day][nextHourStr].activityId,
        endTime: null,
      };
    }
    
    onScheduleChange(currentWeek.id, newSchedule);
    setDetailsCell(null);
  };

  const handleEditDateClick = () => {
    const date = new Date(currentWeek.startDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setEditingWeekDate(`${year}-${month}-${day}`);
    setIsEditDateDialogOpen(true);
  };

  const handleUpdateDate = () => {
    if (editingWeekDate) {
      onUpdateWeekDate(currentWeek.id, editingWeekDate);
      setIsEditDateDialogOpen(false);
    }
  };

  const handleExportPDF = async () => {
    if (!scheduleRef.current) return;

    try {
      // Create a clone of the schedule element
      const clone = scheduleRef.current.cloneNode(true) as HTMLElement;
      
      // Remove sticky positioning and scrolling constraints for PDF export
      const tableContainer = clone.querySelector('.MuiTableContainer-root') as HTMLElement;
      if (tableContainer) {
        tableContainer.style.maxHeight = 'none';
        tableContainer.style.overflow = 'visible';
      }
      
      // Remove sticky positioning from cells
      const stickyCells = clone.querySelectorAll('[style*="position: sticky"]');
      stickyCells.forEach(cell => {
        (cell as HTMLElement).style.position = 'static';
        (cell as HTMLElement).style.zIndex = 'auto';
      });
      
      // Set fixed width for better quality
      clone.style.width = '1200px';
      clone.style.position = 'absolute';
      clone.style.left = '0';
      clone.style.top = '0';
      document.body.appendChild(clone);

      // Create PDF with landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1200, 800] // Fixed size to match the clone width
      });

      // Get the full height of the schedule
      const fullHeight = clone.offsetHeight;
      const pageHeight = 800; // Height of one PDF page
      const totalPages = Math.ceil(fullHeight / pageHeight);

      // For each page
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Create a canvas for this page
        const canvas = await html2canvas(clone, {
          scale: 2, // Higher scale for better quality
          width: 1200,
          height: Math.min(pageHeight, fullHeight - (i * pageHeight)),
          windowWidth: 1200,
          windowHeight: Math.min(pageHeight, fullHeight - (i * pageHeight)),
          x: 0,
          y: i * pageHeight,
          scrollY: -i * pageHeight,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Add the canvas to the PDF
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, 1200, Math.min(pageHeight, fullHeight - (i * pageHeight)));
      }

      // Clean up
      document.body.removeChild(clone);

      // Save the PDF
      pdf.save(`schedule-week-${currentWeekIndex + 1}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActivityForCell = (day: string, hour: string) => {
    const timeSlot = currentWeek.schedule[day]?.[hour];
    if (!timeSlot?.activityId) return null;

    for (const pillar of pillars) {
      const activity = pillar.activities.find(a => a.id === timeSlot.activityId);
      if (activity) return activity;
    }
    return null;
  };

  const handleToggleCellText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCellText(event.target.checked);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => onWeekChange(currentWeekIndex - 1)} disabled={currentWeekIndex === 0}>
            <ChevronLeft />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Week {currentWeekIndex + 1} ({formatDate(currentWeek.startDate)})
            </Typography>
            <Tooltip title="Edit Week Start Date">
              <IconButton onClick={handleEditDateClick} size="small">
                <Edit />
              </IconButton>
            </Tooltip>
          </Box>
          <IconButton onClick={() => onWeekChange(currentWeekIndex + 1)} disabled={currentWeekIndex === weeks.length - 1}>
            <ChevronRight />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={showCellText} 
                onChange={handleToggleCellText} 
                color="primary" 
              />
            }
            label="Show Activity Names"
          />
          <Tooltip title="Export as PDF">
            <IconButton onClick={handleExportPDF}>
              <PictureAsPdf />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Legend pillars={pillars} />

      <div ref={scheduleRef}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: '70vh',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    borderRight: '1px solid rgba(224, 224, 224, 1)',
                    backgroundColor: 'background.paper',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2
                  }}
                >
                  Time
                </TableCell>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <TableCell 
                    key={day} 
                    sx={{ 
                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                      backgroundColor: 'background.paper',
                      '&:last-child': {
                        borderRight: 'none'
                      }
                    }}
                  >
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((hour) => (
                <TableRow key={hour}>
                  <TableCell 
                    sx={{ 
                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'background.paper',
                      zIndex: 1
                    }}
                  >
                    {hour}
                  </TableCell>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const activity = getActivityForCell(day, hour);
                    return (
                      <TableCell
                        key={`${day}-${hour}`}
                        onClick={() => handleCellClick(day, hour)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: activity?.color || 'inherit',
                          color: activity ? getContrastColor(activity.color) : 'inherit',
                          borderRight: '1px solid rgba(224, 224, 224, 1)',
                          '&:last-child': {
                            borderRight: 'none'
                          },
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        {showCellText && activity?.name || ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Activity Selection Dialog */}
      <Dialog open={!!selectedCell} onClose={() => setSelectedCell(null)}>
        <DialogTitle>Select Activity</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="End Time"
              type="time"
              value={endTime}
              onChange={handleEndTimeChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 3600 }}
              fullWidth
            />
            
            {pillars.map((pillar) => (
              <Box key={pillar.id}>
                <Typography variant="subtitle1" gutterBottom>
                  {pillar.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {pillar.activities.map((activity) => (
                    <Button
                      key={activity.id}
                      variant={selectedActivity?.id === activity.id ? 'contained' : 'outlined'}
                      onClick={() => handleActivitySelect(activity)}
                      sx={{
                        backgroundColor: activity.color,
                        color: getContrastColor(activity.color),
                        '&:hover': {
                          backgroundColor: activity.color,
                          opacity: 0.8,
                        },
                      }}
                    >
                      {activity.name}
                    </Button>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCell(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Activity Details Dialog */}
      <Dialog open={!!detailsCell} onClose={() => setDetailsCell(null)}>
        <DialogTitle>Activity Details</DialogTitle>
        <DialogContent>
          {detailsCell && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: detailsCell.activity.color 
                  }} 
                />
                <Typography variant="h6">{detailsCell.activity.name}</Typography>
              </Box>
              <Typography>
                <strong>Day:</strong> {detailsCell.day}
              </Typography>
              <Typography>
                <strong>Time:</strong> {detailsCell.hour}
              </Typography>
              <Typography>
                <strong>Pillar:</strong> {pillars.find(p => p.activities.some(a => a.id === detailsCell.activity.id))?.name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteActivity} 
            color="error" 
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
          <Button onClick={() => setDetailsCell(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Date Dialog */}
      <Dialog open={isEditDateDialogOpen} onClose={() => setIsEditDateDialogOpen(false)}>
        <DialogTitle>Edit Week Start Date</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Week Start Date"
            type="date"
            fullWidth
            value={editingWeekDate}
            onChange={(e) => setEditingWeekDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateDate} variant="contained">Update Date</Button>
        </DialogActions>
      </Dialog>

      {/* Footer with GitHub link */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          mt: 4, 
          mb: 2,
          py: 2,
          borderTop: '1px solid #eaeaea'
        }}
      >
        <Link 
          href="https://github.com/pimfm/colorcoded-week-schedule" 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            textDecoration: 'none',
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            }
          }}
        >
          <GitHub fontSize="small" />
          <Typography variant="body2">
            View on GitHub
          </Typography>
        </Link>
      </Box>
    </Box>
  );
}; 