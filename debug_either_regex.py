#!/usr/bin/env python3

import re

def debug_either_pattern():
    # Test content similar to COMP3005
    content = '''COMP 1805 with a minimum grade of C-, and either COMP 2402 or (SYSC 2004 and SYSC 2100)'''
    content_lower = content.lower()
    
    print(f"Content: {content}")
    print(f"Content lower: {content_lower}")
    
    # Test the regex
    either_match = re.search(r'and\s+either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
    if either_match:
        print(f"Match found!")
        print(f"Either part: '{either_match.group(1)}'")
        print(f"Paren part: '{either_match.group(2)}'")
        
        # Extract the full match
        full_match = either_match.group(0)
        print(f"Full match: '{full_match}'")
        
        # Find what comes before the match
        before_match = content_lower[:either_match.start()]
        print(f"Before match: '{before_match}'")
    else:
        print("No match found")

if __name__ == "__main__":
    debug_either_pattern()