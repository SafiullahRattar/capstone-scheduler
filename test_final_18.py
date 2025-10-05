#!/usr/bin/env python3

import json
from parse_prerequisites_simple import SimplePrerequisiteParser

def test_final_18_courses():
    """Test the final 18 problematic courses."""
    parser = SimplePrerequisiteParser()
    
    # The final 18 problematic courses from the analysis
    test_cases = [
        ("BIOL1104", "HIGH_SCHOOL_REQUIREMENT || BIOL1103"),
        ("BIOL3306", "((BIOL1003 && BIOL1004) || (BIOL1103 && BIOL1104)) && (CHEM1001 && CHEM1002) && THIRD_YEAR"),
        ("CIVE2004", "SECOND_YEAR || GEOM1004"),
        ("CIVE4403", "(CIVE3204 && CIVE3206 && FOURTH_YEAR) || PERMISSION"),
        ("COMP1405", "null (program restriction)"),
        ("COMP3005", "COMP1805[C-] && (COMP2402 || (SYSC2004 && SYSC2100))"),
        ("COMP3007", "COMP1805[C-] && COMP2401[C-] && COMP2402 && (COMP2404 || SYSC3010 || SYSC3110) && (COMP2406 || SYSC4504)"),
        ("COMP3105", "COMP2402 && (COMP2404 || SYSC3010 || SYSC3110) && COMP2804 && (MATH1104 || MATH1107)"),
        ("COMP3106", "COMP2402 && (COMP2404 || SYSC3010 || SYSC3110) && COMP2804"),
        ("ECOR3800", "THIRD_YEAR || (SECOND_YEAR && PERMISSION)"),
        ("ELEC3105", "MATH1005 && MATH2004 && (PHYS1004 || PHYS1002) && SECOND_YEAR"),
        ("ELEC3907", "ELEC2507 && ELEC2607 && THIRD_YEAR"),
        ("ENVE3002", "(CHEM1002 || CHEM1101) && MATH2004 && SECOND_YEAR"),
        ("ENVE3004", "(CHEM1002 || CHEM1101) && ENVE3002"),
        ("MATH1005", "MATH1004 && (MATH1104 || MATH1107) || PERMISSION"),
        ("PHYS4208", "(PHYS2212 || PHYS2202) && (PHYS3606 || PHYS3608) && (PHYS3308 || PERMISSION)"),
        ("SREE3001", "ENVE2001 && MAAE2300 && (ELEC2602 || FOURTH_YEAR)"),
        ("SYSC1006", "ECOR1031[C-] || (ECOR1041[C-] && ECOR1042[C-])"),
    ]
    
    results = {}
    
    for course_code, expected in test_cases:
        try:
            # Find the course file
            course_file = f"courses/{course_code.lower()[:4]}/{course_code.lower()}.html"
            
            # Parse the course
            course_data = parser.parse_course_file(course_file)
            
            if course_data:
                actual = course_data['required']
                results[course_code] = {
                    'actual': actual,
                    'expected': expected,
                    'match': str(actual) == (expected.split(' (')[0] if ' (program restriction)' in expected or ' (explanation)' in expected else expected)
                }
            else:
                results[course_code] = {
                    'actual': 'PARSE_ERROR',
                    'expected': expected,
                    'match': False
                }
                
        except Exception as e:
            results[course_code] = {
                'actual': f'ERROR: {str(e)}',
                'expected': expected,
                'match': False
            }
    
    return results

def main():
    """Test the final 18 problematic courses."""
    print("Testing final 18 problematic courses...\n")
    
    results = test_final_18_courses()
    
    matches = 0
    total = len(results)
    
    for course_code, data in results.items():
        status = "✅" if data['match'] else "❌"
        print(f"{status} {course_code}:")
        print(f"  Actual:   {data['actual']}")
        print(f"  Expected: {data['expected']}")
        if data['match']:
            matches += 1
        print()
    
    print(f"Summary: {matches}/{total} matches ({matches/total*100:.1f}%)")
    
    # Save results
    with open('final_18_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Results saved to final_18_test_results.json")

if __name__ == "__main__":
    main()