import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { type GeneratedSchedule } from '../utils/scheduleGenerator';
import { TIMETABLE_CONFIG, COURSE_COLORS } from '../config/constants';
import { getCourseByCode } from '../utils/courseData';
import type { ElectiveRequirement } from '../types/electives';
import {
  ScheduleCalendarSection,
  ScheduleSidebar,
} from './schedule-review/ScheduleReviewSections';

interface ScheduleReviewPageProps {
  schedules: GeneratedSchedule[];
  onBack: () => void;
  electiveRequirements?: ElectiveRequirement[];
  selectedElectives?: Record<string, string[]>;
  selectedElectiveCredits?: Record<string, number>;
  onElectiveChange?: (category: string, courseCodes: string[], allSelectedCourses: string[]) => void;
  completedCourses?: string[];
  activeTerm: string;
}
interface ElectiveCourseInfo {
  code: string;
  name: string;
  credits: number;
  hasSections: boolean;
  prereqsMet: boolean;
  prerequisites: string[];
}

export function ScheduleReviewPage({
  schedules,
  onBack,
  electiveRequirements = [],
  selectedElectives = {},
  selectedElectiveCredits = {},
  onElectiveChange,
  completedCourses = [],
  activeTerm,
}: ScheduleReviewPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [electiveCourseDetails, setElectiveCourseDetails] = useState<Record<string, ElectiveCourseInfo[]>>({});
  const [loadingElectives, setLoadingElectives] = useState<Record<string, boolean>>({});
  const [swappingElective, setSwappingElective] = useState<string | null>(null);
  const [electiveSearchTerms, setElectiveSearchTerms] = useState<Record<string, string>>({});
  const [showUnavailable, setShowUnavailable] = useState<Record<string, boolean>>({});
  const currentSchedule = schedules[currentIndex];

  // Only show elective categories that the user selected on the previous page
  const activeElectiveRequirements = electiveRequirements.filter(
    er => (selectedElectiveCredits[er.category] || 0) > 0 && er.courseOptions && er.courseOptions.length > 0
  );
  const [activeElectiveCategory, setActiveElectiveCategory] = useState<string>(
    activeElectiveRequirements.length > 0 ? activeElectiveRequirements[0].category : ''
  );

  useEffect(() => {
    setElectiveCourseDetails({});
    setLoadingElectives({});
  }, [activeTerm]);

  useEffect(() => {
    for (const er of activeElectiveRequirements) {
      const category = er.category;
      if (electiveCourseDetails[category]) continue;
      if (loadingElectives[category]) continue;

      const loadDetails = async () => {
        setLoadingElectives(prev => ({ ...prev, [category]: true }));
        const details: ElectiveCourseInfo[] = [];
        const coursesToLoad = er.courseOptions.slice(0, 100);

        for (let batchStart = 0; batchStart < coursesToLoad.length; batchStart += 20) {
          const batch = coursesToLoad.slice(batchStart, batchStart + 20);
          const courses = await Promise.all(batch.map(code => getCourseByCode(code)));

          for (let i = 0; i < batch.length; i++) {
            const course = courses[i];
            const code = batch[i];
            if (course) {
              const hasSectionsInActiveTerm = (course.terms || []).includes(activeTerm);
              const prereqsMet = course.prerequisites.length === 0 ||
                course.prerequisites.every(p => completedCourses.includes(p));
              details.push({
                code,
                name: course.name || code,
                credits: course.credits || 0.5,
                hasSections: hasSectionsInActiveTerm,
                prereqsMet,
                prerequisites: course.prerequisites,
              });
            } else {
              details.push({ code, name: code, credits: 0.5, hasSections: false, prereqsMet: true, prerequisites: [] });
            }
          }
        }

        details.sort((a, b) => {
          const aOk = a.hasSections && a.prereqsMet;
          const bOk = b.hasSections && b.prereqsMet;
          if (aOk && !bOk) return -1;
          if (bOk && !aOk) return 1;
          return a.code.localeCompare(b.code);
        });

        setElectiveCourseDetails(prev => ({ ...prev, [category]: details }));
        setLoadingElectives(prev => ({ ...prev, [category]: false }));
      };
      loadDetails();
    }
  }, [activeElectiveRequirements, completedCourses, activeTerm]);

  const handlePrevious = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : schedules.length - 1));
  const handleNext = () => setCurrentIndex(prev => (prev < schedules.length - 1 ? prev + 1 : 0));

  const copyToClipboard = async (text: string, itemId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleElectiveToggle = async (category: string, courseCode: string, courseCredits: number) => {
    if (!onElectiveChange) return;
    const requirement = electiveRequirements.find(er => er.category === category);
    if (!requirement) return;
    const creditsTarget = selectedElectiveCredits[category] || requirement.creditsNeeded;

    const currentPicks = selectedElectives[category] || [];
    const isSelected = currentPicks.includes(courseCode);

    let newPicks: string[];
    if (isSelected) {
      newPicks = currentPicks.filter(c => c !== courseCode);
    } else if (courseCredits >= creditsTarget) {
      newPicks = [courseCode];
    } else {
      const currentCredits = currentPicks.reduce((sum, code) => {
        const info = (electiveCourseDetails[category] || []).find(e => e.code === code);
        return sum + (info?.credits || 0.5);
      }, 0);
      if (currentCredits + courseCredits > creditsTarget) {
        newPicks = [...currentPicks.slice(0, -1), courseCode];
      } else {
        newPicks = [...currentPicks, courseCode];
      }
    }

    if (newPicks.length === 0) return;

    setSwappingElective(courseCode);
    const nonElectiveCourses = currentSchedule.selections
      .map(s => s.courseCode)
      .filter(c => {
        for (const er of electiveRequirements) {
          if (selectedElectives[er.category]?.includes(c)) return false;
        }
        return true;
      });

    const allElectivePicks: string[] = [];
    for (const er of electiveRequirements) {
      if (er.category === category) allElectivePicks.push(...newPicks);
      else allElectivePicks.push(...(selectedElectives[er.category] || []));
    }

    onElectiveChange(category, newPicks, [...new Set([...nonElectiveCourses, ...allElectivePicks])]);
    setCurrentIndex(0);
    setTimeout(() => setSwappingElective(null), 500);
  };

  const handleElectiveRemove = (category: string, courseCode: string) => {
    if (!onElectiveChange) return;
    const currentPicks = selectedElectives[category] || [];
    const newPicks = currentPicks.filter(c => c !== courseCode);

    // Build the updated course list
    const nonElectiveCourses = currentSchedule.selections
      .map(s => s.courseCode)
      .filter(c => {
        for (const er of electiveRequirements) {
          if (selectedElectives[er.category]?.includes(c)) return false;
        }
        return true;
      });

    const allElectivePicks: string[] = [];
    for (const er of electiveRequirements) {
      if (er.category === category) allElectivePicks.push(...newPicks);
      else allElectivePicks.push(...(selectedElectives[er.category] || []));
    }

    const allCourses = [...new Set([...nonElectiveCourses, ...allElectivePicks])];
    onElectiveChange(category, newPicks, allCourses);
    setCurrentIndex(0);
  };

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Compute visible time range
  const allTimeSlots = currentSchedule.selections.flatMap(s => s.section.timeSlots);
  const allStartMins = allTimeSlots.map(s => parseTime(s.startTime));
  const allEndMins = allTimeSlots.map(s => parseTime(s.endTime));
  const earliestHour = allStartMins.length > 0 ? Math.floor(Math.min(...allStartMins) / 60) : 8;
  const latestHour = allEndMins.length > 0 ? Math.ceil(Math.max(...allEndMins) / 60) : 18;
  const visibleStartHour = Math.max(TIMETABLE_CONFIG.START_HOUR, earliestHour - 1);
  const visibleEndHour = Math.min(22, Math.max(TIMETABLE_CONFIG.END_HOUR, latestHour + 1));
  const visibleTimeSlots: string[] = [];
  for (let h = visibleStartHour; h < visibleEndHour; h++) {
    visibleTimeSlots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  const HOUR_PX = 56;

  const getPos = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const dayStart = visibleStartHour * 60;
    return {
      top: ((start - dayStart) / 60) * HOUR_PX,
      height: ((end - start) / 60) * HOUR_PX,
    };
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 400px' }}>
        <ScheduleCalendarSection
          schedules={schedules}
          currentIndex={currentIndex}
          currentSchedule={currentSchedule}
          visibleTimeSlots={visibleTimeSlots}
          hourPx={HOUR_PX}
          getPos={getPos}
          onBack={onBack}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
        <ScheduleSidebar
          currentSchedule={currentSchedule}
          copiedItem={copiedItem}
          onCopyToClipboard={copyToClipboard}
          activeElectiveRequirements={activeElectiveRequirements}
          activeElectiveCategory={activeElectiveCategory}
          setActiveElectiveCategory={setActiveElectiveCategory}
          selectedElectives={selectedElectives}
          selectedElectiveCredits={selectedElectiveCredits}
          electiveCourseDetails={electiveCourseDetails}
          loadingElectives={loadingElectives}
          electiveSearchTerms={electiveSearchTerms}
          setElectiveSearchTerms={setElectiveSearchTerms}
          showUnavailable={showUnavailable}
          setShowUnavailable={setShowUnavailable}
          swappingElective={swappingElective}
          onElectiveToggle={handleElectiveToggle}
          onElectiveRemove={handleElectiveRemove}
        />
      </div>
    </div>
  );
}
