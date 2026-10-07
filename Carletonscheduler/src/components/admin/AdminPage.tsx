import { useState, useEffect } from 'react';
import { SectionUpload } from './SectionUpload';
import { CourseEditor } from './CourseEditor';
import { ElectiveManager } from './ElectiveManager';
import { API_BASE_URL, authenticatedFetch } from '../../config/constants';

type AdminTab = 'sections' | 'courses' | 'electives';

interface AdminStats {
  courses: number;
  sections: number;
  recentTerms: Array<{ term: string; sections: number }>;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('sections');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatTermCode = (code: string): string => {
    if (code.length !== 6) return code;
    const year = code.substring(0, 4);
    const term = code.substring(4);
    const termNames: Record<string, string> = {
      '10': 'Winter',
      '20': 'Summer',
      '30': 'Fall'
    };
    return `${termNames[term] || term} ${year}`;
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'sections', label: 'Timetable' },
    { id: 'courses', label: 'Courses' },
    { id: 'electives', label: 'Electives' },
  ];

  return (
    <main className="scheduler-page page-container">
        {/* Header */}
        <div className="page-heading">
          <h1>
            Catalogue management
          </h1>
          <p>
            Timetable imports, course prerequisites, and elective categories.
          </p>
        </div>

        {/* Stats Cards */}
        {!loadingStats && stats && (
          <div className="admin-stats">
            <StatCard label="Total Courses" value={stats.courses.toLocaleString()} />
            <StatCard label="Total Sections" value={stats.sections.toLocaleString()} />
            {stats.recentTerms.length > 0 && (
              <StatCard 
                label={formatTermCode(stats.recentTerms[0].term)} 
                value={stats.recentTerms[0].sections.toLocaleString()}
                sublabel="sections"
              />
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="admin-tabs" role="tablist" aria-label="Catalogue management">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              id={`admin-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls="admin-content"
              tabIndex={activeTab === tab.id ? 0 : -1}
              onKeyDown={(event) => {
                const index = tabs.findIndex(item => item.id === activeTab);
                const nextIndex = event.key === 'ArrowRight' ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
                  : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
                if (nextIndex < 0) return;
                event.preventDefault();
                setActiveTab(tabs[nextIndex].id);
                document.getElementById(`admin-tab-${tabs[nextIndex].id}`)?.focus();
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-panel admin-content" id="admin-content" role="tabpanel" aria-labelledby={`admin-tab-${activeTab}`}>
          {activeTab === 'sections' && (
            <SectionUpload onUploadComplete={fetchStats} />
          )}
          {activeTab === 'courses' && (
            <CourseEditor />
          )}
          {activeTab === 'electives' && (
            <ElectiveManager />
          )}
        </div>
    </main>
  );
}

function StatCard({ 
  label, 
  value, 
  sublabel 
}: { 
  label: string; 
  value: string; 
  sublabel?: string;
}) {
  return (
    <div className="glass-panel admin-stat">
      <div className="admin-stat-value">
        {value}
        {sublabel && (
          <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '6px' }}>
            {sublabel}
          </span>
        )}
      </div>
      <div className="admin-stat-label">
        {label}
      </div>
    </div>
  );
}
