import React, { useState } from 'react';
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
} from '@mui/material';
import { Pillar, Activity, WeekSchedule, Week } from '../types';
import { ChevronLeft, ChevronRight, PictureAsPdf } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ScheduleProps {
  pillars: Pillar[];
  weeks: Week[];
  currentWeekIndex: number;
  onWeekChange: (index: number) => void;
  onScheduleChange: (weekId: string, schedule: WeekSchedule) => void;
}

export const Schedule: React.FC<ScheduleProps> = ({
  pillars,
  weeks = [],
  currentWeekIndex = 0,
  onWeekChange,
  onScheduleChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    hour: number;
    day: string;
  } | null>(null);
  const scheduleRef = React.useRef<HTMLDivElement>(null);

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

  const handleCellClick = (hour: number, day: string) => {
    setSelectedCell({ hour, day });
  };

  const handleActivitySelect = (activityId: string) => {
    if (selectedCell) {
      const updatedTimeSlots = schedule.timeSlots.map((timeSlot) =>
        timeSlot.hour === selectedCell.hour
          ? {
              ...timeSlot,
              activities: {
                ...timeSlot.activities,
                [selectedCell.day]: activityId,
              },
            }
          : timeSlot
      );

      onScheduleChange(currentWeek.id, {
        ...schedule,
        timeSlots: updatedTimeSlots,
      });
      setSelectedCell(null);
    }
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

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Week {currentWeekIndex + 1} ({formatDate(currentWeek.startDate)})
        </Typography>
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

      <div ref={scheduleRef}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hour</TableCell>
                {schedule.days.map((day) => (
                  <TableCell key={day}>{day}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.timeSlots.map((timeSlot) => (
                <TableRow key={timeSlot.hour}>
                  <TableCell>{timeSlot.hour}:00</TableCell>
                  {schedule.days.map((day) => {
                    const activityId = timeSlot.activities[day];
                    const activity = activityId ? getActivityById(activityId) : undefined;
                    return (
                      <TableCell
                        key={day}
                        onClick={() => handleCellClick(timeSlot.hour, day)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: activity?.color || 'white',
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
      <Dialog
        open={selectedCell !== null}
        onClose={() => setSelectedCell(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Activity</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pillars.map((pillar) => (
              <Box key={pillar.id}>
                <Typography variant="h6" gutterBottom>
                  {pillar.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {pillar.activities.map((activity) => (
                    <Button
                      key={activity.id}
                      variant="outlined"
                      onClick={() => handleActivitySelect(activity.id)}
                      sx={{
                        borderColor: activity.color,
                        color: activity.color,
                        '&:hover': {
                          borderColor: activity.color,
                          backgroundColor: `${activity.color}20`,
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
    </Box>
  );
}; 