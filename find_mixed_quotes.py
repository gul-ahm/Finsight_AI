import os
import re

def find_mixed_quotes(directory):
    # Aggressive mixed quote finder
    # Finds "text' or 'text"
    # Logic: Start quote, any content (lazy), next char must NOT be start quote, but MUST be a quote.
    # We ignore escaped occurrences usually, but for simple strings it's fine.
    # Warning: This might match "It's" as "It's" ... wait.
    # "It's" -> start ", content It, next '. Not start. End match '. Match "It's"
    # So valid strings like "It's time" might match "It's".
    # We need to be careful.
    # But usually code strings don't have unescaped quotes inside unless strictly necessary.
    # And most of our errors are at END of line or import paths which don't have Apostrophes.
    
    # Let's filter for "; at the end or inside imports to be safe.
    
    # Pattern: quote, content without quotes (or assuming valid), diff quote.
    # Actually, simpler:
    # " ... ';
    # ' ... ";
    
    p1 = re.compile(r'"[^"]*\';') # Double then Single, ending with semi-colon (common in code)
    p2 = re.compile(r"'[^']*\";") # Single then Double, ending with semi-colon
    
    files_found = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        
                    for i, line in enumerate(lines):
                        if p1.search(line) or p2.search(line):
                            print(f"{filepath}:{i+1}: {line.strip()}")
                            files_found += 1
                                
                except Exception as e:
                    pass

if __name__ == "__main__":
    find_mixed_quotes("e:\\Ai-Finance\\app")
    find_mixed_quotes("e:\\Ai-Finance\\frontend")
    find_mixed_quotes("e:\\Ai-Finance\\backend")
