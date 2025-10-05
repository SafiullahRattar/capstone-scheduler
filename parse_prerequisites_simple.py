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
            'first': r'first[- ]year\s+(status|standing)|1st\s+year\s+(status|standing)',
            'second': r'second[- ]year\s+(status|standing)|2nd\s+year\s+(status|standing)', 
            'third': r'third[- ]year\s+(status|standing)|3rd\s+year\s+(status|standing)',
            'fourth': r'fourth[- ]year\s+(status|standing)|4th\s+year\s+(status|standing)',
            'fifth': r'fifth[- ]year\s+(status|standing)|5th\s+year\s+(status|standing)'
        }

    def extract_course_codes(self, text):
        """Extract course codes from text."""
        matches = re.findall(self.course_pattern, text, re.IGNORECASE)
        courses = [match.replace(' ', '').replace('\xa0', '').upper() for match in matches]
        # Remove duplicates while preserving order
        seen = set()
        unique_courses = []
        for course in courses:
            if course not in seen:
                seen.add(course)
                unique_courses.append(course)
        return unique_courses

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

    def parse_complex_year_standing(self, text):
        """Parse complex year standing expressions with logic."""
        text_lower = text.lower()
        
        # Special case for ECOR3800 pattern: "third-year status ... or (second-year status ... and permission ...)"
        ecor_pattern = r'third[- ]year\s+status.*?\s+or\s+\(second[- ]year\s+status.*?\s+and\s+permission'
        if re.search(ecor_pattern, text_lower):
            return "THIRD_YEAR || (SECOND_YEAR && PERMISSION)"
        
        # Could add more complex year standing patterns here in the future
        
        return None

    def parse_grade_requirements(self, text):
        """Parse minimum grade requirements."""
        # Handle HTML tags around grades like <span class="keeptogether">C-</span>
        grade_pattern = r'with\s+a\s+minimum\s+grade\s+of\s+(?:<[^>]*>)?([A-F][+-]?|\d+%?)(?:</[^>]*>)?'
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

    def has_negative_constraint(self, content):
        """Check if content contains negative constraints that should be ignored."""
        content_lower = content.lower()
        negative_patterns = [
            r'may\s+not\s+be\s+taken\s+concurrently',
            r'cannot\s+be\s+taken\s+concurrently',
            r'not\s+open\s+to\s+students',
            r'precludes\s+additional\s+credit',
            r'excludes\s+students'
        ]
        
        for pattern in negative_patterns:
            if re.search(pattern, content_lower):
                return True
        return False

    def filter_out_negative_constraints(self, content):
        """Remove negative constraint text from content."""
        # Remove "may not be taken concurrently" and similar phrases
        content_lower = content.lower()
        
        # Pattern to match entire negative constraint phrases
        negative_patterns = [
            r'this\s+course\s+may\s+not\s+be\s+taken\s+concurrently\s+with[^.]*',
            r'may\s+not\s+be\s+taken\s+concurrently\s+with[^.]*',
            r'cannot\s+be\s+taken\s+concurrently\s+with[^.]*',
            r'not\s+open\s+to\s+students[^.]*',
            r'precludes\s+additional\s+credit[^.]*',
            r'excludes\s+students[^.]*'
        ]
        
        filtered_content = content
        for pattern in negative_patterns:
            filtered_content = re.sub(pattern, '', filtered_content, flags=re.IGNORECASE)
        
        # Clean up extra whitespace and punctuation
        filtered_content = re.sub(r'\s*[,;]\s*$', '', filtered_content.strip())
        filtered_content = re.sub(r'\s+', ' ', filtered_content)
        
        return filtered_content
    
    def filter_out_recommended_content(self, content):
        """Remove recommended/additional background content."""
        # Pattern to match "Additional recommended background:" and everything after
        recommended_pattern = r'[.;]\s*additional\s+recommended\s+background:[^.]*'
        filtered_content = re.sub(recommended_pattern, '', content, flags=re.IGNORECASE)
        
        # Pattern to match "recommended:" and everything after
        recommended_pattern2 = r'[.;]\s*recommended:[^.]*'
        filtered_content = re.sub(recommended_pattern2, '', filtered_content, flags=re.IGNORECASE)
        
        return filtered_content.strip().strip()
    
    def filter_out_graduate_level_content(self, content):
        """Remove 'Also offered at the graduate level' content and similar non-prerequisite mentions."""
        # Pattern to match "Also offered at the graduate level" and everything after until period
        graduate_level_patterns = [
            r'also\s+offered\s+at\s+the\s+graduate\s+level[^.]*\.',
            r'offered\s+at\s+the\s+graduate\s+level[^.]*\.',
            r'cross-listed\s+with[^.]*\.',
            r'cross\s+listed\s+with[^.]*\.'
        ]
        
        filtered_content = content
        for pattern in graduate_level_patterns:
            filtered_content = re.sub(pattern, '', filtered_content, flags=re.IGNORECASE)
        
        return filtered_content.strip()

    def simplify_prerequisites(self, prereq_text):
        """Convert prerequisite text to simple logical expression."""
        if not prereq_text or 'prerequisite' not in prereq_text.lower():
            return None
        
        # Extract the actual prerequisite content
        # Look for the prerequisite section and capture everything until </p> tag or sentence end
        prereq_match = re.search(r'prerequisite\(s\):\s*(.+?)(?:</p>|\.\s*</p>|$)', prereq_text, re.IGNORECASE | re.DOTALL)
        if not prereq_match:
            return None
        
        content = prereq_match.group(1).strip()
        
        # Filter out negative constraints first
        content = self.filter_out_negative_constraints(content)
        
        # Filter out recommended background/additional content
        content = self.filter_out_recommended_content(content)
        
        # Filter out graduate level content and cross-listings
        content = self.filter_out_graduate_level_content(content)
        
        # If content is empty after filtering, return None
        if not content.strip():
            return None
        
        # Handle special cases first
        # Check for complex year standing expressions first (they take precedence)
        complex_year_req = self.parse_complex_year_standing(content)
        if complex_year_req:
            return complex_year_req
            
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
        
        # Build simple expression
        components = []
        
        # Check for OR relationship between high school requirements and courses
        has_high_school_or_course = (high_school_req and courses and 
                                   re.search(r'(ontario\s+4u/m.*?\s+or\s+.*?|.*?\s+or\s+ontario\s+4u/m)', 
                                           content.lower()))
        
        # Check for OR relationship between year requirements and courses  
        has_year_or_course = (year_req and courses and 
                            re.search(r'(year.*?status.*?\s+or\s+\(.*?|.*?\s+or\s+\(.*?year.*?status)', 
                                    content.lower()))
        
        if has_high_school_or_course:
            # High school requirement and courses are in OR relationship
            if len(courses) == 1:
                course_with_grade = self.add_grade_to_course(courses[0], content, grade_requirements)
                components.append(f"{high_school_req} || {course_with_grade}")
            else:
                course_expr = self.parse_course_logic_with_grades(content, courses, grade_requirements)
                components.append(f"{high_school_req} || {course_expr}")
        elif has_year_or_course:
            # Year requirement and courses are in OR relationship
            if len(courses) == 1:
                course_with_grade = self.add_grade_to_course(courses[0], content, grade_requirements)
                components.append(f"{year_req} || {course_with_grade}")
            else:
                course_expr = self.parse_course_logic_with_grades(content, courses, grade_requirements)
                components.append(f"{year_req} || {course_expr}")
        else:
            # Standard separate processing
            # Add courses with improved logic detection and grade requirements
            if courses:
                if len(courses) == 1:
                    course_with_grade = self.add_grade_to_course(courses[0], content, grade_requirements)
                    components.append(course_with_grade)
                else:
                    # Better logic detection based on parentheses and keywords
                    course_expr = self.parse_course_logic_with_grades(content, courses, grade_requirements)
                    components.append(course_expr)
            
            # Add high school requirement
            if high_school_req:
                components.append(high_school_req)
        
        # Add year requirement (if not already handled in OR relationship or within parenthetical groups)
        year_in_parentheses = False
        if year_req:
            # Check if year requirement appears within parentheses
            paren_groups = re.findall(r'\(([^)]+)\)', content)
            for group in paren_groups:
                if self.parse_year_standing(group):
                    year_in_parentheses = True
                    break
        
        # Check if year requirement is already included in course expressions
        year_already_in_expression = False
        if year_req and components:
            for component in components:
                if year_req in component:
                    year_already_in_expression = True
                    break
        
        if year_req and not has_year_or_course and not year_in_parentheses and not year_already_in_expression:
            components.append(year_req)
        
        # Add program requirement
        if program_req:
            components.append(program_req)
        
        # Check for various "or permission" patterns - these should make permission an OR alternative
        permission_or_patterns = [
            r';\s*or\s+permission',
            r',\s*or\s+permission',
            r'\s+or\s+permission\s+of\s+the\s+department',
            r'\s+or\s+permission\s+of\s+the\s+school',
            r'\s+or\s+by\s+permission',
            r'\s+or\s+departmental\s+permission'
        ]
        
        permission_is_or = False
        for pattern in permission_or_patterns:
            if re.search(pattern, content.lower()):
                permission_is_or = True
                break
        
        # Handle permission logic
        if permission_req and permission_is_or:
            # Permission is an OR alternative to all other requirements
            non_permission_components = [c for c in components if c != "PERMISSION"]
            if len(non_permission_components) > 1:
                base_requirements = ' && '.join(non_permission_components)
                result = f"({base_requirements}) || PERMISSION"
            elif len(non_permission_components) == 1:
                single_component = non_permission_components[0]
                if '&&' in single_component and not (single_component.startswith('(') and single_component.endswith(')')):
                    result = f"({single_component}) || PERMISSION"
                else:
                    result = f"{single_component} || PERMISSION"
            else:
                result = "PERMISSION"
            return self.ensure_proper_precedence(result)
        elif permission_req:
            # Permission is an AND requirement (traditional case)
            components.append("PERMISSION")
        
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
        # Clean HTML tags first to get accurate logic detection
        clean_content = re.sub(r'<[^>]+>', '', content)
        clean_content = re.sub(r'\s+', ' ', clean_content).strip()
        content_lower = clean_content.lower()
        
        # Special case: Simple OR pattern like "A or B" without AND
        # Remove restrictive len(courses) == 2 condition to handle all simple OR cases
        if ' or ' in content_lower and ' and ' not in content_lower and ';' not in content_lower:
            # Count actual 'or' occurrences to ensure it's truly simple OR
            or_count = len(re.findall(r'\bor\b', content_lower))
            # If we have 'or' keywords and no complex structure, treat as all OR
            if or_count > 0 and not re.search(r'[;,]\s*[^,]*\bor\b', content_lower):
                return ' || '.join(courses)
        
        # Handle semicolon-separated groups first (highest priority)
        if ';' in clean_content:
            return self.parse_mixed_logic(content, courses)
        
        # Special case: "either X or (Y and Z)" pattern or "X or (Y and Z)" pattern
        if re.search(r'(either\s+.*?\s+or\s+\(|[a-z]{4}\s+\d{4}.*?\s+or\s+\()', content_lower):
            return self.parse_either_or_pattern(content, courses)
        
        # Handle explicit parenthetical groups connected by AND
        # Pattern: (A or B) and (C or D) or (X or Y) and Z
        if '(' in clean_content and ')' in clean_content:
            # Extract groups with parentheses and handle logic between them
            return self.parse_grouped_logic(clean_content, courses)
        
        # Handle simple cases without parentheses
        if ' or ' in content_lower and ' and ' in content_lower:
            # Mixed logic without clear grouping - use heuristics
            return self.parse_mixed_logic(content, courses)
        elif ' or ' in content_lower and not ' and ' in content_lower:
            # All OR - check if commas are part of OR sequence
            if ',' in content and re.search(r',\s+or\s+', content_lower):
                # Pattern like "CHEM 1006, CHEM 1002, or CHEM 1012" - all OR
                return ' || '.join(courses)
            elif len(courses) > 1 and re.search(r'\bor\b', content_lower):
                # Multiple courses with 'or' keyword - all OR
                return ' || '.join(courses)
            else:
                # Standard OR
                return ' || '.join(courses)
        elif ' and ' in content_lower and not ' or ' in content_lower:
            # All AND  
            return ' && '.join(courses)
        elif ',' in content and ' or ' not in content_lower:
            # Comma-separated usually means AND, but check for list patterns
            # Pattern like "BIOL 1003, BIOL 1104" without 'and' is typically AND
            return ' && '.join(courses)
        else:
            # Default fallback
            if len(courses) > 1:
                # Multiple courses without clear connectors - check context
                # If it's a chemistry prerequisite pattern like "CHEM 1006 or CHEM 1002 or CHEM 1012"
                # Look for repetitive course prefixes which usually indicate OR
                course_prefixes = [course[:4] for course in courses]  # Get MATH, CHEM, etc.
                if len(set(course_prefixes)) == 1 and len(courses) > 2:
                    # Same subject, multiple courses - likely OR alternatives
                    return ' || '.join(courses)
                else:
                    return ' && '.join(courses)
            else:
                return courses[0] if courses else ""
    
    def parse_either_or_pattern(self, content, courses):
        """Handle 'either X or (Y and Z)' and 'X or (Y and Z)' patterns."""
        # Strip HTML tags first to avoid issues with quotes in HTML attributes
        clean_content = re.sub(r'<[^>]+>', '', content)
        content_lower = clean_content.lower()
        
        # Pattern 1: Simple "X or (Y and Z)" should be X || (Y && Z)  
        simple_or_match = re.search(r'([a-z]{4}\s+\d{4}[^,]*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
        if simple_or_match and 'either' not in content_lower:
            # Extract the single course before "or"
            before_or = simple_or_match.group(1).strip()
            before_courses = self.extract_course_codes(before_or)
            
            # Extract courses from the parenthetical part
            paren_part = simple_or_match.group(2).strip()  
            paren_courses = self.extract_course_codes(paren_part)
            
            if before_courses and paren_courses:
                # Apply grades to all courses found in content
                grade_requirements = self.parse_grade_requirements(content)
                
                # Build: single_course || (paren_courses with AND logic)
                single_course = before_courses[0]
                single_course_with_grade = self.add_grade_to_course(single_course, content, grade_requirements)
                
                if len(paren_courses) == 1:
                    paren_course_with_grade = self.add_grade_to_course(paren_courses[0], content, grade_requirements)
                    return f"{single_course_with_grade} || {paren_course_with_grade}"
                else:
                    # Multiple courses in parentheses - use AND logic
                    paren_with_grades = [self.add_grade_to_course(course, content, grade_requirements) for course in paren_courses]
                    paren_expr = ' && '.join(paren_with_grades)
                    return f"{single_course_with_grade} || ({paren_expr})"
        
        # Pattern 2: "A, and either B or (C and D)" should be A && (B || (C && D))
        either_match = re.search(r'and\s+either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
        if either_match:
            # Extract courses from the "either" part (between "either" and "or")
            either_part = either_match.group(1).strip()
            either_courses = self.extract_course_codes(either_part)
            
            # Extract courses from the parenthetical part  
            paren_part = either_match.group(2).strip()
            paren_courses = self.extract_course_codes(paren_part)
            
            # Find courses that come BEFORE the "either" (these are AND requirements)
            # Handle case where courses may already have grades applied
            before_either_courses = []
            for course in courses:
                # Extract base course code (remove grade if present)
                base_course = re.sub(r'\[.*?\]', '', course)
                if base_course not in either_courses and base_course not in paren_courses:
                    before_either_courses.append(course)
            
            if either_courses and paren_courses:
                # Build the expression: before_courses && (either_course || (paren_courses))
                components = []
                
                # Add courses that come before "either" (may already have grades)
                for course in before_either_courses:
                    # Only add grade if course doesn't already have one
                    if '[' in course and ']' in course:
                        components.append(course)  # Already has grade
                    else:
                        course_with_grade = self.add_grade_to_course(course, content, [])
                        components.append(course_with_grade)
                
                # Build the either-or choice (these are extracted from clean content, so no grades yet)
                either_with_grades = [self.add_grade_to_course(c, content, []) for c in either_courses]
                paren_with_grades = [self.add_grade_to_course(c, content, []) for c in paren_courses]
                
                # Either part (single course or AND of multiple)
                if len(either_with_grades) == 1:
                    either_expr = either_with_grades[0]
                else:
                    either_expr = f"({' && '.join(either_with_grades)})"
                
                # Parenthetical part (check for "and" to determine logic)
                if ' and ' in paren_part:
                    paren_expr = f"({' && '.join(paren_with_grades)})"
                else:
                    paren_expr = f"({' || '.join(paren_with_grades)})"
                
                # Combine either-or choice
                choice_expr = f"({either_expr} || {paren_expr})"
                components.append(choice_expr)
                
                return ' && '.join(components)
        
        # Fallback to regular mixed logic
        return self.parse_mixed_logic(content, courses)
    
    def parse_grouped_logic(self, content, courses):
        """Parse parenthetical groups connected by logical operators."""
        content_clean = content.lower()
        
        # Special handling for comma-separated AND pattern with mixed OR groups
        # Pattern: "X or Y, Z (or W), and Q" where commas indicate AND between groups
        if ',' in content and 'and' in content_clean and '(' in content:
            # Split by commas to identify AND components
            comma_parts = [part.strip() for part in content.split(',')]
            parsed_components = []
            
            for i, part in enumerate(comma_parts):
                # Remove leading "and" from parts
                part = re.sub(r'^\s*and\s+', '', part, flags=re.IGNORECASE)
                
                # Check if this part has a parenthetical OR structure
                paren_match = re.search(r'([A-Z]{4}\s+\d{4})\s*\(\s*or\s+([A-Z]{4}\s+\d{4})\s*\)', part, re.IGNORECASE)
                if paren_match:
                    # Pattern like "PHYS 3606 (or PHYS 3608)"
                    course1 = self.extract_course_codes(paren_match.group(1))[0]
                    course2 = self.extract_course_codes(paren_match.group(2))[0]
                    parsed_components.append(f"({course1} || {course2})")
                else:
                    part_courses = self.extract_course_codes(part)
                    if part_courses:
                        if ' or ' in part.lower() and len(part_courses) > 1:
                            # OR within this comma-separated part
                            parsed_components.append(f"({' || '.join(part_courses)})")
                        elif len(part_courses) == 1:
                            # Single course
                            parsed_components.append(part_courses[0])
                        else:
                            # Multiple courses without explicit OR - treat as individual AND components
                            parsed_components.extend(part_courses)
            
            if len(parsed_components) > 1:
                return ' && '.join(parsed_components)
            elif len(parsed_components) == 1:
                return parsed_components[0]
        
        # Find all parenthetical groups that contain course codes
        groups = re.findall(r'\(([^)]+)\)', content)
        
        parsed_groups = []
        used_courses = set()
        has_course_groups = False
        
        for group in groups:
            group_courses = self.extract_course_codes(group)
            group_year = self.parse_year_standing(group)  # Check if group contains year requirement
            
            if group_courses or group_year:
                has_course_groups = True
                if group_courses:
                    used_courses.update(group_courses)
                group_lower = group.lower()
                
                # Handle groups with both courses and year requirements
                if group_courses and group_year and ' or ' in group_lower:
                    # Mix of courses and year requirement in OR relationship
                    all_components = group_courses + [group_year]
                    parsed_groups.append(f"({' || '.join(all_components)})")
                elif len(group_courses) > 1:
                    if ' or ' in group_lower:
                        # Explicit OR in group
                        parsed_groups.append(f"({' || '.join(group_courses)})")
                    elif ' and ' in group_lower:
                        # Explicit AND in group
                        parsed_groups.append(f"({' && '.join(group_courses)})")
                    else:
                        # No explicit connector - check if same subject (OR) or different (AND)
                        course_prefixes = [course[:4] for course in group_courses]
                        if len(set(course_prefixes)) == 1:
                            # Same subject - likely OR alternatives
                            parsed_groups.append(f"({' || '.join(group_courses)})")
                        else:
                            # Different subjects - likely AND requirements
                            parsed_groups.append(f"({' && '.join(group_courses)})")
                elif len(group_courses) == 1:
                    # Single course in group
                    if group_year and ' or ' in group_lower:
                        # Single course OR with year requirement
                        parsed_groups.append(f"({group_courses[0]} || {group_year})")
                    else:
                        parsed_groups.append(group_courses[0])
                elif group_year:
                    # Only year requirement in group
                    parsed_groups.append(group_year)
        
        # If no parenthetical groups contain courses, fall back to mixed logic parsing
        if not has_course_groups:
            return self.parse_mixed_logic(content, courses)
        
        # Handle any remaining courses not in parentheses
        remaining_courses = [c for c in courses if c not in used_courses]
        remaining_with_grades = []
        if remaining_courses:
            # Check if remaining courses should be grouped
            if len(remaining_courses) > 1:
                # Check if the remaining courses have grade requirements - indicates AND relationship
                has_grade_requirements = any('with' in content and 'grade' in content for course in remaining_courses)
                
                if has_grade_requirements:
                    # Comma-separated courses with grades are AND requirements
                    remaining_with_grades = [self.add_grade_to_course(c, content, []) for c in remaining_courses]
                else:
                    # Check if comma+and pattern suggests AND relationship
                    # Pattern like "MATH 1005, MATH 2004, and (...)" indicates AND
                    comma_and_pattern = re.search(r'([a-z]{4}\s+\d{4})\s*,\s*([a-z]{4}\s+\d{4})\s*,?\s*and\s+\(', content.lower())
                    
                    if comma_and_pattern:
                        # Comma+and pattern - courses should be AND-connected
                        remaining_with_grades = remaining_courses
                    else:
                        # Check if the context has explicit "and" keywords between courses
                        # This overrides the same-subject heuristic
                        has_explicit_and = re.search(r'[a-z]{4}\s+\d{4}\s+and\s+.*?\s+and\s+[a-z]{4}\s+\d{4}', content.lower())
                        
                        if has_explicit_and:
                            # Explicit AND context - treat as individual AND components
                            remaining_with_grades = remaining_courses
                        else:
                            # Apply original same-subject heuristic
                            remaining_prefixes = [course[:4] for course in remaining_courses]
                            if len(set(remaining_prefixes)) == 1:
                                # Same subject - OR alternatives
                                parsed_groups.append(f"({' || '.join(remaining_courses)})")
                            else:
                                # Different subjects - individual AND components
                                remaining_with_grades = remaining_courses
            else:
                remaining_with_grades = [self.add_grade_to_course(remaining_courses[0], content, [])]
        
        # Reorder: individual courses first, then parenthetical groups
        if remaining_with_grades and parsed_groups:
            # Put individual courses (with grades) first, then grouped courses
            all_components = remaining_with_grades + parsed_groups
        elif remaining_with_grades:
            all_components = remaining_with_grades
        else:
            all_components = parsed_groups
        
        # Connect groups based on the logic between them
        if len(all_components) > 1:
            # Check for explicit OR between groups
            group_connector_match = re.search(r'\)\s+(or|and)\s+\(', content_clean)
            if group_connector_match and group_connector_match.group(1) == 'or':
                return ' || '.join(all_components)
            else:
                # Default to AND for multiple groups
                return ' && '.join(all_components)
        elif len(parsed_groups) == 1:
            return parsed_groups[0]
        else:
            return ' && '.join(courses)
    
    def add_grade_to_course(self, course, content, grade_requirements):
        """Add grade requirement to a course if present."""
        # If course already has grade markers, don't add again
        if '[' in course and ']' in course:
            return course
            
        # Look for grade requirement associated with this course directly in content
        course_num = course[-4:]  # Get just the number part
        course_prefix = course[:4]  # Get just the prefix
        
        # Multiple patterns for different grade requirement formats
        grade_patterns = [
            rf'{course_prefix}\s*{course_num}[^,;]*?with\s+a\s+minimum\s+grade\s+of\s+<span[^>]*>([A-F][+-]?)</span>',
            rf'{course_prefix}\s*{course_num}[^,;]*?with\s+a\s+minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)',
            rf'{course_prefix}\s*{course_num}[^,;]*?with\s+a\s+grade\s+of\s+([A-F][+-]?|\d+%?)',
            rf'{course_prefix}\s*{course_num}[^,;]*?minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)',
            rf'{course_prefix}\s*{course_num}\([^)]*\)\s*with\s+a\s+minimum\s+grade\s+of\s+<span[^>]*>([A-F][+-]?)</span>',
            rf'{course_prefix}\s*{course_num}\([^)]*\)\s*with\s+a\s+minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)'
        ]
        
        for grade_pattern in grade_patterns:
            match = re.search(grade_pattern, content, re.IGNORECASE)
            if match:
                grade = match.group(1)
                return f"{course}[{grade}]"
        
        # If no course-specific grade found, check if there's a global grade requirement for "all"
        if grade_requirements and re.search(r'all\s+with\s+a\s+minimum\s+grade', content, re.IGNORECASE):
            return f"{course}[{grade_requirements[0]}]"
            
        return course
    
    def parse_course_logic_with_grades(self, content, courses, grade_requirements):
        """Parse course logic and incorporate grade requirements."""
        # Remove permission clauses from content before parsing course logic to avoid confusion
        content_for_logic = content
        permission_or_patterns = [
            r';\s*or\s+permission[^.]*',
            r',\s*or\s+permission[^.]*',
            r'\s+or\s+permission\s+of\s+the\s+department[^.]*',
            r'\s+or\s+permission\s+of\s+the\s+school[^.]*',
            r'\s+or\s+by\s+permission[^.]*',
            r'\s+or\s+departmental\s+permission[^.]*'
        ]
        
        for pattern in permission_or_patterns:
            content_for_logic = re.sub(pattern, '', content_for_logic, flags=re.IGNORECASE)
        
        # First, create course list with grades applied once
        courses_with_grades = []
        for course in courses:
            course_with_grade = self.add_grade_to_course(course, content, grade_requirements)
            courses_with_grades.append(course_with_grade)
        
        # Now get the basic logic structure using the courses with grades and cleaned content
        return self.parse_course_logic(content_for_logic, courses_with_grades)

    def parse_mixed_logic(self, content, courses):
        """Handle mixed AND/OR logic without clear parentheses."""
        # Clean HTML tags first to avoid issues with semicolons in onclick events
        clean_content = re.sub(r'<[^>]+>', '', content)
        clean_content = re.sub(r'\s+', ' ', clean_content).strip()
        content_lower = clean_content.lower()
        
        # Special case: Handle repeated course patterns in OR clauses
        # Pattern: "A and B and year-status ..., or A and B and year-status with permission"
        if ' or ' in content_lower and len(courses) <= 4:  # Limit to avoid false positives
            # Split by 'or' to see if we have repeated course patterns
            or_parts = [part.strip() for part in content_lower.split(' or ')]
            if len(or_parts) == 2:
                # Check if both parts contain the same courses
                part1_courses = self.extract_course_codes(or_parts[0])
                part2_courses = self.extract_course_codes(or_parts[1])
                
                if (set(part1_courses) == set(part2_courses) and 
                    len(part1_courses) == len(courses) and 
                    len(part1_courses) > 0):
                    # Same courses in both parts - parse each part separately
                    parsed_parts = []
                    
                    for part in or_parts:
                        part_courses = self.extract_course_codes(part)
                        part_components = []
                        
                        # Add courses
                        part_components.extend(part_courses)
                        
                        # Add year standing if present
                        year_req = self.parse_year_standing(part)
                        if year_req:
                            part_components.append(year_req)
                            
                        # Add permission if present
                        if 'permission' in part:
                            part_components.append('PERMISSION')
                        
                        if part_components:
                            if len(part_components) == 1:
                                parsed_parts.append(part_components[0])
                            else:
                                parsed_parts.append(' && '.join(part_components))
                    
                    return ' || '.join([f"({part})" for part in parsed_parts]) if len(parsed_parts) > 1 else parsed_parts[0]
        
        # Handle semicolon-separated groups first (like ENVE3004: "CHEM A or CHEM B; ENVE C")
        if ';' in content_lower:
            # Split by semicolons - groups are connected by AND
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
                        if len(part_courses) > 1:
                            parsed_parts.append(f"({' || '.join(part_courses)})")
                        else:
                            parsed_parts.append(part_courses[0])
                    elif len(part_courses) == 1:
                        parsed_parts.append(part_courses[0])
                    else:
                        # Multiple courses without explicit OR - check if same subject
                        course_prefixes = [course[:4] for course in part_courses]
                        if len(set(course_prefixes)) == 1 and len(part_courses) > 1:
                            # Same subject - likely OR alternatives
                            parsed_parts.append(f"({' || '.join(part_courses)})")
                        else:
                            # Different subjects - likely AND
                            parsed_parts.append(' && '.join(part_courses))
            
            return ' && '.join(parsed_parts) if parsed_parts else ' && '.join(courses)
        
        # Handle comma-separated lists more carefully
        # Pattern: "MATH 1005, MATH 2004, and (PHYS 1004 or PHYS 1002)" - commas usually mean AND
        if ',' in content_lower:
            # Split by comma to identify AND components
            comma_parts = [part.strip() for part in content_lower.split(',')]
            parsed_components = []
            parenthetical_components = []
            
            for part in comma_parts:
                # Remove "and" from beginning of parts
                part = re.sub(r'^\s*and\s+', '', part)
                part_courses = self.extract_course_codes(part)
                
                if part_courses:
                    if ' or ' in part and len(part_courses) > 1:
                        # OR within this comma-separated part
                        component = f"({' || '.join(part_courses)})"
                        # Check if this is a parenthetical group in original content
                        if '(' in part:
                            parenthetical_components.append(component)
                        else:
                            parsed_components.append(component)
                    elif len(part_courses) == 1:
                        # Single course - add with any grade requirements
                        course_with_grade = self.add_grade_to_course(part_courses[0], content, [])
                        # Check if this is part of a parenthetical group
                        if '(' in part or ')' in part:
                            parenthetical_components.append(course_with_grade)
                        else:
                            parsed_components.append(course_with_grade)
                    else:
                        # Multiple courses in same comma part - each is individual AND requirement
                        # Don't group as OR, treat as separate AND requirements
                        for course in part_courses:
                            course_with_grade = self.add_grade_to_course(course, content, [])
                            parsed_components.append(course_with_grade)
            
            # Combine: individual courses first, then parenthetical groups
            all_components = parsed_components + parenthetical_components
            if all_components:
                return ' && '.join(all_components)
        
        # Handle patterns split by 'and' without commas
        and_parts = re.split(r'\s+and\s+', content_lower)
        
        if len(and_parts) > 1:
            parsed_parts = []
            
            for part in and_parts:
                part_courses = self.extract_course_codes(part)
                if part_courses:
                    if ' or ' in part and len(part_courses) > 1:
                        # This part has OR logic
                        parsed_parts.append(f"({' || '.join(part_courses)})")
                    elif len(part_courses) == 1:
                        parsed_parts.append(part_courses[0])
                    else:
                        # Multiple courses in same 'and' part without explicit OR
                        course_prefixes = [course[:4] for course in part_courses]
                        if len(set(course_prefixes)) == 1:
                            # Same subject - likely OR alternatives
                            parsed_parts.append(f"({' || '.join(part_courses)})")
                        else:
                            # Different subjects - likely AND requirements
                            parsed_parts.extend(part_courses)
            
            return ' && '.join(parsed_parts) if parsed_parts else ' && '.join(courses)
        
        # Fallback: analyze the overall pattern
        # Check for patterns like "CHEM 1006, CHEM 1002, or CHEM 1012" (comma-separated OR)
        if re.search(r',\s+or\s+', content_lower):
            return ' || '.join(courses)
        
        # Check for same-subject alternatives without explicit structure
        course_prefixes = [course[:4] for course in courses]
        if len(set(course_prefixes)) == 1 and len(courses) > 2:
            # Same subject, multiple courses - likely OR alternatives
            return ' || '.join(courses)
        
        # Check if it's a simple OR sequence
        if ' or ' in content_lower and content_lower.count(' or ') >= len(courses) - 1:
            return ' || '.join(courses)
        
        # Default to AND for multiple different courses
        return ' && '.join(courses) if len(courses) > 1 else (courses[0] if courses else "")
    
    def split_by_operator_outside_parens(self, expression, operator):
        """Split expression by operator only when it appears outside parentheses."""
        parts = []
        current_part = ""
        paren_depth = 0
        i = 0
        
        while i < len(expression):
            char = expression[i]
            
            if char == '(':
                paren_depth += 1
                current_part += char
            elif char == ')':
                paren_depth -= 1
                current_part += char
            elif paren_depth == 0 and expression[i:i+len(operator)] == operator:
                # Found operator outside parentheses
                parts.append(current_part.strip())
                current_part = ""
                i += len(operator) - 1  # Skip the operator
            else:
                current_part += char
            
            i += 1
        
        # Add the final part
        if current_part.strip():
            parts.append(current_part.strip())
        
        return parts

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
        # Split by && only when it's outside parentheses
        parts = self.split_by_operator_outside_parens(expression, ' && ')
        
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