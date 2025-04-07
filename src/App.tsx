import { useState, useEffect } from 'react';
import { Container, Box, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { PillarManager } from './components/PillarManager';
import { Schedule } from './components/Schedule';
import { Pillar, WeekSchedule, ScheduleState } from './types';

function App() {
  const [pillars, setPillars] = useState<Pillar[]>(() => {
    const savedPillars = localStorage.getItem('pillars');
    if (savedPillars) {
      return JSON.parse(savedPillars);
    }
    return [
      {
        id: '1',
        name: 'Social',
        activities: [
          { id: '1', name: 'Friends meeting with me', color: '#FF6B6B', pillarId: '1' },
          { id: '2', name: 'Me meeting with friends', color: '#4ECDC4', pillarId: '1' },
        ],
      },
      {
        id: '2',
        name: 'Meals',
        activities: [
          { id: '3', name: 'Breakfast', color: '#FFD93D', pillarId: '2' },
          { id: '4', name: 'Lunch', color: '#FF9F1C', pillarId: '2' },
          { id: '5', name: 'Dinner', color: '#FF6B6B', pillarId: '2' },
        ],
      },
      {
        id: '3',
        name: 'Work',
        activities: [
          { id: '6', name: 'Admin work', color: '#6C5CE7', pillarId: '3' },
          { id: '7', name: 'Deep work', color: '#A8E6CF', pillarId: '3' },
          { id: '8', name: 'Shallow work', color: '#FFD3B6', pillarId: '3' },
        ],
      },
      {
        id: '4',
        name: 'Distractions',
        activities: [
          { id: '9', name: 'Procrastination', color: '#FF8B94', pillarId: '4' },
          { id: '10', name: 'Limbo', color: '#B8B8B8', pillarId: '4' },
        ],
      },
    ];
  });

  const createEmptySchedule = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minutes = i % 2 === 0 ? '00' : '30';
      return `${String(hour).padStart(2, '0')}:${minutes}`;
    });
    
    const schedule: WeekSchedule = {};
    
    // Initialize each day with empty time slots
    days.forEach(day => {
      schedule[day] = {};
      hours.forEach(hour => {
        schedule[day][hour] = {
          activityId: null,
          endTime: null
        };
      });
    });
    
    return schedule;
  };

  const [scheduleState, setScheduleState] = useState<ScheduleState>(() => {
    try {
      const savedSchedule = localStorage.getItem('schedule');
      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        // Validate the parsed data
        if (parsed && Array.isArray(parsed.weeks) && parsed.weeks.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading saved schedule:', error);
    }

    // Create initial two weeks if no valid saved data
    const today = new Date();
    const week1Start = new Date(today);
    week1Start.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    const week2Start = new Date(week1Start);
    week2Start.setDate(week1Start.getDate() + 7);

    return {
      weeks: [
        {
          id: '1',
          startDate: week1Start.toISOString(),
          schedule: createEmptySchedule(),
        },
        {
          id: '2',
          startDate: week2Start.toISOString(),
          schedule: createEmptySchedule(),
        },
      ],
      currentWeekIndex: 0,
    };
  });

  const [activeTab, setActiveTab] = useState(0);
  const [isAddWeekDialogOpen, setIsAddWeekDialogOpen] = useState(false);
  const [newWeekDate, setNewWeekDate] = useState('');

  useEffect(() => {
    localStorage.setItem('pillars', JSON.stringify(pillars));
  }, [pillars]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(scheduleState));
  }, [scheduleState]);

  const handleOpenAddWeekDialog = () => {
    // Set default date to next Monday after the last week
    const lastWeek = scheduleState.weeks[scheduleState.weeks.length - 1];
    const lastWeekStart = new Date(lastWeek.startDate);
    const nextMonday = new Date(lastWeekStart);
    nextMonday.setDate(lastWeekStart.getDate() + 7);
    
    // Format date as YYYY-MM-DD for the date input
    const year = nextMonday.getFullYear();
    const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const day = String(nextMonday.getDate()).padStart(2, '0');
    setNewWeekDate(`${year}-${month}-${day}`);
    
    setIsAddWeekDialogOpen(true);
  };

  const handleAddWeek = () => {
    if (!newWeekDate) return;
    
    const selectedDate = new Date(newWeekDate);
    
    setScheduleState(prev => ({
      ...prev,
      weeks: [
        ...prev.weeks,
        {
          id: Date.now().toString(),
          startDate: selectedDate.toISOString(),
          schedule: createEmptySchedule(),
        },
      ],
    }));
    
    setIsAddWeekDialogOpen(false);
  };

  const handleWeekChange = (index: number) => {
    if (index >= 0 && index < scheduleState.weeks.length) {
      setScheduleState(prev => ({
        ...prev,
        currentWeekIndex: index,
      }));
    }
  };

  const handleScheduleChange = (weekId: string, newSchedule: WeekSchedule) => {
    setScheduleState(prev => ({
      ...prev,
      weeks: prev.weeks.map(week =>
        week.id === weekId ? { ...week, schedule: newSchedule } : week
      ),
    }));
  };

  const handleUpdateWeekDate = (weekId: string, newDate: string) => {
    setScheduleState(prev => ({
      ...prev,
      weeks: prev.weeks.map(week =>
        week.id === weekId ? { ...week, startDate: new Date(newDate).toISOString() } : week
      ),
    }));
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Schedule" />
          <Tab label="Manage Pillars & Activities" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" onClick={handleOpenAddWeekDialog}>
                Add Week
              </Button>
            </Box>
            <Schedule
              pillars={pillars}
              weeks={scheduleState.weeks}
              currentWeekIndex={scheduleState.currentWeekIndex}
              onWeekChange={handleWeekChange}
              onScheduleChange={handleScheduleChange}
              onUpdateWeekDate={handleUpdateWeekDate}
            />
          </>
        )}
        {activeTab === 1 && (
          <PillarManager
            pillars={pillars}
            onPillarsChange={setPillars}
          />
        )}
      </Box>

      {/* Add Week Dialog */}
      <Dialog open={isAddWeekDialogOpen} onClose={() => setIsAddWeekDialogOpen(false)}>
        <DialogTitle>Add New Week</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Week Start Date"
            type="date"
            fullWidth
            value={newWeekDate}
            onChange={(e) => setNewWeekDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddWeekDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddWeek} variant="contained">Add Week</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
