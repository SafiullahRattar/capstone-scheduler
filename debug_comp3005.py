#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser
import re

def debug_comp3005():
    parser = SimplePrerequisiteParser()
    
    # COMP3005 content from the actual file
    test_content = '''<div class="coursedescadditional">Precludes additional credit for <a class="bubblelink code" href="/search/?P=BUSI%203400" onclick="return showCourse(this, 'BUSI 3400');" title="BUSI 3400">BUSI 3400</a>.<br/>Prerequisite(s): <a class="bubblelink code" href="/search/?P=COMP%201805" onclick="return showCourse(this, 'COMP 1805');" title="COMP 1805">COMP 1805</a> with a minimum grade of <span class="keeptogether">C-</span>, and either <a class="bubblelink code" href="/search/?P=COMP%202402" onclick="return showCourse(this, 'COMP 2402');" title="COMP 2402">COMP 2402</a> or (<a class="bubblelink code" href="/search/?P=SYSC%202004" onclick="return showCourse(this, 'SYSC 2004');" title="SYSC 2004">SYSC 2004</a> and <a class="bubblelink code" href="/search/?P=SYSC%202100" onclick="return showCourse(this, 'SYSC 2100');" title="SYSC 2100">SYSC 2100</a>).<br/>Lectures three hours a week.<br/></div>'''
    
    # Extract the prerequisite content
    prereq_match = re.search(r'prerequisite\(s\):\s*(.+?)(?:</p>|\.\s*</p>|$)', test_content, re.IGNORECASE | re.DOTALL)
    if prereq_match:
        content = prereq_match.group(1).strip()
        print(f"1. Content: {content}")
        
        # Extract courses
        courses = parser.extract_course_codes(content)
        print(f"2. Courses: {courses}")
        
        # Check for either pattern manually
        content_lower = content.lower()
        if 'either' in content_lower:
            print(f"3. Has 'either' pattern")
            either_match = re.search(r'and\s+either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
            if either_match:
                print(f"4. Either pattern match:")
                print(f"   First part: {either_match.group(1)}")
                print(f"   Second part: {either_match.group(2)}")
            else:
                print(f"4. No either pattern match found")
                
        # Test the logic parsing
        if len(courses) > 1:
            course_expr = parser.parse_course_logic_with_grades(content, courses, [])
            print(f"5. Course logic: {course_expr}")

if __name__ == "__main__":
    debug_comp3005()