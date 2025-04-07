import { useState, useEffect } from 'react';
import { Container, Box, Tabs, Tab, Button } from '@mui/material';
import { PillarManager } from './components/PillarManager';
import { Schedule } from './components/Schedule';
import { Pillar, WeekSchedule, Week, ScheduleState } from './types';

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
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      timeSlots: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        activities: Object.fromEntries(days.map(day => [day, ''])),
      })),
      days,
    };
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

  useEffect(() => {
    localStorage.setItem('pillars', JSON.stringify(pillars));
  }, [pillars]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(scheduleState));
  }, [scheduleState]);

  const handleAddWeek = () => {
    const lastWeek = scheduleState.weeks[scheduleState.weeks.length - 1];
    const lastWeekStart = new Date(lastWeek.startDate);
    const newWeekStart = new Date(lastWeekStart);
    newWeekStart.setDate(lastWeekStart.getDate() + 7);

    setScheduleState(prev => ({
      ...prev,
      weeks: [
        ...prev.weeks,
        {
          id: Date.now().toString(),
          startDate: newWeekStart.toISOString(),
          schedule: createEmptySchedule(),
        },
      ],
    }));
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
              <Button variant="contained" onClick={handleAddWeek}>
                Add Week
              </Button>
            </Box>
            <Schedule
              pillars={pillars}
              weeks={scheduleState.weeks}
              currentWeekIndex={scheduleState.currentWeekIndex}
              onWeekChange={handleWeekChange}
              onScheduleChange={handleScheduleChange}
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
    </Container>
  );
}

export default App;
