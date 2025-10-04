#!/usr/bin/env python3

import re

def extract_course_codes(input_file, output_file):
    """
    Extract course codes from HTML file using regex pattern.
    Course codes are in URLs like: href="/search/?P=SYSC%202301"
    """
    course_codes = set()
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex pattern to match course codes in URLs
    # Matches: /search/?P=ABCD%20NNNN where ABCD is 4 letters and NNNN is 4 digits
    pattern = r'/search/\?P=([A-Z]{4})%20(\d{4})'
    
    matches = re.findall(pattern, content)
    
    # Convert matches to course code format (e.g., SYSC4907)
    for subject, number in matches:
        course_code = f"{subject}{number}"
        course_codes.add(course_code)
    
    # Sort the course codes for consistent output
    sorted_courses = sorted(list(course_codes))
    
    # Write to output file
    with open(output_file, 'w') as f:
        for course in sorted_courses:
            f.write(f"{course}\n")
    
    print(f"Extracted {len(sorted_courses)} unique course codes to {output_file}")
    return sorted_courses

if __name__ == "__main__":
    input_file = "allschedule.txt"
    output_file = "course_codes.txt"
    
    courses = extract_course_codes(input_file, output_file)
    print(f"First 10 courses: {courses[:10]}")