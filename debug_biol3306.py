#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser

def debug_biol3306():
    parser = SimplePrerequisiteParser()
    
    course_code = "BIOL3306"
    file_path = f'courses/biol/{course_code.lower()}.html'
    
    with open(file_path, 'r') as f:
        html_content = f.read()
    
    print(f"=== {course_code} DEBUG ===")
    print("HTML:", html_content)
    print()
    
    result = parser.parse_course_file(file_path)
    print(f"RESULT: {result}")
    print(f"EXPECTED: ((BIOL1003 && BIOL1004) || (BIOL1103 && BIOL1104)) && (CHEM1001 && CHEM1002) && THIRD_YEAR")

if __name__ == "__main__":
    debug_biol3306()