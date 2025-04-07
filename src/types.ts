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
  hour: number;
  activities: { [day: string]: string }; // day -> activityId
}

export interface WeekSchedule {
  timeSlots: TimeSlot[];
  days: string[];
} 