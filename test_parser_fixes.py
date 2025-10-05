#!/usr/bin/env python3

import json
from parse_prerequisites_simple import SimplePrerequisiteParser

def test_specific_courses():
    """Test specific problematic courses to validate fixes."""
    parser = SimplePrerequisiteParser()
    
    # Test cases from error analysis
    test_cases = [
        # ECOR courses with negative constraints
        ("ECOR1031", "should be null (negative constraint)"),
        ("ECOR1032", "should be null (negative constraint)"),
        
        # BIOL2005 - OR vs AND confusion
        ("BIOL2005", "should be (BIOL1003 || BIOL1103) && CHEM1001 && CHEM1002"),
        
        # CHEM courses - OR alternatives
        ("CHEM2203", "should be CHEM1006[B-] || CHEM1002 || CHEM1012"),
        ("CHEM2302", "should be (CHEM1006[B-] || CHEM1002 || CHEM1012 || CHEM1101) && (MATH1007 || MATH1004)"),
        
        # Permission patterns
        ("COMP2804", "should be COMP1805[C-] || PERMISSION"),
        ("CIVE3208", "should be THIRD_YEAR || PERMISSION"),
        
        # Complex logic
        ("MATH1005", "should be MATH1004 && (MATH1104 || MATH1107) || PERMISSION"),
        ("PHYS1002", "should have complex OR/AND structure"),
    ]
    
    results = {}
    
    for course_code, expected_note in test_cases:
        try:
            # Find the course file
            course_file = f"courses/{course_code.lower()[:4]}/{course_code.lower()}.html"
            
            # Parse the course
            course_data = parser.parse_course_file(course_file)
            
            if course_data:
                results[course_code] = {
                    'required': course_data['required'],
                    'expected': expected_note
                }
            else:
                results[course_code] = {
                    'required': 'PARSE_ERROR',
                    'expected': expected_note
                }
                
        except Exception as e:
            results[course_code] = {
                'required': f'ERROR: {str(e)}',
                'expected': expected_note
            }
    
    return results

def main():
    """Test the parser fixes."""
    print("Testing parser fixes on problematic courses...\n")
    
    results = test_specific_courses()
    
    for course_code, data in results.items():
        print(f"{course_code}:")
        print(f"  Current: {data['required']}")
        print(f"  Expected: {data['expected']}")
        print()
    
    # Save results
    with open('test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Test results saved to test_results.json")

if __name__ == "__main__":
    main()