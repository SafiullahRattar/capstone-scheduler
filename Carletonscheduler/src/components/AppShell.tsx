import { type ReactNode } from 'react';
import { LogOut, Settings2, ArrowLeft, BookOpen, CalendarDays, FileText } from 'lucide-react';
import { Button } from './ui/button';

interface AppShellProps {
  children: ReactNode;
  currentPage: 'import' | 'course-selection' | 'schedule-review' | 'admin';
  user: { name?: string; email?: string; role?: string } | null;
  onLogout: () => void;
  onAdmin: () => void;
  onReturn: () => void;
  onNavigate: (page: 'course-selection' | 'schedule-review') => void;
  hasSchedules: boolean;
  hasAuditData: boolean;
  onImportAudit: () => void;
}

export function AppShell({ children, currentPage, user, onLogout, onAdmin, onReturn, onNavigate, hasSchedules, hasAuditData, onImportAudit }: AppShellProps) {

  return (
    <div className="scheduler-app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <img src="/images/Carleton_Logo_Main.jpg" alt="Carleton University" />
            <div><strong>Smart Scheduler</strong><span>Carleton University</span></div>
          </div>
          {(currentPage === 'course-selection' || currentPage === 'schedule-review') && (
            <div className="planner-navigation">
            <nav className="app-navigation" aria-label="Main navigation">
              <button onClick={() => onNavigate('course-selection')} aria-current={currentPage === 'course-selection' ? 'page' : undefined}><BookOpen size={16} /> Courses</button>
              <button onClick={() => onNavigate('schedule-review')} disabled={!hasSchedules} title={!hasSchedules ? 'Available when you generate a schedule' : undefined} aria-current={currentPage === 'schedule-review' ? 'page' : undefined}><CalendarDays size={16} /> Schedule</button>
            </nav>
              <Button variant={hasAuditData ? 'outline' : 'default'} size="sm" className="header-import-audit" onClick={onImportAudit}><FileText size={15} />{hasAuditData ? 'Replace audit' : 'Import audit'}</Button>
            </div>
          )}
          <div className="app-account">
            <span className="app-account-name">{user?.name || user?.email}</span>
            <div className="app-header-actions">
              {currentPage === 'admin' ? (
                <Button variant="ghost" size="sm" onClick={onReturn}><ArrowLeft size={14} /> Scheduler</Button>
              ) : user?.role === 'ADMIN' && (
                <Button variant="ghost" size="sm" onClick={onAdmin}><Settings2 size={14} /> Admin</Button>
              )}
              <Button variant="outline" size="sm" onClick={onLogout}><LogOut size={14} /> Sign out</Button>
            </div>
          </div>
        </div>
      </header>
      {children}
      <footer className="app-footer">Carleton University · Smart Scheduler</footer>
    </div>
  );
}
