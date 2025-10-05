#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser

def test_comp3007_real():
    parser = SimplePrerequisiteParser()
    
    # COMP3007 real content from the actual file
    test_content = '''<div class="coursedescadditional">Includes: Experiential Learning Activity<br/>Precludes additional credit for <a class="bubblelink code" href="/search/?P=SYSC%203101" onclick="return showCourse(this, 'SYSC 3101');" title="SYSC 3101">SYSC 3101</a>.<br/>Prerequisite(s): <a class="bubblelink code" href="/search/?P=COMP%201805" onclick="return showCourse(this, 'COMP 1805');" title="COMP 1805">COMP 1805</a> with a minimum grade of <span class="keeptogether">C-</span>, <a class="bubblelink code" href="/search/?P=COMP%202401" onclick="return showCourse(this, 'COMP 2401');" title="COMP 2401">COMP 2401</a> with a minimum grade of <span class="keeptogether">C-</span>, <a class="bubblelink code" href="/search/?P=COMP%202402" onclick="return showCourse(this, 'COMP 2402');" title="COMP 2402">COMP 2402</a>, (<a class="bubblelink code" href="/search/?P=COMP%202404" onclick="return showCourse(this, 'COMP 2404');" title="COMP 2404">COMP 2404</a> or <a class="bubblelink code" href="/search/?P=SYSC%203010" onclick="return showCourse(this, 'SYSC 3010');" title="SYSC 3010">SYSC 3010</a> or <a class="bubblelink code" href="/search/?P=SYSC%203110" onclick="return showCourse(this, 'SYSC 3110');" title="SYSC 3110">SYSC 3110</a>) and (<a class="bubblelink code" href="/search/?P=COMP%202406" onclick="return showCourse(this, 'COMP 2406');" title="COMP 2406">COMP 2406</a> or <a class="bubblelink code" href="/search/?P=SYSC%204504" onclick="return showCourse(this, 'SYSC 4504');" title="SYSC 4504">SYSC 4504</a>).<br/>Lectures and tutorials three to four and a half hours a week.<br/></div>'''
    
    result = parser.simplify_prerequisites(test_content)
    print(f"COMP3007 result: {result}")
    
    expected = "COMP1805[C-] && COMP2401[C-] && COMP2402 && (COMP2404 || SYSC3010 || SYSC3110) && (COMP2406 || SYSC4504)"
    print(f"Expected result: {expected}")
    
    print(f"Match: {result == expected}")

if __name__ == "__main__":
    test_comp3007_real()