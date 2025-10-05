#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser
import re

def debug_comp3005_full():
    parser = SimplePrerequisiteParser()
    
    # COMP3005 content from the actual file
    test_content = '''<div class="coursedescadditional">Precludes additional credit for <a class="bubblelink code" href="/search/?P=BUSI%203400" onclick="return showCourse(this, 'BUSI 3400');" title="BUSI 3400">BUSI 3400</a>.<br/>Prerequisite(s): <a class="bubblelink code" href="/search/?P=COMP%201805" onclick="return showCourse(this, 'COMP 1805');" title="COMP 1805">COMP 1805</a> with a minimum grade of <span class="keeptogether">C-</span>, and either <a class="bubblelink code" href="/search/?P=COMP%202402" onclick="return showCourse(this, 'COMP 2402');" title="COMP 2402">COMP 2402</a> or (<a class="bubblelink code" href="/search/?P=SYSC%202004" onclick="return showCourse(this, 'SYSC 2004');" title="SYSC 2004">SYSC 2004</a> and <a class="bubblelink code" href="/search/?P=SYSC%202100" onclick="return showCourse(this, 'SYSC 2100');" title="SYSC 2100">SYSC 2100</a>).<br/>Lectures three hours a week.<br/></div>'''
    
    # Extract the prerequisite content the same way as simplify_prerequisites
    prereq_match = re.search(r'prerequisite\(s\):\s*(.+?)(?:</p>|\.\s*</p>|$)', test_content, re.IGNORECASE | re.DOTALL)
    if prereq_match:
        content = prereq_match.group(1).strip()
        print(f"1. Extracted content: {content}")
        print()

        # Extract courses
        courses = parser.extract_course_codes(content)
        print(f"2. Extracted courses: {courses}")
        print()
        
        # Check logic path
        clean_content = re.sub(r'<[^>]+>', '', content)
        content_lower = clean_content.lower()
        print(f"3. Clean content: {clean_content}")
        print()
        
        # Check if either pattern is detected
        if re.search(r'either\s+.*?\s+or\s+\(', content_lower):
            print("4. EITHER pattern detected - calling parse_either_or_pattern")
            result = parser.parse_either_or_pattern(content, courses)
            print(f"5. Either-or result: {result}")
        else:
            print("4. Either pattern NOT detected")
            # Continue with normal parsing
            result = parser.parse_course_logic_with_grades(content, courses, [])
            print(f"5. Normal parsing result: {result}")

if __name__ == "__main__":
    debug_comp3005_full()