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
  dark_mode?: boolean;
  timer_completion_sound?: string;
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
  // Local state for form inputs - updated to allow string values for better UX
  const [formValues, setFormValues] = useState<{
    pomodoro_duration: number | string;
    short_break_duration: number | string;
    long_break_duration: number | string;
    pomodoros_until_long_break: number | string;
    auto_start_breaks: boolean;
    auto_start_pomodoros: boolean;
    dark_mode: boolean;
    desktop_notifications: boolean;
    audio_notifications: boolean;
    timer_completion_sound: string;
  }>({
    pomodoro_duration: initialSettings.pomodoro_duration,
    short_break_duration: initialSettings.short_break_duration,
    long_break_duration: initialSettings.long_break_duration,
    pomodoros_until_long_break: initialSettings.pomodoros_until_long_break,
    auto_start_breaks: initialSettings.auto_start_breaks,
    auto_start_pomodoros: initialSettings.auto_start_pomodoros,
    dark_mode: false,
    desktop_notifications: initialSettings.notification_enabled,
    audio_notifications: initialSettings.sound_enabled,
    timer_completion_sound: 'bell',
  });
  const [saving, setSaving] = useState(false);

  // Use effect to update form values when settings change
  useEffect(() => {
    if (initialSettings) {
      setFormValues({
        pomodoro_duration: typeof initialSettings.pomodoro_duration === 'number' ? initialSettings.pomodoro_duration : 25,
        short_break_duration: typeof initialSettings.short_break_duration === 'number' ? initialSettings.short_break_duration : 5,
        long_break_duration: typeof initialSettings.long_break_duration === 'number' ? initialSettings.long_break_duration : 15,
        pomodoros_until_long_break: typeof initialSettings.pomodoros_until_long_break === 'number' ? initialSettings.pomodoros_until_long_break : 4,
        auto_start_breaks: !!initialSettings.auto_start_breaks,
        auto_start_pomodoros: !!initialSettings.auto_start_pomodoros,
        dark_mode: !!initialSettings.dark_mode,
        desktop_notifications: initialSettings.notification_enabled !== false,
        audio_notifications: initialSettings.sound_enabled !== false,
        timer_completion_sound: initialSettings.timer_completion_sound || 'bell',
      });
    }
  }, [initialSettings]);

  // Handle saving settings
  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert any string values back to numbers for submission
      const newSettings: Settings = {
        pomodoro_duration: typeof formValues.pomodoro_duration === 'string' 
          ? parseInt(formValues.pomodoro_duration) || 25 
          : formValues.pomodoro_duration,
        short_break_duration: typeof formValues.short_break_duration === 'string'
          ? parseInt(formValues.short_break_duration) || 5
          : formValues.short_break_duration,
        long_break_duration: typeof formValues.long_break_duration === 'string'
          ? parseInt(formValues.long_break_duration) || 15
          : formValues.long_break_duration,
        pomodoros_until_long_break: typeof formValues.pomodoros_until_long_break === 'string'
          ? parseInt(formValues.pomodoros_until_long_break) || 4
          : formValues.pomodoros_until_long_break,
        auto_start_breaks: formValues.auto_start_breaks,
        auto_start_pomodoros: formValues.auto_start_pomodoros,
        sound_enabled: formValues.audio_notifications,
        notification_enabled: formValues.desktop_notifications,
        dark_mode: formValues.dark_mode,
        timer_completion_sound: formValues.timer_completion_sound,
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
    setFormValues({
      pomodoro_duration: initialSettings.pomodoro_duration,
      short_break_duration: initialSettings.short_break_duration,
      long_break_duration: initialSettings.long_break_duration,
      pomodoros_until_long_break: initialSettings.pomodoros_until_long_break,
      auto_start_breaks: initialSettings.auto_start_breaks,
      auto_start_pomodoros: initialSettings.auto_start_pomodoros,
      dark_mode: false,
      desktop_notifications: initialSettings.notification_enabled,
      audio_notifications: initialSettings.sound_enabled,
      timer_completion_sound: 'bell',
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // For number inputs, ensure we don't set NaN values
    if (type === 'number') {
      const numValue = parseInt(value);
      // Only update if it's a valid number, otherwise use default values
      setFormValues({
        ...formValues,
        [name]: isNaN(numValue) ? (
          name === 'pomodoro_duration' ? 25 :
          name === 'short_break_duration' ? 5 :
          name === 'long_break_duration' ? 15 :
          name === 'pomodoros_until_long_break' ? 4 : 0
        ) : numValue
      });
    } else {
      setFormValues({
        ...formValues,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  // New function to handle text input for timer durations
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Allow empty input for better user experience
    if (value === '') {
      setFormValues({
        ...formValues,
        [name]: ''
      });
      return;
    }
    
    // Only allow numeric input
    if (/^\d+$/.test(value)) {
      const numValue = parseInt(value);
      
      // Apply min/max constraints based on field name
      let finalValue = numValue;
      if (name === 'pomodoro_duration') {
        finalValue = Math.min(Math.max(numValue, 1), 60);
      } else if (name === 'short_break_duration') {
        finalValue = Math.min(Math.max(numValue, 1), 30);
      } else if (name === 'long_break_duration') {
        finalValue = Math.min(Math.max(numValue, 1), 60);
      } else if (name === 'pomodoros_until_long_break') {
        finalValue = Math.min(Math.max(numValue, 1), 10);
      }
      
      setFormValues({
        ...formValues,
        [name]: finalValue
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Timer Settings</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Time (minutes)</h3>
          
          {/* Updated grid layout for better mobile responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label htmlFor="pomodoro" className="block text-sm font-medium text-gray-700 mb-1">
                Pomodoro
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                id="pomodoro"
                name="pomodoro_duration"
                value={formValues.pomodoro_duration === '' ? '' : String(formValues.pomodoro_duration)}
                onChange={handleDurationChange}
                placeholder="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">1-60 minutes</p>
            </div>
            
            <div>
              <label htmlFor="shortBreak" className="block text-sm font-medium text-gray-700 mb-1">
                Short Break
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                id="shortBreak"
                name="short_break_duration"
                value={formValues.short_break_duration === '' ? '' : String(formValues.short_break_duration)}
                onChange={handleDurationChange}
                placeholder="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">1-30 minutes</p>
            </div>
            
            <div>
              <label htmlFor="longBreak" className="block text-sm font-medium text-gray-700 mb-1">
                Long Break
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                id="longBreak"
                name="long_break_duration"
                value={formValues.long_break_duration === '' ? '' : String(formValues.long_break_duration)}
                onChange={handleDurationChange}
                placeholder="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">1-60 minutes</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="pomodorosUntilLongBreak" className="block text-sm font-medium text-gray-700 mb-1">
              Pomodoros until long break
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              id="pomodorosUntilLongBreak"
              name="pomodoros_until_long_break"
              value={formValues.pomodoros_until_long_break === '' ? '' : String(formValues.pomodoros_until_long_break)}
              onChange={handleDurationChange}
              placeholder="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">1-10 pomodoros</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Auto Start</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoStartBreaks"
                name="auto_start_breaks"
                checked={formValues.auto_start_breaks}
                onChange={handleChange}
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
                name="auto_start_pomodoros"
                checked={formValues.auto_start_pomodoros}
                onChange={handleChange}
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
                name="audio_notifications"
                checked={formValues.audio_notifications}
                onChange={handleChange}
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
                name="desktop_notifications"
                checked={formValues.desktop_notifications}
                onChange={handleChange}
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