#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser

def test_comp3005():
    parser = SimplePrerequisiteParser()
    
    # COMP3005 content from the actual file
    test_content = '''<div class="coursedescadditional">Precludes additional credit for <a class="bubblelink code" href="/search/?P=BUSI%203400" onclick="return showCourse(this, 'BUSI 3400');" title="BUSI 3400">BUSI 3400</a>.<br/>Prerequisite(s): <a class="bubblelink code" href="/search/?P=COMP%201805" onclick="return showCourse(this, 'COMP 1805');" title="COMP 1805">COMP 1805</a> with a minimum grade of <span class="keeptogether">C-</span>, and either <a class="bubblelink code" href="/search/?P=COMP%202402" onclick="return showCourse(this, 'COMP 2402');" title="COMP 2402">COMP 2402</a> or (<a class="bubblelink code" href="/search/?P=SYSC%202004" onclick="return showCourse(this, 'SYSC 2004');" title="SYSC 2004">SYSC 2004</a> and <a class="bubblelink code" href="/search/?P=SYSC%202100" onclick="return showCourse(this, 'SYSC 2100');" title="SYSC 2100">SYSC 2100</a>).<br/>Lectures three hours a week.<br/></div>'''
    
    result = parser.simplify_prerequisites(test_content)
    print(f"COMP3005 result: {result}")
    
    expected = "COMP1805[C-] && (COMP2402 || (SYSC2004 && SYSC2100))"
    print(f"Expected result: {expected}")
    
    print(f"Match: {result == expected}")

if __name__ == "__main__":
    test_comp3005()