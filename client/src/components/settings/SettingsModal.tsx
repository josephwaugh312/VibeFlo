import React, { useState, useEffect } from 'react';

interface Settings {
  pomodoro_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  pomodoros_until_long_break: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  sound_enabled: boolean;
  notification_enabled: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: Settings) => void;
  initialSettings?: Settings;
}

const defaultSettings: Settings = {
  pomodoro_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  pomodoros_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  sound_enabled: true,
  notification_enabled: true,
};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  initialSettings = defaultSettings
}) => {
  // Local state for form inputs
  const [pomodoroDuration, setPomodoroLength] = useState(initialSettings.pomodoro_duration);
  const [shortBreakDuration, setShortBreakLength] = useState(initialSettings.short_break_duration);
  const [longBreakDuration, setLongBreakLength] = useState(initialSettings.long_break_duration);
  const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(initialSettings.pomodoros_until_long_break);
  const [autoStartBreaks, setAutoStartBreaks] = useState(initialSettings.auto_start_breaks);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(initialSettings.auto_start_pomodoros);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings.sound_enabled);
  const [notificationEnabled, setNotificationEnabled] = useState(initialSettings.notification_enabled);
  const [saving, setSaving] = useState(false);

  // Update local state when settings change
  useEffect(() => {
    setPomodoroLength(initialSettings.pomodoro_duration);
    setShortBreakLength(initialSettings.short_break_duration);
    setLongBreakLength(initialSettings.long_break_duration);
    setPomodorosUntilLongBreak(initialSettings.pomodoros_until_long_break);
    setAutoStartBreaks(initialSettings.auto_start_breaks);
    setAutoStartPomodoros(initialSettings.auto_start_pomodoros);
    setSoundEnabled(initialSettings.sound_enabled);
    setNotificationEnabled(initialSettings.notification_enabled);
  }, [initialSettings]);

  // Handle saving settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings: Settings = {
        pomodoro_duration: pomodoroDuration,
        short_break_duration: shortBreakDuration,
        long_break_duration: longBreakDuration,
        pomodoros_until_long_break: pomodorosUntilLongBreak,
        auto_start_breaks: autoStartBreaks,
        auto_start_pomodoros: autoStartPomodoros,
        sound_enabled: soundEnabled,
        notification_enabled: notificationEnabled
      };
      
      if (onSave) {
        onSave(newSettings);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form values to current settings
    setPomodoroLength(initialSettings.pomodoro_duration);
    setShortBreakLength(initialSettings.short_break_duration);
    setLongBreakLength(initialSettings.long_break_duration);
    setPomodorosUntilLongBreak(initialSettings.pomodoros_until_long_break);
    setAutoStartBreaks(initialSettings.auto_start_breaks);
    setAutoStartPomodoros(initialSettings.auto_start_pomodoros);
    setSoundEnabled(initialSettings.sound_enabled);
    setNotificationEnabled(initialSettings.notification_enabled);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Timer Settings</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Time (minutes)</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="pomodoro" className="block text-sm font-medium text-gray-700 mb-1">
                Pomodoro
              </label>
              <input
                type="number"
                id="pomodoro"
                min="1"
                max="60"
                value={pomodoroDuration}
                onChange={(e) => setPomodoroLength(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="shortBreak" className="block text-sm font-medium text-gray-700 mb-1">
                Short Break
              </label>
              <input
                type="number"
                id="shortBreak"
                min="1"
                max="30"
                value={shortBreakDuration}
                onChange={(e) => setShortBreakLength(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="longBreak" className="block text-sm font-medium text-gray-700 mb-1">
                Long Break
              </label>
              <input
                type="number"
                id="longBreak"
                min="1"
                max="60"
                value={longBreakDuration}
                onChange={(e) => setLongBreakLength(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="pomodorosUntilLongBreak" className="block text-sm font-medium text-gray-700 mb-1">
              Pomodoros until long break
            </label>
            <input
              type="number"
              id="pomodorosUntilLongBreak"
              min="1"
              max="10"
              value={pomodorosUntilLongBreak}
              onChange={(e) => setPomodorosUntilLongBreak(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Auto Start</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoStartBreaks"
                checked={autoStartBreaks}
                onChange={(e) => setAutoStartBreaks(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoStartBreaks" className="ml-2 block text-sm text-gray-700">
                Auto start breaks
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoStartPomodoros"
                checked={autoStartPomodoros}
                onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm text-gray-700">
                Auto start pomodoros
              </label>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Notifications</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="soundEnabled"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="soundEnabled" className="ml-2 block text-sm text-gray-700">
                Sound notifications
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6 mb-2">Play a sound when timer completes</p>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificationEnabled"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="notificationEnabled" className="ml-2 block text-sm text-gray-700">
                Browser notifications
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">Show desktop notifications when timer completes (requires browser permission)</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 