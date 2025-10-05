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

class PrerequisiteParser:
    def __init__(self):
        # Course code pattern (4 letters + 4 digits)
        self.course_pattern = r'[A-Z]{4}\s*\d{4}'
        
        # Year standing patterns
        self.year_patterns = {
            'first': r'first[- ]year\s+status',
            'second': r'second[- ]year\s+status',
            'third': r'third[- ]year\s+status',
            'fourth': r'fourth[- ]year\s+status|4th\s+year\s+status',
            'fifth': r'fifth[- ]year\s+status|5th\s+year\s+status'
        }
        
        # Grade requirement pattern
        self.grade_pattern = r'with\s+a\s+minimum\s+grade\s+of\s+([A-F][+-]?|\d+%?)'
        
        # Permission patterns
        self.permission_patterns = [
            r'permission\s+of\s+the\s+department',
            r'permission\s+of\s+the\s+school',
            r'permission\s+of\s+department',
            r'permission\s+of\s+school',
            r'departmental\s+permission',
            r'instructor[\'s]?\s+permission'
        ]
        
        # Program/registration patterns
        self.program_patterns = [
            r'registration\s+in\s+the\s+([^.]+?)\s+program',
            r'enrolled\s+in\s+([^.]+?)\s+program',
            r'students\s+in\s+([^.]+?)\s+program'
        ]
        
        # Exclusion patterns
        self.exclusion_patterns = [
            r'not\s+open\s+to\s+students\s+in\s+([^.]+)',
            r'not\s+available\s+to\s+([^.]+)',
            r'excludes\s+([^.]+)'
        ]
        
        # Co-requisite patterns
        self.coreq_patterns = [
            r'concurrent\s+registration\s+in',
            r'concurrent\s+enrolment\s+in',
            r'concurrently\s+with'
        ]
        
        # High school patterns
        self.highschool_patterns = [
            r'ontario\s+4u[/m]?\s+in\s+([^(]+?)(?:\s*\([^)]*\))?',
            r'high\s+school\s+([^.]+)',
            r'secondary\s+school\s+([^.]+)'
        ]

    def extract_course_codes(self, text):
        """Extract all course codes from text."""
        matches = re.findall(self.course_pattern, text, re.IGNORECASE)
        return [match.replace(' ', '').replace('\xa0', '') for match in matches]

    def parse_year_standing(self, text):
        """Parse year standing requirements."""
        year_requirements = []
        text_lower = text.lower()
        
        for year, pattern in self.year_patterns.items():
            if re.search(pattern, text_lower):
                year_requirements.append({
                    'type': 'year_standing',
                    'year': year,
                    'description': f"{year.capitalize()}-year status"
                })
        
        return year_requirements

    def parse_grade_requirements(self, text):
        """Parse minimum grade requirements."""
        grade_matches = re.findall(self.grade_pattern, text, re.IGNORECASE)
        return [{'type': 'minimum_grade', 'grade': grade} for grade in grade_matches]

    def parse_permissions(self, text):
        """Parse permission requirements."""
        permissions = []
        text_lower = text.lower()
        
        for pattern in self.permission_patterns:
            match = re.search(pattern, text_lower)
            if match:
                permissions.append({
                    'type': 'permission',
                    'description': match.group(0)
                })
        
        return permissions

    def parse_program_requirements(self, text):
        """Parse program/registration requirements."""
        programs = []
        
        for pattern in self.program_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                programs.append({
                    'type': 'program_requirement',
                    'program': match.strip(),
                    'description': f"Registration in {match.strip()} program"
                })
        
        return programs

    def parse_exclusions(self, text):
        """Parse exclusion/restriction requirements."""
        exclusions = []
        
        for pattern in self.exclusion_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                exclusions.append({
                    'type': 'exclusion',
                    'excluded_programs': match.strip(),
                    'description': f"Not open to students in {match.strip()}"
                })
        
        return exclusions

    def parse_corequisites(self, text):
        """Parse co-requisite requirements."""
        coreqs = []
        text_lower = text.lower()
        
        # Skip if this is a negative concurrent requirement (restriction)
        if 'may not be taken concurrently' in text_lower or re.search(r'not.*concurrently', text_lower):
            return coreqs
        
        for pattern in self.coreq_patterns:
            if re.search(pattern, text_lower):
                # Find courses mentioned after the concurrent pattern
                match = re.search(pattern + r'\s*([^.]+)', text_lower)
                if match:
                    concurrent_text = match.group(1)
                    courses = self.extract_course_codes(concurrent_text)
                    for course in courses:
                        clean_course = course.replace('\xa0', '')  # Remove non-breaking spaces
                        coreqs.append({
                            'type': 'corequisite',
                            'course': clean_course,
                            'description': f"Concurrent registration in {clean_course}"
                        })
        
        return coreqs

    def parse_highschool_requirements(self, text):
        """Parse high school prerequisite requirements."""
        highschool_reqs = []
        
        for pattern in self.highschool_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                highschool_reqs.append({
                    'type': 'highschool_requirement',
                    'subject': match.strip(),
                    'description': f"High school {match.strip()}"
                })
        
        return highschool_reqs

    def tokenize_logical_expression(self, text):
        """Tokenize text into logical components."""
        # Clean up the text
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Split on logical operators while preserving them
        tokens = []
        current_token = ""
        i = 0
        
        while i < len(text):
            char = text[i]
            
            # Check for parentheses
            if char in '()':
                if current_token.strip():
                    tokens.append(current_token.strip())
                    current_token = ""
                tokens.append(char)
                i += 1
            # Check for 'and' or 'or'
            elif text[i:i+4].lower() == ' and':
                if current_token.strip():
                    tokens.append(current_token.strip())
                    current_token = ""
                tokens.append('AND')
                i += 4
            elif text[i:i+3].lower() == ' or':
                if current_token.strip():
                    tokens.append(current_token.strip())
                    current_token = ""
                tokens.append('OR')
                i += 3
            elif text[i:i+2] == ', ':
                if current_token.strip():
                    tokens.append(current_token.strip())
                    current_token = ""
                tokens.append('AND')  # Comma implies AND
                i += 2
            else:
                current_token += char
                i += 1
        
        if current_token.strip():
            tokens.append(current_token.strip())
        
        return [token for token in tokens if token]

    def parse_logical_structure(self, tokens):
        """Parse tokens into a logical structure."""
        if not tokens:
            return None
        
        # Handle single token
        if len(tokens) == 1:
            return self.parse_single_requirement(tokens[0])
        
        # Handle parentheses by finding matching pairs
        result = []
        i = 0
        
        while i < len(tokens):
            token = tokens[i]
            
            if token == '(':
                # Find matching closing parenthesis
                paren_count = 1
                j = i + 1
                while j < len(tokens) and paren_count > 0:
                    if tokens[j] == '(':
                        paren_count += 1
                    elif tokens[j] == ')':
                        paren_count -= 1
                    j += 1
                
                # Recursively parse content within parentheses
                inner_tokens = tokens[i+1:j-1]
                parsed_inner = self.parse_logical_structure(inner_tokens)
                result.append(parsed_inner)
                i = j
            elif token in ['AND', 'OR']:
                result.append(token)
                i += 1
            elif token != ')':  # Skip closing parentheses
                result.append(self.parse_single_requirement(token))
                i += 1
            else:
                i += 1
        
        # Combine results with logical operators
        return self.combine_logical_expressions(result)

    def combine_logical_expressions(self, items):
        """Combine parsed items with logical operators."""
        if len(items) == 1:
            return items[0]
        
        # Handle AND/OR precedence (typically AND has higher precedence)
        # For simplicity, we'll process left to right
        result = items[0]
        i = 1
        
        while i < len(items):
            if i + 1 < len(items):
                operator = items[i]
                next_item = items[i + 1]
                
                if operator == 'AND':
                    result = {
                        'type': 'logical_and',
                        'conditions': [result, next_item]
                    }
                elif operator == 'OR':
                    result = {
                        'type': 'logical_or',
                        'conditions': [result, next_item]
                    }
                
                i += 2
            else:
                i += 1
        
        return result

    def parse_single_requirement(self, requirement_text):
        """Parse a single requirement string."""
        req_lower = requirement_text.lower()
        
        # Check for course codes first
        courses = self.extract_course_codes(requirement_text)
        if courses:
            if len(courses) == 1:
                # Check for grade requirements
                grade_matches = re.findall(self.grade_pattern, requirement_text, re.IGNORECASE)
                result = {
                    'type': 'course',
                    'course_code': courses[0]
                }
                if grade_matches:
                    result['minimum_grade'] = grade_matches[0]
                return result
            else:
                # Multiple courses - typically AND condition
                return {
                    'type': 'logical_and',
                    'conditions': [{'type': 'course', 'course_code': course} for course in courses]
                }
        
        # Check for year standing
        year_reqs = self.parse_year_standing(requirement_text)
        if year_reqs:
            return year_reqs[0]
        
        # Check for permissions
        permissions = self.parse_permissions(requirement_text)
        if permissions:
            return permissions[0]
        
        # Check for program requirements
        programs = self.parse_program_requirements(requirement_text)
        if programs:
            return programs[0]
        
        # Check for high school requirements
        highschool = self.parse_highschool_requirements(requirement_text)
        if highschool:
            return highschool[0]
        
        # If nothing specific found, return as generic text requirement
        return {
            'type': 'other',
            'description': requirement_text.strip()
        }

    def parse_prerequisites_from_text(self, prereq_text):
        """Main method to parse prerequisites from text."""
        if not prereq_text or 'prerequisite' not in prereq_text.lower():
            return {
                'has_prerequisites': False,
                'prerequisites': None,
                'corequisites': [],
                'exclusions': [],
                'special_notes': []
            }
        
        # Extract the actual prerequisite content
        prereq_match = re.search(r'prerequisite\(s\):\s*(.+?)(?:\.|$)', prereq_text, re.IGNORECASE | re.DOTALL)
        if not prereq_match:
            return {
                'has_prerequisites': False,
                'prerequisites': None,
                'corequisites': [],
                'exclusions': [],
                'special_notes': []
            }
        
        prereq_content = prereq_match.group(1).strip()
        
        # Parse co-requisites
        corequisites = self.parse_corequisites(prereq_text)
        
        # Parse exclusions
        exclusions = self.parse_exclusions(prereq_text)
        
        # Tokenize and parse the main prerequisite logic
        tokens = self.tokenize_logical_expression(prereq_content)
        parsed_prereqs = self.parse_logical_structure(tokens)
        
        return {
            'has_prerequisites': True,
            'prerequisites': parsed_prereqs,
            'corequisites': corequisites,
            'exclusions': exclusions,
            'special_notes': []
        }

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
            
            # Parse prerequisites
            prereq_data = self.parse_prerequisites_from_text(text_content)
            
            # Create course data structure
            course_data = {
                'course_code': course_code,
                'file_path': html_file,
                'raw_content': text_content.strip(),
                **prereq_data
            }
            
            logger.info(f"✓ Parsed {course_code}")
            return course_data
            
        except Exception as e:
            logger.error(f"✗ Error parsing {html_file}: {e}")
            return None

    def parse_all_courses(self, courses_dir="courses"):
        """Parse all course files and return complete dataset."""
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
                        all_courses[course_data['course_code']] = course_data
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
    parser = PrerequisiteParser()
    
    # Parse all courses
    all_courses = parser.parse_all_courses()
    
    # Save to JSON file
    output_file = "course_prerequisites.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_courses, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Results saved to {output_file}")
    
    # Print some statistics
    total_courses = len(all_courses)
    courses_with_prereqs = sum(1 for course in all_courses.values() if course['has_prerequisites'])
    courses_with_coreqs = sum(1 for course in all_courses.values() if course['corequisites'])
    courses_with_exclusions = sum(1 for course in all_courses.values() if course['exclusions'])
    
    print(f"\n=== PARSING STATISTICS ===")
    print(f"Total courses parsed: {total_courses}")
    print(f"Courses with prerequisites: {courses_with_prereqs}")
    print(f"Courses with co-requisites: {courses_with_coreqs}")
    print(f"Courses with exclusions: {courses_with_exclusions}")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    main()