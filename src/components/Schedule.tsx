import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import { Pillar, Activity, WeekSchedule, Week } from '../types';
import { ChevronLeft, ChevronRight, PictureAsPdf, Edit, Delete as DeleteIcon } from '@mui/icons-material';
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
  const scheduleRef = useRef<HTMLDivElement>(null);

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

  const schedule = currentWeek.schedule;

  const getActivityById = (activityId: string): Activity | undefined => {
    for (const pillar of pillars) {
      const activity = pillar.activities.find((a) => a.id === activityId);
      if (activity) return activity;
    }
    return undefined;
  };

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

      // Fill the time slots
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

  const handlePreviousWeek = () => {
    if (currentWeekIndex > 0) {
      onWeekChange(currentWeekIndex - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      onWeekChange(currentWeekIndex + 1);
    }
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

    const canvas = await html2canvas(scheduleRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`schedule-week-${currentWeekIndex + 1}.pdf`);
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

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4">
            Week {currentWeekIndex + 1} ({formatDate(currentWeek.startDate)})
          </Typography>
          <Tooltip title="Edit Week Start Date">
            <IconButton onClick={handleEditDateClick} size="small">
              <Edit />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Previous Week">
            <IconButton onClick={handlePreviousWeek} disabled={currentWeekIndex === 0}>
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Week">
            <IconButton onClick={handleNextWeek} disabled={currentWeekIndex === weeks.length - 1}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PDF">
            <IconButton onClick={handleExportPDF}>
              <PictureAsPdf />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Legend pillars={pillars} />

      <div ref={scheduleRef}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <TableCell key={day}>{day}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((hour) => (
                <TableRow key={hour}>
                  <TableCell>{hour}</TableCell>
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
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        {activity?.name || ''}
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
    </Box>
  );
}; 