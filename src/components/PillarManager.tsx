import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';
import { Pillar, Activity } from '../types';

interface PillarManagerProps {
  pillars: Pillar[];
  onPillarsChange: (pillars: Pillar[]) => void;
}

export const PillarManager: React.FC<PillarManagerProps> = ({
  pillars,
  onPillarsChange,
}) => {
  const [newPillarName, setNewPillarName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleAddPillar = () => {
    if (newPillarName.trim()) {
      const newPillar: Pillar = {
        id: Date.now().toString(),
        name: newPillarName.trim(),
        activities: [],
      };
      onPillarsChange([...pillars, newPillar]);
      setNewPillarName('');
    }
  };

  const handleAddActivity = (pillarId: string) => {
    if (newActivityName.trim()) {
      const newActivity: Activity = {
        id: Date.now().toString(),
        name: newActivityName.trim(),
        color: selectedColor,
        pillarId,
      };
      const updatedPillars = pillars.map((pillar) =>
        pillar.id === pillarId
          ? { ...pillar, activities: [...pillar.activities, newActivity] }
          : pillar
      );
      onPillarsChange(updatedPillars);
      setNewActivityName('');
      setIsColorPickerOpen(false);
    }
  };

  const handleDeletePillar = (pillarId: string) => {
    onPillarsChange(pillars.filter((pillar) => pillar.id !== pillarId));
  };

  const handleDeleteActivity = (pillarId: string, activityId: string) => {
    const updatedPillars = pillars.map((pillar) =>
      pillar.id === pillarId
        ? {
            ...pillar,
            activities: pillar.activities.filter((activity) => activity.id !== activityId),
          }
        : pillar
    );
    onPillarsChange(updatedPillars);
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Manage Pillars and Activities
      </Typography>

      {/* Add new pillar */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="New Pillar Name"
              value={newPillarName}
              onChange={(e) => setNewPillarName(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleAddPillar}
              startIcon={<AddIcon />}
            >
              Add Pillar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* List of pillars */}
      {pillars.map((pillar) => (
        <Card key={pillar.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{pillar.name}</Typography>
              <IconButton
                onClick={() => handleDeletePillar(pillar.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            {/* Add new activity */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="New Activity Name"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedPillarId(pillar.id);
                  setIsColorPickerOpen(true);
                }}
              >
                Pick Color
              </Button>
              <Button
                variant="contained"
                onClick={() => handleAddActivity(pillar.id)}
                startIcon={<AddIcon />}
              >
                Add Activity
              </Button>
            </Box>

            {/* List of activities */}
            <List>
              {pillar.activities.map((activity) => (
                <ListItem key={activity.id}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: activity.color,
                      mr: 2,
                      borderRadius: 1,
                    }}
                  />
                  <ListItemText primary={activity.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteActivity(pillar.id, activity.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      {/* Color picker dialog */}
      <Dialog open={isColorPickerOpen} onClose={() => setIsColorPickerOpen(false)}>
        <DialogTitle>Pick a color for the activity</DialogTitle>
        <DialogContent>
          <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsColorPickerOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedPillarId) {
                handleAddActivity(selectedPillarId);
              }
            }}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 