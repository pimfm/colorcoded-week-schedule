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
} from '@mui/material';
import { Pillar, Activity, WeekSchedule } from '../types';

interface ScheduleProps {
  pillars: Pillar[];
  schedule: WeekSchedule;
  onScheduleChange: (schedule: WeekSchedule) => void;
}

export const Schedule: React.FC<ScheduleProps> = ({
  pillars,
  schedule,
  onScheduleChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    hour: number;
    day: string;
  } | null>(null);

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

      onScheduleChange({
        ...schedule,
        timeSlots: updatedTimeSlots,
      });
      setSelectedCell(null);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Two-Week Schedule
      </Typography>

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