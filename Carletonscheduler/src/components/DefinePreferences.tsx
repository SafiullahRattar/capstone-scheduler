import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Settings, Sun, Sunset, Moon, Calendar } from 'lucide-react';

export interface SchedulePreferences {
  timeOfDay: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  scheduleDensity: 'compressed' | 'balanced' | 'spread-out';
  avoidBackToBack: boolean;
  minimizeGaps: boolean;
}

interface DefinePreferencesProps {
  open: boolean;
  onClose: () => void;
  onSave: (preferences: SchedulePreferences) => void;
  initialPreferences?: SchedulePreferences;
}

const defaultPreferences: SchedulePreferences = {
  timeOfDay: {
    morning: true,
    afternoon: true,
    evening: false
  },
  scheduleDensity: 'balanced',
  avoidBackToBack: false,
  minimizeGaps: true
};

export function DefinePreferences({
  open,
  onClose,
  onSave,
  initialPreferences
}: DefinePreferencesProps) {
  const [preferences, setPreferences] = useState<SchedulePreferences>(
    initialPreferences || defaultPreferences
  );

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Define Schedule Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-slate-600">
            Customize your schedule preferences to influence how schedules are ranked. These settings are optional.
          </p>

          {/* Time of Day Preferences */}
          <div className="space-y-4">
            <div>
              <h3 className="text-slate-900 mb-2">Preferred Time of Day</h3>
              <p className="text-sm text-slate-600 mb-4">
                Select your preferred class times. Schedules matching these preferences will be ranked higher.
              </p>
            </div>

            <div className="space-y-3">
              {/* Morning */}
              <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox
                  id="morning"
                  checked={preferences.timeOfDay.morning}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      timeOfDay: { ...preferences.timeOfDay, morning: !!checked }
                    })
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <Label htmlFor="morning" className="cursor-pointer">
                      Morning (8:00 AM - 12:00 PM)
                    </Label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Early start to your day
                  </p>
                </div>
              </div>

              {/* Afternoon */}
              <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox
                  id="afternoon"
                  checked={preferences.timeOfDay.afternoon}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      timeOfDay: { ...preferences.timeOfDay, afternoon: !!checked }
                    })
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sunset className="w-5 h-5 text-orange-500" />
                    <Label htmlFor="afternoon" className="cursor-pointer">
                      Afternoon (12:00 PM - 5:00 PM)
                    </Label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Midday classes
                  </p>
                </div>
              </div>

              {/* Evening */}
              <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox
                  id="evening"
                  checked={preferences.timeOfDay.evening}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      timeOfDay: { ...preferences.timeOfDay, evening: !!checked }
                    })
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <Label htmlFor="evening" className="cursor-pointer">
                      Evening (5:00 PM - 9:00 PM)
                    </Label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Later in the day
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Density */}
          <div className="space-y-4">
            <div>
              <h3 className="text-slate-900 mb-2">Schedule Density</h3>
              <p className="text-sm text-slate-600 mb-4">
                Choose how you want your classes distributed throughout the week.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  setPreferences({ ...preferences, scheduleDensity: 'compressed' })
                }
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  preferences.scheduleDensity === 'compressed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-slate-900">Compressed</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Classes concentrated in 2-3 days (e.g., Tuesday/Thursday)
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setPreferences({ ...preferences, scheduleDensity: 'balanced' })
                }
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  preferences.scheduleDensity === 'balanced'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-slate-900">Balanced</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Even distribution across 3-4 days
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setPreferences({ ...preferences, scheduleDensity: 'spread-out' })
                }
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  preferences.scheduleDensity === 'spread-out'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-slate-900">Spread Out</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Classes spread across all 5 weekdays
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Additional Preferences */}
          <div className="space-y-4">
            <div>
              <h3 className="text-slate-900 mb-2">Additional Options</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg">
                <Checkbox
                  id="avoidBackToBack"
                  checked={preferences.avoidBackToBack}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, avoidBackToBack: !!checked })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="avoidBackToBack" className="cursor-pointer">
                    Avoid back-to-back classes
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Prefer schedules with breaks between classes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg">
                <Checkbox
                  id="minimizeGaps"
                  checked={preferences.minimizeGaps}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, minimizeGaps: !!checked })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="minimizeGaps" className="cursor-pointer">
                    Minimize gaps between classes
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Reduce idle time during the day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
