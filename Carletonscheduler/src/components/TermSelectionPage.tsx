import { useState } from 'react';
import { Leaf, Snowflake, Sun, Check, ArrowRight, Sparkles, FileCheck2 } from 'lucide-react';
import { Button } from './ui/button';
import { getRegistrationTerms, getTermLabel } from '../utils/termUtils';

interface TermSelectionPageProps {
  hasAuditData: boolean;
  chosenTerm?: string;
  /** Number of courses already planned in each term. */
  termSummaries?: Record<string, number>;
  onChooseTerm: (term: string) => void;
}

const seasons = [
  { suffix: '30', name: 'Fall', months: 'September – December', Icon: Leaf, className: 'fall' },
  { suffix: '10', name: 'Winter', months: 'January – April', Icon: Snowflake, className: 'winter' },
  { suffix: '20', name: 'Summer', months: 'May – August', Icon: Sun, className: 'summer' },
];

export function TermSelectionPage({ hasAuditData, chosenTerm, termSummaries = {}, onChooseTerm }: TermSelectionPageProps) {
  const terms = getRegistrationTerms();
  const [selectedTerm, setSelectedTerm] = useState<string | undefined>(
    terms.some(term => term.code === chosenTerm) ? chosenTerm : undefined
  );
  const selectedCount = selectedTerm ? termSummaries[selectedTerm] || 0 : 0;

  return (
    <main className="scheduler-page term-welcome">
      <div className="term-welcome-content">
        <div className="journey-reward">
          {hasAuditData ? <FileCheck2 size={16} /> : <Sparkles size={16} />}
          {hasAuditData ? 'Audit imported. Your courses are ready.' : 'A fresh start. A term full of possibilities.'}
        </div>
        <div className="term-welcome-heading">
          <h1>Which term are we planning?</h1>
          <p>Pick your season. Let's make it work for you.</p>
        </div>
        <div className="season-grid" role="group" aria-label="Choose your registration term">
          {seasons.map(({ suffix, name, months, Icon, className }) => {
            const term = terms.find(item => item.code.endsWith(suffix))!;
            const isSelected = selectedTerm === term.code;
            return (
              <button
                key={suffix}
                className={`season-card season-${className}${isSelected ? ' is-selected' : ''}`}
                aria-label={getTermLabel(term.code)}
                aria-pressed={isSelected}
                onClick={() => setSelectedTerm(term.code)}
              >
                <span className="season-scene" aria-hidden="true"><span className="season-orbit" /><Icon size={36} /></span>
                <span className="season-copy">
                  <strong>{name} <span>{term.code.substring(0, 4)}</span></strong>
                  <span>{months}</span>
                  {termSummaries[term.code] > 0 && <span className="season-plan-count">{termSummaries[term.code]} {termSummaries[term.code] === 1 ? 'course' : 'courses'} planned{term.code === chosenTerm ? ' · current' : ''}</span>}
                </span>
                <span className="season-check" aria-hidden="true">{isSelected ? <Check size={16} /> : <ArrowRight size={16} />}</span>
              </button>
            );
          })}
        </div>
        <div className="term-choice-action">
          <p className={`term-choice-feedback${selectedTerm ? ' has-choice' : ''}`} role="status">
            {selectedTerm
              ? <><Check size={14} /> {selectedCount > 0 ? `Picking up your ${getTermLabel(selectedTerm)} plan.` : `${getTermLabel(selectedTerm)} it is. Let's build your plan.`}</>
              : 'Your next chapter starts with a season.'}
          </p>
          <Button className="term-continue" disabled={!selectedTerm} onClick={() => { if (selectedTerm) onChooseTerm(selectedTerm); }}>
            {selectedTerm ? `${selectedTerm === chosenTerm ? 'Back to' : selectedCount > 0 ? 'Continue' : 'Plan'} ${getTermLabel(selectedTerm)}` : 'Choose your term'}<ArrowRight size={17} />
          </Button>
          <p className="term-choice-reassurance">Each term keeps its own plan, so you can switch any time.</p>
        </div>
      </div>
    </main>
  );
}
