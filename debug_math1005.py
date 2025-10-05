from parse_prerequisites_simple import SimplePrerequisiteParser

# Create a test version to debug the precedence issue
class DebugPrecedenceParser(SimplePrerequisiteParser):
    def ensure_proper_precedence(self, expression):
        """Debug version of ensure_proper_precedence."""
        print(f"INPUT: {expression}")
        
        if not expression or '||' not in expression or '&&' not in expression:
            print("EARLY RETURN: No mixed operators")
            return expression
        
        # If expression already has proper parenthesization (starts with ( and has balanced parens), don't modify
        if expression.startswith('(') and self.has_balanced_parentheses(expression):
            print("EARLY RETURN: Already properly parenthesized")
            return expression
        
        # Split by && only when it's outside parentheses
        parts = self.split_by_operator_outside_parens(expression, ' && ')
        print(f"SPLIT BY &&: {parts}")
        
        if len(parts) > 1:
            # Check each part - if it contains || and isn't already wrapped, wrap it
            processed_parts = []
            for i, part in enumerate(parts):
                part = part.strip()
                print(f"PART {i}: '{part}'")
                print(f"  Contains ||: {'||' in part}")
                print(f"  Starts with (: {part.startswith('(')}")
                print(f"  Ends with ): {part.endswith(')')}")
                
                if '||' in part and not (part.startswith('(') and part.endswith(')')):
                    wrapped = f"({part})"
                    print(f"  WRAPPING: {wrapped}")
                    processed_parts.append(wrapped)
                else:
                    print(f"  KEEPING: {part}")
                    processed_parts.append(part)
            
            result = ' && '.join(processed_parts)
            print(f"FINAL: {result}")
            return result
        
        print("NO CHANGE")
        return expression

# Test with MATH1005
parser = DebugPrecedenceParser()

with open('courses/math/math1005.html', 'r') as f:
    content = f.read()

result = parser.simplify_prerequisites(content)
print(f"\nFINAL RESULT: {result}")
print(f"EXPECTED: MATH1004 && (MATH1104 || MATH1107) || PERMISSION")