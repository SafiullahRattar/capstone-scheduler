import { getRegistrationTerms, getTermLabel } from '../utils/termUtils';

export function TermTabs({ activeTerm, onChangeTerm, disabled = false, label }: {
  activeTerm: string;
  onChangeTerm: (term: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const terms = getRegistrationTerms().map(term => term.code);
  if (!terms.includes(activeTerm)) terms.push(activeTerm);
  terms.sort((a, b) => ['30', '10', '20'].indexOf(a.slice(-2)) - ['30', '10', '20'].indexOf(b.slice(-2)));
  return <div className="schedule-term-tabs" role="tablist" aria-label={label}>
    {terms.map(term => <button key={term} role="tab" aria-selected={term === activeTerm} disabled={disabled} onClick={() => onChangeTerm(term)}>{getTermLabel(term)}</button>)}
  </div>;
}
