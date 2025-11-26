import { Plus, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { type Course } from '../utils/courseData';

interface ElectiveRecommendationsProps {
  completedCourses: string[];
  selectedCourses: string[];
  onAddCourse: (courseCode: string) => void;
}

export function ElectiveRecommendations({
  completedCourses,
  selectedCourses,
  onAddCourse
}: ElectiveRecommendationsProps) {
  // TODO: Fetch electives from API once backend endpoint is added
  const eligibleElectives: Course[] = [];
  const technicalElectives: Course[] = [];
  const complementaryElectives: Course[] = [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-slate-900">Elective Recommendations</h2>
      </div>

      <p className="text-sm text-slate-600 mb-6">
        Based on your completed courses and current selections, here are compatible electives you can take.
      </p>

      {/* Technical Electives */}
      <div className="mb-6">
        <h3 className="text-slate-900 mb-3">
          Technical Electives ({technicalElectives.length})
        </h3>
        
        {technicalElectives.length === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 text-center">
            No eligible technical electives available. Complete more prerequisite courses to unlock options.
          </div>
        ) : (
          <div className="space-y-3">
            {technicalElectives.slice(0, 5).map(course => (
              <div
                key={course.code}
                className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-slate-900">{course.code}</p>
                    <p className="text-sm text-slate-600 mt-1">{course.name}</p>
                    <p className="text-xs text-slate-500 mt-2">{course.description}</p>
                    
                    {course.prerequisites.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500">Prerequisites:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {course.prerequisites.map(prereq => (
                            <span
                              key={prereq}
                              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded"
                            >
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onAddCourse(course.code)}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complementary Electives */}
      <div>
        <h3 className="text-slate-900 mb-3">
          Complementary Electives ({complementaryElectives.length})
        </h3>
        
        {complementaryElectives.length === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 text-center">
            No complementary electives available.
          </div>
        ) : (
          <div className="space-y-3">
            {complementaryElectives.slice(0, 5).map(course => (
              <div
                key={course.code}
                className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-slate-900">{course.code}</p>
                    <p className="text-sm text-slate-600 mt-1">{course.name}</p>
                    <p className="text-xs text-slate-500 mt-2">{course.description}</p>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onAddCourse(course.code)}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {eligibleElectives.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600">
            Showing top 10 recommendations. {eligibleElectives.length - 10} more available.
          </p>
        </div>
      )}
    </div>
  );
}
