#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser

def debug_sysc1006():
    parser = SimplePrerequisiteParser()
    
    course_code = "SYSC1006"
    file_path = f'courses/sysc/{course_code.lower()}.html'
    
    with open(file_path, 'r') as f:
        html_content = f.read()
    
    print(f"=== {course_code} DEBUG ===")
    print("HTML:", html_content)
    print()
    
    # Enable debug mode
    import logging
    logging.basicConfig(level=logging.DEBUG)
    
    result = parser.parse_course_file(file_path)
    print(f"RESULT: {result}")
    print(f"EXPECTED: ECOR1031[C-] || (ECOR1041[C-] && ECOR1042[C-])")

if __name__ == "__main__":
    debug_sysc1006()