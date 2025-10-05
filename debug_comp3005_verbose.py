#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser
import re

# Create a test version of the parser with debug output
class DebugParser(SimplePrerequisiteParser):
    def parse_either_or_pattern(self, content, courses):
        """Handle 'either X or (Y and Z)' patterns with debug output."""
        print(f"DEBUG: parse_either_or_pattern called with courses: {courses}")
        
        # Strip HTML tags first to avoid issues with quotes in HTML attributes
        clean_content = re.sub(r'<[^>]+>', '', content)
        content_lower = clean_content.lower()
        print(f"DEBUG: clean_content_lower: {content_lower}")
        
        # Pattern: "A, and either B or (C and D)" should be A && (B || (C && D))
        either_match = re.search(r'and\s+either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
        if either_match:
            print(f"DEBUG: either_match found!")
            # Extract courses from the "either" part (between "either" and "or")
            either_part = either_match.group(1).strip()
            either_courses = self.extract_course_codes(either_part)
            print(f"DEBUG: either_part: '{either_part}' -> courses: {either_courses}")
            
            # Extract courses from the parenthetical part  
            paren_part = either_match.group(2).strip()
            paren_courses = self.extract_course_codes(paren_part)
            print(f"DEBUG: paren_part: '{paren_part}' -> courses: {paren_courses}")
            
            # Find courses that come BEFORE the "either" (these are AND requirements)
            # Handle case where courses may already have grades applied
            before_either_courses = []
            for course in courses:
                # Extract base course code (remove grade if present)
                base_course = re.sub(r'\[.*?\]', '', course)
                if base_course not in either_courses and base_course not in paren_courses:
                    before_either_courses.append(course)
            print(f"DEBUG: before_either_courses: {before_either_courses}")
            
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
                print(f"DEBUG: components after adding before_either: {components}")
                
                # Build the either-or choice (these are extracted from clean content, so no grades yet)
                either_with_grades = [self.add_grade_to_course(c, content, []) for c in either_courses]
                paren_with_grades = [self.add_grade_to_course(c, content, []) for c in paren_courses]
                print(f"DEBUG: either_with_grades: {either_with_grades}")
                print(f"DEBUG: paren_with_grades: {paren_with_grades}")
                
                # Either part (single course or AND of multiple)
                if len(either_with_grades) == 1:
                    either_expr = either_with_grades[0]
                else:
                    either_expr = f"({' && '.join(either_with_grades)})"
                print(f"DEBUG: either_expr: {either_expr}")
                
                # Parenthetical part (check for "and" to determine logic)
                if ' and ' in paren_part:
                    paren_expr = f"({' && '.join(paren_with_grades)})"
                else:
                    paren_expr = f"({' || '.join(paren_with_grades)})"
                print(f"DEBUG: paren_expr: {paren_expr}")
                
                # Combine either-or choice
                choice_expr = f"({either_expr} || {paren_expr})"
                components.append(choice_expr)
                print(f"DEBUG: choice_expr: {choice_expr}")
                print(f"DEBUG: final components: {components}")
                
                result = ' && '.join(components)
                print(f"DEBUG: final result: {result}")
                return result
        
        # Fallback to regular mixed logic
        return self.parse_mixed_logic(content, courses)

def test_comp3005_debug():
    parser = DebugParser()
    
    # COMP3005 content from the actual file
    test_content = '''<div class="coursedescadditional">Precludes additional credit for <a class="bubblelink code" href="/search/?P=BUSI%203400" onclick="return showCourse(this, 'BUSI 3400');" title="BUSI 3400">BUSI 3400</a>.<br/>Prerequisite(s): <a class="bubblelink code" href="/search/?P=COMP%201805" onclick="return showCourse(this, 'COMP 1805');" title="COMP 1805">COMP 1805</a> with a minimum grade of <span class="keeptogether">C-</span>, and either <a class="bubblelink code" href="/search/?P=COMP%202402" onclick="return showCourse(this, 'COMP 2402');" title="COMP 2402">COMP 2402</a> or (<a class="bubblelink code" href="/search/?P=SYSC%202004" onclick="return showCourse(this, 'SYSC 2004');" title="SYSC 2004">SYSC 2004</a> and <a class="bubblelink code" href="/search/?P=SYSC%202100" onclick="return showCourse(this, 'SYSC 2100');" title="SYSC 2100">SYSC 2100</a>).<br/>Lectures three hours a week.<br/></div>'''
    
    result = parser.simplify_prerequisites(test_content)
    print(f"\nFINAL RESULT: {result}")
    
    expected = "COMP1805[C-] && (COMP2402 || (SYSC2004 && SYSC2100))"
    print(f"EXPECTED: {expected}")
    print(f"MATCH: {result == expected}")

if __name__ == "__main__":
    test_comp3005_debug()