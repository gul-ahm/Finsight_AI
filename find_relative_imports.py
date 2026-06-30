import os
import re

def find_relative_imports(directory):
    # Matches import ... from "../..." or '.. / ...'
    # Pattern: from\s+['"]\.\./
    p = re.compile(r'from\s+[\'"]\.\./')
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if p.search(line):
                                print(f"{filepath}:{i+1}: {line.strip()}")
                except Exception as e:
                    pass

if __name__ == "__main__":
    find_relative_imports("e:\\Ai-Finance\\app\\api")
