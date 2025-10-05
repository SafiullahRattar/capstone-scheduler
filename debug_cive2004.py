#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser

def debug_cive2004():
    parser = SimplePrerequisiteParser()
    
    # Debug CIVE2004
    course_code = "CIVE2004"
    file_path = f'courses/cive/{course_code.lower()}.html'
    
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
    print(f"EXPECTED: SECOND_YEAR || GEOM1004")

if __name__ == "__main__":
    debug_cive2004()