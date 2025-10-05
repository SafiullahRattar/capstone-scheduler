import re

content = "COMP 1805 with a minimum grade of C-, and either COMP 2402 or (SYSC 2004 and SYSC 2100)"
content_lower = content.lower()

print("Content:", content_lower)
print()

# Current regex
either_match = re.search(r'and\s+either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
print("Current regex matches:", either_match is not None)
if either_match:
    print("Group 1 (either part):", either_match.group(1))
    print("Group 2 (paren part):", either_match.group(2))

print()

# Fixed regex - should capture content from "either" to "or" more flexibly
either_match_fixed = re.search(r'either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
print("Fixed regex matches:", either_match_fixed is not None)
if either_match_fixed:
    print("Group 1 (either part):", either_match_fixed.group(1))
    print("Group 2 (paren part):", either_match_fixed.group(2))