#!/usr/bin/env python3

from parse_prerequisites_simple import SimplePrerequisiteParser
from bs4 import BeautifulSoup

def debug_elec3105():
    parser = SimplePrerequisiteParser()
    
    # Read the HTML file
    with open('courses/elec/elec3105.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    text_content = soup.get_text()
    
    print("=== ELEC3105 Full Content ===")
    print(text_content)
    print("\n" + "="*50)
    
    # Extract courses
    courses = parser.extract_course_codes(text_content)
    print(f"Extracted courses: {courses}")
    
    # Parse prerequisite section
    prereq_pattern = r'(?:prerequisite|prealable)\s*(?:\(s\))?\s*:\s*(.*?)(?:\n|(?:corequisite|includes|lectures|restriction|preclusion|permission|limited enrollment))'
    import re
    prereq_match = re.search(prereq_pattern, text_content, re.IGNORECASE | re.DOTALL)
    
    if prereq_match:
        prereq_text = prereq_match.group(1).strip()
        print(f"\nPrerequisite text: '{prereq_text}'")
        
        # Test the logic parsing
        simplified = parser.simplify_prerequisites(text_content)
        print(f"Simplified result: {simplified}")
        
        # Test individual components
        year_standing = parser.parse_year_standing(prereq_text)
        print(f"Year standing: {year_standing}")
        
        # Test course logic
        result = parser.parse_course_logic(prereq_text, courses)
        print(f"Course logic result: {result}")

if __name__ == "__main__":
    debug_elec3105()