/**
 * Elective category mappings for Carleton Engineering programs
 * 
 * These mappings define which courses can satisfy elective requirements.
 * This is a simplified/mocked version - the full list would come from
 * official Carleton documentation or scraping.
 */

// SYSC/ELEC technical electives (3000-level and above)
export const SYSC_ELEC_ELECTIVES = [
  // SYSC 3000-level
  'SYSC3006', 'SYSC3010', 'SYSC3200', 'SYSC3313', 'SYSC3320', 
  'SYSC3501', 'SYSC3503', 'SYSC3600',
  // SYSC 4000-level  
  'SYSC4005', 'SYSC4111', 'SYSC4130', 'SYSC4201', 'SYSC4202', 
  'SYSC4205', 'SYSC4320', 'SYSC4415', 'SYSC4416', 'SYSC4502', 
  'SYSC4504', 'SYSC4505', 'SYSC4600', 'SYSC4607', 'SYSC4700',
  // ELEC 3000-level
  'ELEC3105', 'ELEC3500', 'ELEC3605',
  // ELEC 4000-level
  'ELEC4505', 'ELEC4509', 'ELEC4600', 'ELEC4700', 'ELEC4702', 
  'ELEC4703', 'ELEC4707'
]

// Computer Science electives for Software Engineering
export const CS_ELECTIVES = [
  // Lower level for prerequisites
  'COMP2401', 'COMP2402', 'COMP2404', 'COMP2406', 'COMP2501',
  // 3000-level
  'COMP3000', 'COMP3002', 'COMP3004', 'COMP3007', 'COMP3008', 
  'COMP3203', 'COMP3308', 'COMP3804',
  // 4000-level
  'COMP4107', 'COMP4108', 'COMP4203', 'COMP4501', 'COMP4601', 
  'COMP4602', 'COMP4806', 'COMP4900', 'COMP4901', 'COMP4905'
]

// Basic Science electives
export const SCIENCE_ELECTIVES = [
  // Physics
  'PHYS1902', 'PHYS2004', 'PHYS2203', 'PHYS2305', 'PHYS2605', 'PHYS2903',
  // Chemistry  
  'CHEM2104', 'CHEM2204', 'CHEM2208', 'CHEM2303', 'CHEM2400', 'CHEM2501',
  // Biology
  'BIOL1902', 'BIOL2001', 'BIOL2104', 'BIOL2107', 'BIOL2200', 'BIOL2201',
  // Earth Science
  'ERTH1011', 'ERTH2106', 'ERTH2312', 'ERTH2316', 'ERTH2404'
]

// Complementary Studies electives (humanities, social sciences)
// This is a simplified list - the full list is much larger
export const COMPLEMENTARY_STUDIES_ELECTIVES = [
  // Philosophy
  'PHIL1200', 'PHIL1301', 'PHIL2001', 'PHIL2003', 'PHIL2380', 'PHIL2390',
  // Sociology
  'SOCI1001', 'SOCI1002', 'SOCI2000', 'SOCI2001', 'SOCI2002',
  // Psychology
  'PSYC1001', 'PSYC1002', 'PSYC2001', 'PSYC2002',
  // Economics
  'ECON1000', 'ECON1001', 'ECON1002', 'ECON2009', 'ECON2020',
  // Business
  'BUSI1001', 'BUSI1002', 'BUSI1003', 'BUSI2001',
  // Technology & Society
  'TSES2305', 'TSES3001', 'TSES4002', 'TSES4012',
  // CCDP (required for engineering)
  'CCDP2100'
]

// Map category names to course lists
export const ELECTIVE_CATEGORIES: Record<string, string[]> = {
  'SYSC_ELEC_ELECTIVE': SYSC_ELEC_ELECTIVES,
  'CS_ELECTIVE': CS_ELECTIVES,
  'SCIENCE_ELECTIVE': SCIENCE_ELECTIVES,
  'COMPLEMENTARY_STUDIES': COMPLEMENTARY_STUDIES_ELECTIVES,
  // Fallback for generic electives
  'ELECTIVE': [...SYSC_ELEC_ELECTIVES, ...CS_ELECTIVES]
}

/**
 * Expand elective category tokens into actual course lists
 * @param courseOptions Array that may contain category tokens like "CS_ELECTIVE"
 * @returns Expanded array with category tokens replaced by course lists
 */
export function expandElectiveCategories(courseOptions: string[]): string[] {
  const expanded: string[] = []
  
  for (const option of courseOptions) {
    if (ELECTIVE_CATEGORIES[option]) {
      // This is a category - expand it
      expanded.push(...ELECTIVE_CATEGORIES[option])
    } else {
      // This is a regular course code
      expanded.push(option)
    }
  }
  
  return [...new Set(expanded)] // Remove duplicates
}

/**
 * Check if a course satisfies an elective category
 */
export function courseMatchesCategory(courseId: string, category: string): boolean {
  const courses = ELECTIVE_CATEGORIES[category]
  if (!courses) return false
  return courses.includes(courseId)
}
