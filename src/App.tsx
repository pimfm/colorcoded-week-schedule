import { useState, useEffect } from 'react';
import { Container, Box, Tabs, Tab } from '@mui/material';
import { PillarManager } from './components/PillarManager';
import { Schedule } from './components/Schedule';
import { Pillar, WeekSchedule } from './types';

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

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const savedSchedule = localStorage.getItem('schedule');
    if (savedSchedule) {
      return JSON.parse(savedSchedule);
    }
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const timeSlots = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      activities: Object.fromEntries(days.map(day => [day, ''])),
    }));
    return { timeSlots, days };
  });

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    localStorage.setItem('pillars', JSON.stringify(pillars));
  }, [pillars]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [schedule]);

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
          <Schedule
            pillars={pillars}
            schedule={schedule}
            onScheduleChange={setSchedule}
          />
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
