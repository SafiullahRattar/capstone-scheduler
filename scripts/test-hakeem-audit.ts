
import * as fs from 'fs';
import { parseAuditHTML, parseAuditPDF } from '../cli/audit-parser.ts';
import { execSync } from 'child_process';
import * as path from 'path';

async function test() {
  const htmlPath = 'Hakeem_Audit.html';
  const pdfPath = 'Hakeem_Audit.pdf';

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found: ${htmlPath}`);
    return;
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found: ${pdfPath}`);
    return;
  }

  // Parse HTML
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const htmlData = parseAuditHTML(htmlContent);

  // Parse PDF
  const txtPath = 'Hakeem_Audit.txt';
  execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`);
  const pdfText = fs.readFileSync(txtPath, 'utf-8');
  const pdfData = parseAuditPDF(pdfText);

  console.log('--- AUDIT COMPARISON ---');
  console.log(`Student: ${htmlData.name} vs ${pdfData.name}`);
  console.log(`Program: ${htmlData.program} vs ${pdfData.program}`);
  console.log(`Completed Courses: ${htmlData.completedCourses.length} vs ${pdfData.completedCourses.length}`);
  console.log(`Current Courses: ${htmlData.currentCourses.length} vs ${pdfData.currentCourses.length}`);
  console.log(`Requirements: ${htmlData.requirements.length} vs ${pdfData.requirements.length}`);

  console.log('\n--- HTML REQUIREMENTS ---');
  htmlData.requirements.forEach(r => {
    console.log(`[${r.status}] ${r.title} (${r.creditsCompleted}/${r.creditsRequired} cr) - Options: ${r.courseOptions.join(', ')}`);
  });

  console.log('\n--- PDF REQUIREMENTS ---');
  pdfData.requirements.forEach(r => {
    console.log(`[${r.status}] ${r.title} (${r.creditsCompleted}/${r.creditsRequired} cr) - Options: ${r.courseOptions.join(', ')}`);
  });

  // Check for discrepancies in requirements
  const htmlReqTitles = new Set(htmlData.requirements.map(r => r.title));
  const pdfReqTitles = new Set(pdfData.requirements.map(r => r.title));

  console.log('\n--- DISCREPANCIES ---');
  const onlyInHtml = [...htmlReqTitles].filter(t => !pdfReqTitles.has(t));
  const onlyInPdf = [...pdfReqTitles].filter(t => !htmlReqTitles.has(t));

  console.log(`Only in HTML: ${onlyInHtml.length}`);
  onlyInHtml.forEach(t => console.log(` - ${t}`));

  console.log(`Only in PDF: ${onlyInPdf.length}`);
  onlyInPdf.forEach(t => console.log(` - ${t}`));

  // Cleanup
  if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
}

test().catch(console.error);
