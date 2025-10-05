import re

def ensure_proper_precedence(expression):
    """Ensure proper logical precedence by wrapping OR groups when followed by AND."""
    print(f"Input: {expression}")
    
    if not expression or '||' not in expression or '&&' not in expression:
        print("Early return - no mixed operators")
        return expression
    
    # If expression already has proper parenthesization (starts with ( and has balanced parens), don't modify
    if expression.startswith('(') and has_balanced_parentheses(expression):
        # Check if the main structure is already properly grouped
        print("Early return - already properly parenthesized")
        return expression
    
    # If we have a mix of || and && without proper grouping, wrap OR sequences
    # Pattern: A || B || C && D should become (A || B || C) && D
    parts = expression.split(' && ')
    print(f"Parts after splitting by ' && ': {parts}")
    
    if len(parts) > 1:
        # Check each part - if it contains || and isn't already wrapped, wrap it
        processed_parts = []
        for i, part in enumerate(parts):
            part = part.strip()
            print(f"Processing part {i}: '{part}'")
            print(f"  Contains ||: {'||' in part}")
            print(f"  Starts with (: {part.startswith('(')}")
            print(f"  Ends with ): {part.endswith(')')}")
            
            if '||' in part and not (part.startswith('(') and part.endswith(')')):
                wrapped = f"({part})"
                print(f"  Wrapping: {wrapped}")
                processed_parts.append(wrapped)
            else:
                print(f"  Keeping as-is: {part}")
                processed_parts.append(part)
        
        result = ' && '.join(processed_parts)
        print(f"Final result: {result}")
        return result
    
    return expression

def has_balanced_parentheses(expression):
    """Check if parentheses are balanced in the expression."""
    count = 0
    for char in expression:
        if char == '(':
            count += 1
        elif char == ')':
            count -= 1
        if count < 0:
            return False
    return count == 0

# Test with COMP3005 result
test_expr = "COMP1805[C-] && (COMP2402 || (SYSC2004 && SYSC2100))"
result = ensure_proper_precedence(test_expr)
print(f"\nOriginal: {test_expr}")
print(f"Result:   {result}")
print(f"Changed:  {test_expr != result}")