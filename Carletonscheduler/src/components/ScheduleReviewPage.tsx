import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Download } from 'lucide-react';
import { type GeneratedSchedule } from '../utils/scheduleGenerator';

interface ScheduleReviewPageProps {
  schedules: GeneratedSchedule[];
  onFinalize: (schedule: GeneratedSchedule) => void;
  onBack: () => void;
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const colors = [
  'bg-blue-100 border-blue-300 text-blue-900',
  'bg-green-100 border-green-300 text-green-900',
  'bg-purple-100 border-purple-300 text-purple-900',
  'bg-orange-100 border-orange-300 text-orange-900',
  'bg-pink-100 border-pink-300 text-pink-900',
  'bg-cyan-100 border-cyan-300 text-cyan-900',
];

export function ScheduleReviewPage({
  schedules,
  onFinalize,
  onBack
}: ScheduleReviewPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSchedule = schedules[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : schedules.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < schedules.length - 1 ? prev + 1 : 0));
  };

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getTimeSlotPosition = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const dayStart = parseTime('08:00');
    
    const top = ((start - dayStart) / 60) * 80; // 80px per hour
    const height = ((end - start) / 60) * 80;
    
    return { top, height };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Course Selection
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-slate-900">Schedule Review</h1>
                  <p className="text-slate-600">
                    {schedules.length} conflict-free schedule{schedules.length !== 1 ? 's' : ''} generated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prerequisites Info - Show if any course has prerequisites */}
        {currentSchedule.prerequisiteInfo && 
         Object.values(currentSchedule.prerequisiteInfo).some((info: any) => 
           info.expressionEvaluated && info.expressionEvaluated !== 'None'
         ) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-900">Prerequisites Information</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Some courses in this schedule have prerequisites. Review them below and verify you meet the requirements.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Schedule Navigation */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Schedule Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900">Schedule {currentIndex + 1}</h2>
              </div>
              
              <div className="text-center py-4 border-y border-slate-200 my-4">
                <p className="text-3xl text-slate-900">{currentIndex + 1}</p>
                <p className="text-sm text-slate-600">of {schedules.length}</p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => onFinalize(currentSchedule)}
                className="w-full"
              >
                Finalize This Schedule
              </Button>
            </div>

            {/* Course List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-slate-900 mb-4">Courses in This Schedule</h3>
              <div className="space-y-2">
                {(() => {
                  // Group selections by course code
                  const grouped = new Map<string, typeof currentSchedule.selections>();
                  currentSchedule.selections.forEach(selection => {
                    if (!grouped.has(selection.courseCode)) {
                      grouped.set(selection.courseCode, []);
                    }
                    grouped.get(selection.courseCode)!.push(selection);
                  });

                  // Render grouped courses
                  return Array.from(grouped.entries()).map(([courseCode, sections], idx) => {
                    const prereqInfo = currentSchedule.prerequisiteInfo?.[courseCode];
                    
                    return (
                      <div
                        key={courseCode}
                        className={`p-3 rounded-lg border ${colors[idx % colors.length]}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{courseCode}</p>
                            {sections.map((selection, sIdx) => (
                              <div key={sIdx} className="text-xs mt-1 opacity-80">
                                {selection.section.sectionCode} - {selection.section.type}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Prerequisite Info */}
                        {prereqInfo && prereqInfo.expressionEvaluated && prereqInfo.expressionEvaluated !== 'None' && (
                          <div className="mt-2 pt-2 border-t border-current/20">
                            <p className="text-xs opacity-90">
                              <strong>Prerequisites:</strong> {prereqInfo.expressionEvaluated}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Timetable Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-slate-900">Weekly Timetable</h2>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Timetable Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    <div className="text-sm text-slate-600 p-2"></div>
                    {days.map(day => (
                      <div key={day} className="text-sm text-slate-900 p-2 text-center">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="relative">
                    <div className="grid grid-cols-6 gap-2">
                      {/* Time labels */}
                      <div className="space-y-[60px]">
                        {timeSlots.map(time => (
                          <div key={time} className="text-xs text-slate-600 h-20 flex items-start">
                            {time}
                          </div>
                        ))}
                      </div>

                      {/* Day columns */}
                      {days.map(day => (
                        <div key={day} className="relative border border-slate-200 rounded-lg bg-slate-50" style={{ minHeight: '960px' }}>
                          {/* Time slot grid lines */}
                          {timeSlots.map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute left-0 right-0 border-t border-slate-200"
                              style={{ top: `${idx * 80}px` }}
                            />
                          ))}

                          {/* Course blocks */}
                          {currentSchedule.selections.map((selection, idx) => {
                            return selection.section.timeSlots
                              .filter(slot => slot.day === day)
                              .map((slot, slotIdx) => {
                                const { top, height } = getTimeSlotPosition(slot.startTime, slot.endTime);
                                return (
                                  <div
                                    key={`${selection.courseCode}-${slotIdx}`}
                                    className={`absolute left-1 right-1 rounded-lg border-2 p-2 overflow-hidden ${colors[idx % colors.length]}`}
                                    style={{
                                      top: `${top}px`,
                                      height: `${height}px`
                                    }}
                                  >
                                    <p className="text-xs leading-tight">
                                      {selection.courseCode}
                                    </p>
                                    <p className="text-xs opacity-80 mt-1">
                                      {selection.section.sectionCode}
                                    </p>
                                    <p className="text-xs opacity-70 mt-1">
                                      {slot.startTime} - {slot.endTime}
                                    </p>
                                  </div>
                                );
                              });
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
