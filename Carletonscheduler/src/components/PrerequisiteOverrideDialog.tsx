import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

export function PrerequisiteOverrideDialog({ course, issues, onCancel, onConfirm }: {
  course: string | null;
  issues: string[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return <Dialog open={Boolean(course)} onOpenChange={open => { if (!open) onCancel(); }}>
    <DialogContent className="scheduler-popover">
      <DialogTitle>Plan {course} without meeting its prerequisites?</DialogTitle>
      <DialogDescription>This override is for planning situations the scheduler cannot fully verify, such as permitted same-term prerequisites, a prerequisite taken earlier in the semester, or department permission.</DialogDescription>
      {issues.length > 0 && <div className="prerequisite-override-explanation"><strong>Requirements not met in your audit</strong><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
      <p className="prerequisite-override-explanation">Adding the course here does not waive university requirements or grant permission. Carleton Central may reject the course or your CRN stack. Confirm that you are eligible with the university before registering.</p>
      <div className="prerequisite-override-actions"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={onConfirm}>Add for planning anyway</Button></div>
    </DialogContent>
  </Dialog>;
}
