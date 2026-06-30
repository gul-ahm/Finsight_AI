import os
import re

def fix_mixed_quotes(directory):
    files_fixed = 0
    
    # Generic regex for mixed quotes ending with semicolon
    # Matches: "something'; -> "something";
    p1 = re.compile(r'("[^"]*)\';') 
    # Matches: 'something"; -> 'something';
    p2 = re.compile(r"('[^']*)\";")
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
            
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    new_lines = []
                    modified = False
                    
                    for i, line in enumerate(lines):
                        original_line = line
                        
                        # Apply fix 1: " ... '; -> " ... ";
                        line = p1.sub(r'\1";', line)
                        
                        # Apply fix 2: ' ... "; -> ' ... ';
                        line = p2.sub(r"\1';", line)
                        
                        if line != original_line:
                            modified = True
                            print(f"Fixed {filepath}:{i+1}")
                        
                        new_lines.append(line)
                    
                    if modified:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.writelines(new_lines)
                        files_fixed += 1
                        
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
                    
    print(f"Total files fixed: {files_fixed}")

if __name__ == "__main__":
    fix_mixed_quotes("e:\\Ai-Finance\\app")
    fix_mixed_quotes("e:\\Ai-Finance\\frontend")
    fix_mixed_quotes("e:\\Ai-Finance\\backend")
