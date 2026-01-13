import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, Info } from 'lucide-react';
import { type GeneratedSchedule, type PrerequisiteInfo } from '../utils/scheduleGenerator';
import { TIMETABLE_CONFIG, COURSE_COLORS } from '../config/constants';

interface ScheduleReviewPageProps {
  schedules: GeneratedSchedule[];
  onFinalize: (schedule: GeneratedSchedule) => void;
  onBack: () => void;
}

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
    const dayStart = parseTime(TIMETABLE_CONFIG.TIME_SLOTS[0]);
    
    const top = ((start - dayStart) / 60) * TIMETABLE_CONFIG.HOUR_HEIGHT_PX;
    const height = ((end - start) / 60) * TIMETABLE_CONFIG.HOUR_HEIGHT_PX;
    
    return { top, height };
  };

  // Group selections by course code
  const groupedCourses = new Map<string, typeof currentSchedule.selections>();
  currentSchedule.selections.forEach(selection => {
    if (!groupedCourses.has(selection.courseCode)) {
      groupedCourses.set(selection.courseCode, []);
    }
    groupedCourses.get(selection.courseCode)!.push(selection);
  });

  const courseColorMap = new Map<string, typeof COURSE_COLORS[number]>();
  Array.from(groupedCourses.keys()).forEach((code, idx) => {
    courseColorMap.set(code, COURSE_COLORS[idx % COURSE_COLORS.length]);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Bar */}
      <header className="bg-[#bf112b] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold tracking-tight">Carleton Course Scheduler</h1>
          <button
            onClick={onBack}
            className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to selection
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Schedule Options</h2>
            <p className="text-gray-600">
              {schedules.length} conflict-free schedule{schedules.length !== 1 ? 's' : ''} generated
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="sm" onClick={handlePrevious} className="rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              {currentIndex + 1} of {schedules.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNext} className="rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Prerequisites Notice */}
        {currentSchedule.prerequisiteInfo && 
         Object.values(currentSchedule.prerequisiteInfo).some((info: PrerequisiteInfo) => 
           info.expressionEvaluated && info.expressionEvaluated !== 'None'
         ) && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-amber-800">
              Some courses have prerequisites. Verify you meet requirements before registering.
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Courses
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {groupedCourses.size}
                </span>
              </h3>
              <div className="space-y-3">
                {Array.from(groupedCourses.entries()).map(([courseCode, sections]) => {
                  const prereqInfo = currentSchedule.prerequisiteInfo?.[courseCode];
                  const colors = courseColorMap.get(courseCode) || COURSE_COLORS[0];
                  
                  return (
                    <div
                      key={courseCode}
                      className="p-3 rounded-lg border-l-4"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    >
                      <p className="text-sm font-semibold">{courseCode}</p>
                      {sections.map((selection, idx) => (
                        <p key={idx} className="text-xs mt-1 opacity-70">
                          {selection.section.type} - {selection.section.sectionCode}
                        </p>
                      ))}
                      {prereqInfo?.expressionEvaluated && prereqInfo.expressionEvaluated !== 'None' && (
                        <p className="text-xs mt-2 pt-2 border-t border-current/10 opacity-70">
                          Prereq: {prereqInfo.expressionEvaluated}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
              <Button onClick={() => onFinalize(currentSchedule)} className="w-full h-11 shadow-sm">
                Select This Schedule
              </Button>
              <Button variant="outline" className="w-full h-10">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Timetable */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="overflow-x-auto">
              <div style={{ minWidth: '600px' }}>
                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: '4px', marginBottom: '4px' }}>
                  <div></div>
                  {TIMETABLE_CONFIG.DAYS.map(day => (
                    <div key={day} className="text-sm font-semibold text-gray-900 p-2 text-center bg-gray-50 rounded">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: '4px' }}>
                  {/* Time labels */}
                  <div>
                    {TIMETABLE_CONFIG.TIME_SLOTS.map(time => (
                      <div key={time} style={{ height: `${TIMETABLE_CONFIG.HOUR_HEIGHT_PX}px` }} className="text-xs text-gray-500 flex items-start pt-1 pr-2 justify-end">
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {TIMETABLE_CONFIG.DAYS.map(day => (
                    <div key={day} className="relative bg-gray-50 rounded" style={{ height: `${TIMETABLE_CONFIG.TIME_SLOTS.length * TIMETABLE_CONFIG.HOUR_HEIGHT_PX}px` }}>
                      {/* Hour grid lines */}
                      {TIMETABLE_CONFIG.TIME_SLOTS.map((_, idx) => (
                        <div
                          key={idx}
                          className="absolute left-0 right-0 border-t border-gray-200"
                          style={{ top: `${idx * TIMETABLE_CONFIG.HOUR_HEIGHT_PX}px` }}
                        />
                      ))}

                      {/* Course blocks */}
                      {currentSchedule.selections.map((selection) => {
                        const colors = courseColorMap.get(selection.courseCode) || COURSE_COLORS[0];
                        return selection.section.timeSlots
                          .filter(slot => slot.day === day)
                          .map((slot, slotIdx) => {
                            const { top, height } = getTimeSlotPosition(slot.startTime, slot.endTime);
                            return (
                              <div
                                key={`${selection.courseCode}-${selection.section.sectionCode}-${slotIdx}`}
                                className="absolute left-1 right-1 rounded border p-1.5 overflow-hidden"
                                style={{ 
                                  top: `${top}px`, 
                                  height: `${height}px`,
                                  backgroundColor: colors.bg,
                                  borderColor: colors.border,
                                  color: colors.text
                                }}
                              >
                                <p className="text-xs font-semibold leading-tight truncate">
                                  {selection.courseCode}
                                </p>
                                <p className="text-xs opacity-70 truncate">
                                  {selection.section.sectionCode}
                                </p>
                                {height > 50 && (
                                  <p className="text-xs opacity-60 mt-0.5">
                                    {slot.startTime}-{slot.endTime}
                                  </p>
                                )}
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
      </main>
    </div>
  );
}
