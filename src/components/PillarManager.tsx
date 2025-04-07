import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);
  const [editingActivity, setEditingActivity] = useState<{
    pillarId: string;
    activity: Activity;
  } | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityColor, setNewActivityColor] = useState('#000000');
  const [hexColorInput, setHexColorInput] = useState('');

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

  const handleDeletePillar = (pillarId: string) => {
    onPillarsChange(pillars.filter((p) => p.id !== pillarId));
  };

  const handleEditPillar = (pillar: Pillar) => {
    setEditingPillar(pillar);
  };

  const handleSavePillarEdit = () => {
    if (editingPillar) {
      onPillarsChange(
        pillars.map((p) =>
          p.id === editingPillar.id ? { ...p, name: editingPillar.name } : p
        )
      );
      setEditingPillar(null);
    }
  };

  const handleAddActivity = (pillarId: string) => {
    if (newActivityName.trim()) {
      const newActivity: Activity = {
        id: Date.now().toString(),
        name: newActivityName.trim(),
        color: newActivityColor,
        pillarId,
      };
      onPillarsChange(
        pillars.map((p) =>
          p.id === pillarId
            ? { ...p, activities: [...p.activities, newActivity] }
            : p
        )
      );
      setNewActivityName('');
      setNewActivityColor('#000000');
    }
  };

  const handleDeleteActivity = (pillarId: string, activityId: string) => {
    onPillarsChange(
      pillars.map((p) =>
        p.id === pillarId
          ? {
              ...p,
              activities: p.activities.filter((a) => a.id !== activityId),
            }
          : p
      )
    );
  };

  const handleEditActivity = (pillarId: string, activity: Activity) => {
    setEditingActivity({ pillarId, activity });
    setNewActivityName(activity.name);
    setNewActivityColor(activity.color);
    setHexColorInput(activity.color);
  };

  const handleSaveActivityEdit = () => {
    if (editingActivity) {
      const updatedActivity: Activity = {
        ...editingActivity.activity,
        name: newActivityName.trim(),
        color: newActivityColor,
      };
      onPillarsChange(
        pillars.map((p) =>
          p.id === editingActivity.pillarId
            ? {
                ...p,
                activities: p.activities.map((a) =>
                  a.id === editingActivity.activity.id ? updatedActivity : a
                ),
              }
            : p
        )
      );
      setEditingActivity(null);
      setNewActivityName('');
      setNewActivityColor('#000000');
      setHexColorInput('');
    }
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewActivityColor(event.target.value);
    setHexColorInput(event.target.value);
  };

  const handleHexColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setHexColorInput(value);
    
    // Only update the color if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setNewActivityColor(value);
    }
  };

  const handleHexColorBlur = () => {
    // If the hex input is invalid, reset it to the current color
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexColorInput)) {
      setHexColorInput(newActivityColor);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Manage Pillars & Activities
      </Typography>

      {/* Add New Pillar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Pillar
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Pillar Name"
            value={newPillarName}
            onChange={(e) => setNewPillarName(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleAddPillar}
            disabled={!newPillarName.trim()}
          >
            Add Pillar
          </Button>
        </Box>
      </Paper>

      {/* Pillars List */}
      {pillars.map((pillar) => (
        <Paper key={pillar.id} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{pillar.name}</Typography>
            <Box>
              <Tooltip title="Edit Pillar">
                <IconButton onClick={() => handleEditPillar(pillar)} size="small">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Pillar">
                <IconButton onClick={() => handleDeletePillar(pillar.id)} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Add New Activity */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Activity Name"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="color"
                value={newActivityColor}
                onChange={handleColorChange}
                style={{ width: '50px', height: '40px', padding: 0, border: 'none' }}
              />
              <TextField
                label="Hex Color"
                value={hexColorInput}
                onChange={handleHexColorChange}
                onBlur={handleHexColorBlur}
                size="small"
                sx={{ width: '100px' }}
                placeholder="#000000"
              />
            </Box>
            <Button
              variant="contained"
              onClick={() => handleAddActivity(pillar.id)}
              disabled={!newActivityName.trim()}
            >
              Add Activity
            </Button>
          </Box>

          {/* Activities List */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pillar.activities.map((activity) => (
              <Box 
                key={activity.id} 
                sx={{ 
                  width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' },
                  p: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: activity.color,
                  color: getContrastColor(activity.color),
                  borderRadius: 1,
                }}
              >
                <Typography>{activity.name}</Typography>
                <Box>
                  <Tooltip title="Edit Activity">
                    <IconButton
                      onClick={() => handleEditActivity(pillar.id, activity)}
                      size="small"
                      sx={{ color: getContrastColor(activity.color) }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Activity">
                    <IconButton
                      onClick={() => handleDeleteActivity(pillar.id, activity.id)}
                      size="small"
                      sx={{ color: getContrastColor(activity.color) }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      ))}

      {/* Edit Pillar Dialog */}
      <Dialog open={!!editingPillar} onClose={() => setEditingPillar(null)}>
        <DialogTitle>Edit Pillar</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Pillar Name"
            fullWidth
            value={editingPillar?.name || ''}
            onChange={(e) =>
              setEditingPillar(
                editingPillar
                  ? { ...editingPillar, name: e.target.value }
                  : null
              )
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPillar(null)}>Cancel</Button>
          <Button onClick={handleSavePillarEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={!!editingActivity} onClose={() => setEditingActivity(null)}>
        <DialogTitle>Edit Activity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Activity Name"
            fullWidth
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <input
              type="color"
              value={newActivityColor}
              onChange={handleColorChange}
              style={{ width: '50px', height: '40px', padding: 0, border: 'none' }}
            />
            <TextField
              label="Hex Color"
              value={hexColorInput}
              onChange={handleHexColorChange}
              onBlur={handleHexColorBlur}
              size="small"
              sx={{ width: '100px' }}
              placeholder="#000000"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingActivity(null)}>Cancel</Button>
          <Button onClick={handleSaveActivityEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to determine text color based on background color
const getContrastColor = (hexColor: string): string => {
  // Remove the # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}; 