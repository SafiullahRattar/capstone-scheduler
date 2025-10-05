#!/usr/bin/env python3

import os
import re
import json
import glob
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimplePrerequisiteParser:
    def __init__(self):
        # Course code pattern (4 letters + 4 digits)
        self.course_pattern = r'[A-Z]{4}\s*\d{4}'
        
        # Year standing patterns
        self.year_patterns = {
            'first': r'first[- ]year\s+status|1st\s+year\s+status',
            'second': r'second[- ]year\s+status|2nd\s+year\s+status', 
            'third': r'third[- ]year\s+status|3rd\s+year\s+status',
            'fourth': r'fourth[- ]year\s+status|4th\s+year\s+status',
            'fifth': r'fifth[- ]year\s+status|5th\s+year\s+status'
        }

    def extract_course_codes(self, text):
        """Extract all course codes from text."""
        matches = re.findall(self.course_pattern, text, re.IGNORECASE)
        return [match.replace(' ', '').replace('\xa0', '').upper() for match in matches]

    def parse_year_standing(self, text):
        """Parse year standing requirements."""
        text_lower = text.lower()
        
        # Check standard patterns
        for year, pattern in self.year_patterns.items():
            if re.search(pattern, text_lower):
                return f"{year.upper()}_YEAR"
        
        # Check for program-specific year standing patterns
        program_year_patterns = [
            r'second[- ]year\s+standing\s+in\s+[^,.]+'
        ]
        
        for pattern in program_year_patterns:
            if re.search(pattern, text_lower):
                return "SECOND_YEAR"  # Simplify to just the year level
        
        return None

    def parse_grade_requirements(self, text):
        """Parse minimum grade requirements."""
        grade_pattern = r'with\s+a\s+minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)'
        matches = re.findall(grade_pattern, text, re.IGNORECASE)
        return matches

    def parse_program_restrictions(self, text):
        """Parse program registration requirements."""
        text_lower = text.lower()
        
        program_patterns = [
            (r'registration\s+in\s+the\s+bachelor\s+of\s+architectural\s+studies\s*\(\s*bas\s*\)', 'BAS'),
            (r'registration\s+in\s+.*?\s*\(\s*([A-Z]+)\s*\)', None),  # Generic pattern
            (r'bachelor\s+of\s+architectural\s+studies', 'BAS'),
        ]
        
        for pattern, program_code in program_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if program_code:
                    return f"PROGRAM_{program_code}"
                elif match.groups():
                    # Extract program code from parentheses
                    code = match.group(1).upper()
                    return f"PROGRAM_{code}"
        
        return None

    def parse_high_school_prerequisites(self, text):
        """Parse high school level prerequisites."""
        text_lower = text.lower()
        
        high_school_patterns = [
            r'ontario\s+4u/m',
            r'grade\s+12',
            r'secondary\s+school',
            r'high\s+school'
        ]
        
        for pattern in high_school_patterns:
            if re.search(pattern, text_lower):
                return "HIGH_SCHOOL_REQUIREMENT"
        
        return None

    def parse_permissions(self, text):
        """Check for permission requirements."""
        permission_patterns = [
            r'permission\s+of\s+the\s+department',
            r'permission\s+of\s+the\s+school',
            r'permission\s+of\s+department',
            r'departmental\s+permission',
            r'instructor[\'s]?\s+permission'
        ]
        
        text_lower = text.lower()
        for pattern in permission_patterns:
            if re.search(pattern, text_lower):
                return True
        return False


    
    def has_completion_or_concurrent_pattern(self, text):
        """Check if text has 'completion of, or concurrent registration in' pattern."""
        text_lower = text.lower()
        patterns = [
            r'completion\s+of,\s+or\s+concurrent\s+registration\s+in',
            r'completion\s+of\s+or\s+concurrent\s+registration\s+in'
        ]
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return True
        return False
    
    def parse_completion_or_concurrent(self, text):
        """Parse 'completion of or concurrent registration in' requirements."""
        text_lower = text.lower()
        
        patterns = [
            r'completion\s+of,\s+or\s+concurrent\s+registration\s+in,?\s*([^)]+?)(?:,\s*or\s+permission)',
            r'completion\s+of\s+or\s+concurrent\s+registration\s+in\s+([^)]+?)(?:,\s*or\s+permission)',
            r'completion\s+of,\s+or\s+concurrent\s+registration\s+in,?\s*([^)]+)',
            r'completion\s+of\s+or\s+concurrent\s+registration\s+in\s+([^)]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                course_text = match.group(1)
                # Handle the format "AERO 4003, AERO 4842, ... or SREE 4001"
                courses = self.extract_course_codes(course_text)
                return courses
        
        return []

    def parse_exclusions(self, text):
        """Parse exclusion/restriction requirements."""
        exclusions = []
        
        exclusion_patterns = [
            r'not\s+open\s+to\s+students\s+in\s+([^.]+)',
            r'not\s+available\s+to\s+([^.]+)',
            r'excludes\s+([^.]+)'
        ]
        
        for pattern in exclusion_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            exclusions.extend(matches)
        
        return [ex.strip() for ex in exclusions]

    def simplify_prerequisites(self, prereq_text):
        """Convert prerequisite text to simple logical expression."""
        if not prereq_text or 'prerequisite' not in prereq_text.lower():
            return None
        
        # Extract the actual prerequisite content
        prereq_match = re.search(r'prerequisite\(s\):\s*(.+?)(?:\.|$)', prereq_text, re.IGNORECASE | re.DOTALL)
        if not prereq_match:
            return None
        
        content = prereq_match.group(1).strip()
        
        # Handle special cases first
        year_req = self.parse_year_standing(content)
        permission_req = self.parse_permissions(content)
        high_school_req = self.parse_high_school_prerequisites(content)
        program_req = self.parse_program_restrictions(content)
        
        # Extract courses and grade requirements
        courses = self.extract_course_codes(content)
        grade_requirements = self.parse_grade_requirements(content)
        
        # Handle special case: "completion of, or concurrent registration in"
        completion_or_concurrent_courses = []
        if self.has_completion_or_concurrent_pattern(content):
            completion_or_concurrent_courses = self.parse_completion_or_concurrent(content)
            # Add these courses to the main course list (treat concurrent as regular prerequisites)
            courses.extend(completion_or_concurrent_courses)
            courses = list(set(courses))  # Remove duplicates
        
        # No longer handling concurrent courses - treat as regular prerequisites
        
        # Build simple expression
        components = []
        
        # Add courses with improved logic detection and grade requirements
        if courses:
            if len(courses) == 1:
                course_with_grade = self.add_grade_to_course(courses[0], content, grade_requirements)
                components.append(course_with_grade)
            else:
                # Better logic detection based on parentheses and keywords
                course_expr = self.parse_course_logic_with_grades(content, courses, grade_requirements)
                components.append(course_expr)
        
        # Add year requirement
        if year_req:
            components.append(year_req)
        
        # Add permission requirement
        if permission_req:
            components.append("PERMISSION")
        
        # Add high school requirement
        if high_school_req:
            components.append(high_school_req)
        
        # Add program requirement
        if program_req:
            components.append(program_req)
        
        # Handle special case: "; or permission" makes permission an OR alternative
        if permission_req and '; or permission' in content.lower():
            # Permission is an OR alternative to all other requirements
            non_permission_components = [c for c in components if c != "PERMISSION"]
            if len(non_permission_components) > 1:
                base_requirements = ' && '.join(non_permission_components)
                result = f"({base_requirements}) || PERMISSION"
            elif len(non_permission_components) == 1:
                # If the component contains &&, wrap it for proper precedence with OR
                single_component = non_permission_components[0]
                if '&&' in single_component:
                    result = f"({single_component}) || PERMISSION"
                else:
                    result = f"{single_component} || PERMISSION"
            else:
                result = "PERMISSION"
            return self.ensure_proper_precedence(result)
        
        # Join with AND if multiple components (standard case)
        if len(components) > 1:
            result = ' && '.join(components)
            return self.ensure_proper_precedence(result)
        elif len(components) == 1:
            return self.ensure_proper_precedence(components[0])
        else:
            return "OTHER_REQUIREMENT"

    def parse_course_logic(self, content, courses):
        """Parse course logic more intelligently."""
        content_lower = content.lower()
        
        # Handle explicit parenthetical groups connected by AND
        # Pattern: (A or B) and (C or D) or (X or Y) and Z
        if '(' in content and ')' in content:
            # Extract groups with parentheses and handle logic between them
            return self.parse_grouped_logic(content, courses)
        
        # Handle simple cases without parentheses
        if ' or ' in content_lower and ' and ' in content_lower:
            # Mixed logic without clear grouping - use heuristics
            return self.parse_mixed_logic(content, courses)
        elif ' or ' in content_lower and not ' and ' in content_lower:
            # All OR - check if commas are part of OR sequence
            if ',' in content and re.search(r',\s+or\s+', content_lower):
                # Pattern like "A, or B, or C" - all OR
                return ' || '.join(courses)
            else:
                # Standard OR
                return ' || '.join(courses)
        elif ' and ' in content_lower and not ' or ' in content_lower:
            # All AND  
            return ' && '.join(courses)
        elif ',' in content and ' or ' not in content_lower:
            # Comma-separated usually means AND
            return ' && '.join(courses)
        else:
            # Default fallback - check for semicolon-separated groups
            if ';' in content:
                return self.parse_mixed_logic(content, courses)
            return ' && '.join(courses) if len(courses) > 1 else courses[0]
    
    def parse_grouped_logic(self, content, courses):
        """Parse parenthetical groups connected by logical operators."""
        content_clean = content.lower()
        
        # Find all parenthetical groups that contain course codes
        groups = re.findall(r'\(([^)]+)\)', content)
        
        parsed_groups = []
        used_courses = set()
        has_course_groups = False
        
        for group in groups:
            group_courses = self.extract_course_codes(group)
            if group_courses:
                has_course_groups = True
                used_courses.update(group_courses)
                if len(group_courses) > 1 and ' or ' in group.lower():
                    parsed_groups.append(f"({' || '.join(group_courses)})")
                else:
                    parsed_groups.append(' && '.join(group_courses))
        
        # If no parenthetical groups contain courses, fall back to mixed logic parsing
        if not has_course_groups:
            return self.parse_mixed_logic(content, courses)
        
        # Handle any remaining courses not in parentheses
        remaining_courses = [c for c in courses if c not in used_courses]
        if remaining_courses:
            parsed_groups.extend(remaining_courses)
        
        # Connect groups based on the logic between them
        if len(parsed_groups) > 1:
            # Check if there are explicit ANDs between groups
            if ' and ' in content_clean:
                return ' && '.join(parsed_groups)
            else:
                # Default to AND for multiple groups
                return ' && '.join(parsed_groups)
        elif len(parsed_groups) == 1:
            return parsed_groups[0]
        else:
            return ' && '.join(courses)
    
    def add_grade_to_course(self, course, content, grade_requirements):
        """Add grade requirement to a course if present."""
        # Look for grade requirement associated with this course directly in content
        course_pattern = course.replace('SYSC', 'SYSC\\s*').replace('COMP', 'COMP\\s*').replace('ELEC', 'ELEC\\s*').replace('MATH', 'MATH\\s*').replace('PHYS', 'PHYS\\s*')
        
        # Multiple patterns for different grade requirement formats
        grade_patterns = [
            rf'{course_pattern}[^,;]*?with\s+a\s+minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)',
            rf'{course_pattern}[^,;]*?with\s+a\s+grade\s+of\s+([A-F][+-]?|\d+%?)',
            rf'{course_pattern}[^,;]*?minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)'
        ]
        
        for grade_pattern in grade_patterns:
            match = re.search(grade_pattern, content, re.IGNORECASE)
            if match:
                grade = match.group(1)
                return f"{course}[{grade}]"
        
        return course
    
    def parse_course_logic_with_grades(self, content, courses, grade_requirements):
        """Parse course logic and incorporate grade requirements."""
        # First get the basic logic structure
        base_logic = self.parse_course_logic(content, courses)
        
        # Apply grade requirements to individual courses (check content directly)
        enhanced_logic = base_logic
        for course in courses:
            course_with_grade = self.add_grade_to_course(course, content, grade_requirements)
            if course_with_grade != course:
                enhanced_logic = enhanced_logic.replace(course, course_with_grade)
        
        return enhanced_logic

    def parse_mixed_logic(self, content, courses):
        """Handle mixed AND/OR logic without clear parentheses."""
        content_lower = content.lower()
        
        # Handle semicolon-separated groups first (like PHYS1002)
        if ';' in content_lower:
            # Split by semicolons - each part is usually an AND group
            parts = [part.strip() for part in content_lower.split(';')]
            parsed_parts = []
            
            for part in parts:
                # Skip permission-only parts
                if 'permission' in part and not any(course in part for course in [c.lower() for c in courses]):
                    continue
                    
                part_courses = self.extract_course_codes(part)
                if part_courses:
                    # Check if this part has OR logic
                    if ' or ' in part:
                        # Handle comma-or patterns like "A, or B, or C"
                        if re.search(r',\s+or\s+', part):
                            parsed_parts.append(f"({' || '.join(part_courses)})")
                        elif len(part_courses) > 1:
                            parsed_parts.append(f"({' || '.join(part_courses)})")
                        else:
                            parsed_parts.append(part_courses[0])
                    elif len(part_courses) == 1:
                        parsed_parts.append(part_courses[0])
                    else:
                        # Multiple courses without explicit OR - assume AND within part
                        parsed_parts.append(' && '.join(part_courses))
            
            return ' && '.join(parsed_parts) if parsed_parts else ' && '.join(courses)
        
        # Original comma-based logic for non-semicolon cases
        # First, check if we have a sequence like "A or B or C, and X"
        # Split by comma and 'and' pattern to isolate OR groups  
        parts = re.split(r',\s*and\s+|,\s*', content_lower)
        
        if len(parts) > 1:
            parsed_parts = []
            courses_used = set()
            
            for part in parts:
                part_courses = self.extract_course_codes(part)
                if part_courses:
                    courses_used.update(part_courses)
                    # Check if this part has OR logic
                    if len(part_courses) > 1 and ' or ' in part:
                        parsed_parts.append(f"({' || '.join(part_courses)})")
                    elif len(part_courses) == 1:
                        parsed_parts.append(part_courses[0])
                    else:
                        # Multiple courses without explicit OR - assume AND within part
                        parsed_parts.append(' && '.join(part_courses))
            
            # Handle any courses not captured
            remaining = [c for c in courses if c not in courses_used]
            parsed_parts.extend(remaining)
            
            return ' && '.join(parsed_parts) 
        
        # Split by 'and' to find OR groups
        and_parts = re.split(r'\s+and\s+', content_lower)
        
        if len(and_parts) > 1:
            # Multiple AND parts - each part might have OR logic
            parsed_parts = []
            courses_used = set()
            
            for part in and_parts:
                part_courses = self.extract_course_codes(part)
                if part_courses:
                    courses_used.update(part_courses)
                    if len(part_courses) > 1 and ' or ' in part:
                        parsed_parts.append(f"({' || '.join(part_courses)})")
                    else:
                        parsed_parts.extend(part_courses)
            
            # Add any courses not captured in parts
            remaining = [c for c in courses if c not in courses_used]
            parsed_parts.extend(remaining)
            
            return ' && '.join(parsed_parts)
        
        # Check if it's a simple OR sequence
        if ' or ' in content_lower and content_lower.count(' or ') >= len(courses) - 1:
            return ' || '.join(courses)
        
        # Fallback for unclear mixed logic
        return f"({' || '.join(courses)})"
    
    def ensure_proper_precedence(self, expression):
        """Ensure proper logical precedence by wrapping OR groups when followed by AND."""
        if not expression or '||' not in expression or '&&' not in expression:
            return expression
        
        # If expression already has proper parenthesization (starts with ( and has balanced parens), don't modify
        if expression.startswith('(') and self.has_balanced_parentheses(expression):
            # Check if the main structure is already properly grouped
            return expression
        
        # If we have a mix of || and && without proper grouping, wrap OR sequences
        # Pattern: A || B || C && D should become (A || B || C) && D
        parts = expression.split(' && ')
        
        if len(parts) > 1:
            # Check each part - if it contains || and isn't already wrapped, wrap it
            processed_parts = []
            for part in parts:
                part = part.strip()
                if '||' in part and not (part.startswith('(') and part.endswith(')')):
                    processed_parts.append(f"({part})")
                else:
                    processed_parts.append(part)
            
            return ' && '.join(processed_parts)
        
        return expression
    
    def has_balanced_parentheses(self, expression):
        """Check if parentheses are balanced in the expression."""
        count = 0
        for char in expression:
            if char == '(':
                count += 1
            elif char == ')':
                count -= 1
            if count < 0:
                return False
        return count == 0

    def parse_course_file(self, html_file):
        """Parse a single course HTML file."""
        try:
            # Extract course code from filename
            filename = os.path.basename(html_file)
            course_code = filename.replace('.html', '').upper()
            
            # Read and parse HTML
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract text from HTML
            soup = BeautifulSoup(content, 'html.parser')
            text_content = soup.get_text()
            
            # Parse components
            prerequisites = self.simplify_prerequisites(text_content)
            exclusions = self.parse_exclusions(text_content)
            
            # Create simple course data
            course_data = {
                'course': course_code,
                'required': prerequisites,
                'restricted': exclusions
            }
            
            return course_data
            
        except Exception as e:
            logger.error(f"✗ Error parsing {html_file}: {e}")
            return None

    def parse_all_courses(self, courses_dir="courses"):
        """Parse all course files and return simple dataset."""
        html_files = glob.glob(f"{courses_dir}/**/*.html", recursive=True)
        
        if not html_files:
            logger.error(f"No HTML files found in {courses_dir}/ directory")
            return {}
        
        logger.info(f"Found {len(html_files)} HTML files to parse")
        
        all_courses = {}
        successful = 0
        failed = 0
        
        # Process files in parallel
        with ThreadPoolExecutor(max_workers=20) as executor:
            future_to_file = {executor.submit(self.parse_course_file, html_file): html_file 
                            for html_file in html_files}
            
            for future in as_completed(future_to_file):
                html_file = future_to_file[future]
                try:
                    course_data = future.result()
                    if course_data:
                        all_courses[course_data['course']] = {
                            'required': course_data['required'],
                            'restricted': course_data['restricted']
                        }
                        successful += 1
                    else:
                        failed += 1
                except Exception as exc:
                    logger.error(f'File {html_file} generated an exception: {exc}')
                    failed += 1
        
        logger.info(f"Parsing complete! Successful: {successful}, Failed: {failed}")
        return all_courses

def main():
    """Main function to run the parser."""
    parser = SimplePrerequisiteParser()
    
    # Parse all courses
    all_courses = parser.parse_all_courses()
    
    # Save to JSON file
    output_file = "course_prerequisites_simple.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_courses, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Results saved to {output_file}")
    
    # Print some examples
    print(f"\n=== SAMPLE COURSES ===")
    count = 0
    for course_code, data in all_courses.items():
        if data['required'] and count < 10:  # Show first 10 courses with requirements
            print(f"{course_code}:")
            print(f"  required: {data['required']}")
            if data['restricted']:
                print(f"  restricted: {data['restricted']}")
            print()
            count += 1
    
    # Print statistics
    total_courses = len(all_courses)
    courses_with_reqs = sum(1 for course in all_courses.values() if course['required'])
    courses_with_restrictions = sum(1 for course in all_courses.values() if course['restricted'])
    
    print(f"=== STATISTICS ===")
    print(f"Total courses: {total_courses}")
    print(f"Courses with requirements: {courses_with_reqs}")
    print(f"Courses with restrictions: {courses_with_restrictions}")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    main()