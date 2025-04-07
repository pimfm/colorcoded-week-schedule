export interface Activity {
  id: string;
  name: string;
  color: string;
  pillarId: string;
}

export interface Pillar {
  id: string;
  name: string;
  activities: Activity[];
}

export interface TimeSlot {
  activityId: string | null;
  endTime: string | null; // Format: "HH:mm"
}

export interface WeekSchedule {
  [day: string]: {
    [hour: string]: TimeSlot;
  };
}

export interface Week {
  id: string;
  startDate: string;
  schedule: WeekSchedule;
}

export interface ScheduleState {
  weeks: Week[];
  currentWeekIndex: number;
} 