#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser

def debug_comp3007():
    parser = SimplePrerequisiteParser()
    
    # COMP3007 test content
    test_content = '''<p>Prerequisite(s): <a href="/academic/current/courses/math1005.html" onclick="openDailog('MATH 1005')" data-course-id="MATH 1005">MATH 1005</a> with a minimum grade of <span class="highlight">C-</span>, <a href="/academic/current/courses/comp1405.html" onclick="openDailog('COMP 1405')" data-course-id="COMP 1405">COMP 1405</a> with a minimum grade of <span class="highlight">C-</span>, <a href="/academic/current/courses/comp1406.html" onclick="openDailog('COMP 1406')" data-course-id="COMP 1406">COMP 1406</a> with a minimum grade of <span class="highlight">C-</span>, <a href="/academic/current/courses/comp1805.html" onclick="openDailog('COMP 1805')" data-course-id="COMP 1805">COMP 1805</a> with a minimum grade of <span class="highlight">C-</span>, <a href="/academic/current/courses/comp2401.html" onclick="openDailog('COMP 2401')" data-course-id="COMP 2401">COMP 2401</a> with a minimum grade of <span class="highlight">C-</span>, <a href="/academic/current/courses/comp2402.html" onclick="openDailog('COMP 2402')" data-course-id="COMP 2402">COMP 2402</a>, and (<a href="/academic/current/courses/comp2404.html" onclick="openDailog('COMP 2404')" data-course-id="COMP 2404">COMP 2404</a> or <a href="/academic/current/courses/sysc3010.html" onclick="openDailog('SYSC 3010')" data-course-id="SYSC 3010">SYSC 3010</a> or <a href="/academic/current/courses/sysc3110.html" onclick="openDailog('SYSC 3110')" data-course-id="SYSC 3110">SYSC 3110</a>), and (<a href="/academic/current/courses/comp2406.html" onclick="openDailog('COMP 2406')" data-course-id="COMP 2406">COMP 2406</a> or <a href="/academic/current/courses/sysc4504.html" onclick="openDailog('SYSC 4504')" data-course-id="SYSC 4504">SYSC 4504</a>).</p>'''
    
    # Debug step by step
    import re
    
    # Step 1: Extract prerequisite content
    prereq_match = re.search(r'prerequisite\(s\):\s*(.+?)(?:\.|$)', test_content, re.IGNORECASE | re.DOTALL)
    if prereq_match:
        content = prereq_match.group(1).strip()
        print(f"1. Extracted content: {content}")
        
        # Step 2: Extract courses
        courses = parser.extract_course_codes(content)
        print(f"2. Extracted courses: {courses}")
        
        # Step 3: Test grade handling
        for course in courses[:3]:  # First 3 courses
            course_with_grade = parser.add_grade_to_course(course, content, [])
            print(f"3. {course} -> {course_with_grade}")
        
        # Step 4: Test logic parsing
        if len(courses) > 1:
            course_expr = parser.parse_course_logic_with_grades(content, courses, [])
            print(f"4. Course logic: {course_expr}")

if __name__ == "__main__":
    debug_comp3007()