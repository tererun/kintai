import { SavedSettings, FilterPreset } from '@/types';

const STORAGE_KEY = 'kintai-settings';

const defaultSettings: SavedSettings = {
  filterPresets: [],
  activePresetId: null,
  timeInputMode: 'endTime',
};

export function loadSettings(): SavedSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SavedSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function addFilterPreset(preset: FilterPreset): SavedSettings {
  const settings = loadSettings();
  settings.filterPresets.push(preset);
  settings.activePresetId = preset.id;
  saveSettings(settings);
  return settings;
}

export function updateFilterPreset(preset: FilterPreset): SavedSettings {
  const settings = loadSettings();
  const index = settings.filterPresets.findIndex((p) => p.id === preset.id);
  if (index !== -1) {
    settings.filterPresets[index] = preset;
  }
  saveSettings(settings);
  return settings;
}

export function deleteFilterPreset(presetId: string): SavedSettings {
  const settings = loadSettings();
  settings.filterPresets = settings.filterPresets.filter((p) => p.id !== presetId);
  if (settings.activePresetId === presetId) {
    settings.activePresetId = settings.filterPresets[0]?.id ?? null;
  }
  saveSettings(settings);
  return settings;
}

export function setActivePreset(presetId: string | null): SavedSettings {
  const settings = loadSettings();
  settings.activePresetId = presetId;
  saveSettings(settings);
  return settings;
}

export function setTimeInputMode(mode: 'endTime' | 'duration'): SavedSettings {
  const settings = loadSettings();
  settings.timeInputMode = mode;
  saveSettings(settings);
  return settings;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
