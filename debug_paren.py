import re

content = '''<a class="bubblelink code" href="/search/?P=COMP%201805" onclick="return showCourse(this, 'COMP 1805');" title="COMP 1805">COMP 1805</a> with a minimum grade of <span class="keeptogether">C-</span>, and either <a class="bubblelink code" href="/search/?P=COMP%202402" onclick="return showCourse(this, 'COMP 2402');" title="COMP 2402">COMP 2402</a> or (<a class="bubblelink code" href="/search/?P=SYSC%202004" onclick="return showCourse(this, 'SYSC 2004');" title="SYSC 2004">SYSC 2004</a> and <a class="bubblelink code" href="/search/?P=SYSC%202100" onclick="return showCourse(this, 'SYSC 2100');" title="SYSC 2100">SYSC 2100</a>)'''

content_lower = content.lower()
print("Full content:")
print(content_lower)
print("\n" + "="*80 + "\n")

# Find the parenthetical group manually
paren_start = content_lower.find('or (')
paren_end = content_lower.rfind(')')
print(f"Parenthetical part location: {paren_start} to {paren_end}")
if paren_start != -1 and paren_end != -1:
    paren_content = content_lower[paren_start+3:paren_end]
    print(f"Parenthetical content: '{paren_content}'")

print("\n" + "="*80 + "\n")

# Test the regex
either_match = re.search(r'and\s+either\s+(.*?)\s+or\s+\((.*?)\)', content_lower, re.DOTALL)
if either_match:
    print("Regex matched!")
    print(f"Group 1 (either part): '{either_match.group(1)}'")
    print(f"Group 2 (paren part): '{either_match.group(2)}'")
    print(f"Group 2 length: {len(either_match.group(2))}")
else:
    print("Regex did not match")

print("\n" + "="*80 + "\n")

# Try a more robust regex that handles nested parentheses
either_match2 = re.search(r'and\s+either\s+(.*?)\s+or\s+\(([^)]*(?:\([^)]*\)[^)]*)*)\)', content_lower, re.DOTALL)
if either_match2:
    print("Robust regex matched!")
    print(f"Group 1 (either part): '{either_match2.group(1)}'")
    print(f"Group 2 (paren part): '{either_match2.group(2)}'")
else:
    print("Robust regex did not match")