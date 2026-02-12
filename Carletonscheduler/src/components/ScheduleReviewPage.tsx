import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, Info, Copy, Check, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { type GeneratedSchedule, type PrerequisiteInfo } from '../utils/scheduleGenerator';
import { TIMETABLE_CONFIG, COURSE_COLORS } from '../config/constants';
import { getCourseByCode, type Course } from '../utils/courseData';
import type { ElectiveRequirement } from '../App';

interface ScheduleReviewPageProps {
  schedules: GeneratedSchedule[];
  onBack: () => void;
  electiveRequirements?: ElectiveRequirement[];
  selectedElectives?: Record<string, string>;
  onElectiveChange?: (category: string, courseCode: string, allSelectedCourses: string[]) => void;
  completedCourses?: string[];
}

interface ElectiveCourseInfo {
  code: string;
  name: string;
  hasSections: boolean;
  prereqsMet: boolean;
  prerequisites: string[];
}

export function ScheduleReviewPage({
  schedules,
  onBack,
  electiveRequirements = [],
  selectedElectives = {},
  onElectiveChange,
  completedCourses = [],
}: ScheduleReviewPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [electiveCourseDetails, setElectiveCourseDetails] = useState<Record<string, ElectiveCourseInfo[]>>({});
  const [loadingElectives, setLoadingElectives] = useState<Record<string, boolean>>({});
  const [swappingElective, setSwappingElective] = useState<string | null>(null);
  const currentSchedule = schedules[currentIndex];

  // Set initial active tab
  useEffect(() => {
    if (electiveRequirements.length > 0 && !activeTab) {
      setActiveTab(electiveRequirements[0].category);
    }
  }, [electiveRequirements, activeTab]);

  // Load elective course details when a tab is activated
  useEffect(() => {
    if (!activeTab) return;
    if (electiveCourseDetails[activeTab]) return; // Already loaded

    const requirement = electiveRequirements.find(er => er.category === activeTab);
    if (!requirement) return;

    const loadDetails = async () => {
      setLoadingElectives(prev => ({ ...prev, [activeTab]: true }));
      
      const details: ElectiveCourseInfo[] = [];
      // Load first 20 elective options to keep it manageable
      const coursesToLoad = requirement.courseOptions.slice(0, 20);
      
      const coursePromises = coursesToLoad.map(code => getCourseByCode(code));
      const courses = await Promise.all(coursePromises);
      
      for (let i = 0; i < coursesToLoad.length; i++) {
        const course = courses[i];
        const code = coursesToLoad[i];
        
        if (course) {
          // Simple prerequisite check against completed courses
          const prereqsMet = course.prerequisites.length === 0 || 
            course.prerequisites.every(p => completedCourses.includes(p));
          
          details.push({
            code,
            name: course.name || code,
            hasSections: course.hasSections !== false,
            prereqsMet,
            prerequisites: course.prerequisites,
          });
        } else {
          details.push({
            code,
            name: code,
            hasSections: false,
            prereqsMet: true,
            prerequisites: [],
          });
        }
      }

      // Sort: available first, then by code
      details.sort((a, b) => {
        if (a.hasSections && a.prereqsMet && (!b.hasSections || !b.prereqsMet)) return -1;
        if (b.hasSections && b.prereqsMet && (!a.hasSections || !a.prereqsMet)) return 1;
        return a.code.localeCompare(b.code);
      });

      setElectiveCourseDetails(prev => ({ ...prev, [activeTab]: details }));
      setLoadingElectives(prev => ({ ...prev, [activeTab]: false }));
    };

    loadDetails();
  }, [activeTab, electiveRequirements, completedCourses, electiveCourseDetails]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : schedules.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < schedules.length - 1 ? prev + 1 : 0));
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const copyAllCRNs = () => {
    const crns = currentSchedule.selections
      .map(s => s.section.crn)
      .join(', ');
    copyToClipboard(crns, 'all-crns');
  };

  const handleElectiveSwap = async (category: string, newCourseCode: string) => {
    if (!onElectiveChange) return;
    
    const currentElective = selectedElectives[category];
    if (newCourseCode === currentElective) return;

    setSwappingElective(newCourseCode);

    // Build the new course list: take current schedule's courses, 
    // swap out the old elective for the new one
    const currentCourses = new Set(
      currentSchedule.selections.map(s => s.courseCode)
    );
    
    // Remove old elective if present
    if (currentElective) {
      currentCourses.delete(currentElective);
    }
    
    // Add new elective
    currentCourses.add(newCourseCode);
    
    const allCourses = Array.from(currentCourses);
    
    onElectiveChange(category, newCourseCode, allCourses);
    setCurrentIndex(0);
    
    // Brief delay before clearing loading state
    setTimeout(() => setSwappingElective(null), 500);
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

  // Identify which courses in the current schedule are electives
  const electiveCourseSet = new Set<string>();
  for (const er of electiveRequirements) {
    for (const code of er.courseOptions) {
      electiveCourseSet.add(code);
    }
  }

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

      <main className="max-w-7xl mx-auto px-6 py-8 pb-32">
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
                  const isElective = electiveCourseSet.has(courseCode);
                  
                  return (
                    <div
                      key={courseCode}
                      className="p-3 rounded-lg border-l-4"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{courseCode}</p>
                        {isElective && (
                          <BookOpen className="w-3.5 h-3.5 opacity-60" />
                        )}
                      </div>
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
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
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

        {/* Elective Swapping Tabs */}
        {electiveRequirements.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {electiveRequirements.map((er) => (
                <button
                  key={er.category}
                  onClick={() => setActiveTab(er.category)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === er.category
                      ? 'border-[#bf112b] text-[#bf112b] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {er.label}
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === er.category
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {er.creditsNeeded} cr
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab && (
              <div className="p-5">
                {loadingElectives[activeTab] ? (
                  <div className="flex items-center gap-3 py-8 justify-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading elective options...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Select an elective to swap into your schedule. Courses with met prerequisites and available sections are shown first.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {(electiveCourseDetails[activeTab] || []).map((elective) => {
                        const isCurrentlySelected = selectedElectives[activeTab] === elective.code ||
                          currentSchedule.selections.some(s => s.courseCode === elective.code);
                        const isAvailable = elective.hasSections && elective.prereqsMet;
                        const isSwapping = swappingElective === elective.code;
                        
                        return (
                          <button
                            key={elective.code}
                            onClick={() => isAvailable && !isCurrentlySelected && handleElectiveSwap(activeTab, elective.code)}
                            disabled={!isAvailable || isCurrentlySelected || isSwapping}
                            className={`text-left p-3 rounded-lg border-2 transition-all ${
                              isCurrentlySelected
                                ? 'border-[#bf112b] bg-red-50 ring-1 ring-[#bf112b]/20'
                                : isAvailable
                                ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                                : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${
                                  isCurrentlySelected ? 'text-[#bf112b]' : 'text-gray-900'
                                }`}>
                                  {elective.code}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {elective.name}
                                </p>
                              </div>
                              {isCurrentlySelected && (
                                <Check className="w-4 h-4 text-[#bf112b] flex-shrink-0 mt-0.5" />
                              )}
                              {isSwapping && (
                                <Loader2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5 animate-spin" />
                              )}
                            </div>
                            
                            {/* Status indicators */}
                            {!isAvailable && (
                              <div className="mt-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <span className="text-xs text-amber-600">
                                  {!elective.hasSections ? 'No sections available' : 'Prerequisites not met'}
                                </span>
                              </div>
                            )}
                            
                            {isAvailable && !isCurrentlySelected && elective.prerequisites.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-400">
                                  Prereqs: {elective.prerequisites.join(', ')}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {(electiveCourseDetails[activeTab] || []).length === 0 && !loadingElectives[activeTab] && (
                      <div className="py-8 text-center text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No elective options found for this category.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Copy Section */}
        <div className="mt-8 bg-white border-2 border-gray-300 rounded-xl shadow-md overflow-hidden" style={{ marginBottom: '150px' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Quick Copy for Registration</h3>
              <p className="text-sm text-gray-500 mt-0.5">Click any code to copy to clipboard</p>
            </div>
            <button
              onClick={copyAllCRNs}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#bf112b] text-[#ffffff] hover:bg-[#a00f25] rounded-lg transition-colors shadow-sm"
            >
              {copiedItem === 'all-crns' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All CRNs
                </>
              )}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">CRN</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Days</th>
                </tr>
              </thead>
              <tbody>
                {currentSchedule.selections.map((selection, idx) => {
                  const colors = courseColorMap.get(selection.courseCode) || COURSE_COLORS[0];
                  const itemId = `${selection.courseCode}-${selection.section.sectionCode}`;
                  const days = selection.section.timeSlots.map(s => s.day.slice(0, 3)).filter((v, i, a) => a.indexOf(v) === i).join(', ');
                  const times = selection.section.timeSlots.length > 0 
                    ? `${selection.section.timeSlots[0].startTime} - ${selection.section.timeSlots[0].endTime}`
                    : 'TBA';
                  
                  return (
                    <tr key={idx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => copyToClipboard(selection.courseCode, `course-${itemId}`)}
                          className="flex items-center gap-2 font-medium hover:text-[#bf112b] transition-colors"
                          style={{ color: colors.text }}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors.border }}
                          />
                          {selection.courseCode}
                          {copiedItem === `course-${itemId}` && (
                            <Check className="w-3 h-3 text-green-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {selection.section.type}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => copyToClipboard(selection.section.crn, `crn-${itemId}`)}
                          className="font-mono text-gray-900 hover:text-[#bf112b] transition-colors flex items-center gap-1"
                        >
                          {selection.section.crn}
                          {copiedItem === `crn-${itemId}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-30 hover:opacity-100" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {times}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {days}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
