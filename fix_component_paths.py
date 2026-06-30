import os
import re

def fix_component_paths(directory):
    files_fixed = 0
    
    # We want to replace '@/frontend/components/' with '@/frontend/'
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
            
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Pattern matching
                    if '@/frontend/components/' in content:
                        new_content = content.replace('@/frontend/components/', '@/frontend/')
                        
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        
                        print(f"Fixed paths in {filepath}")
                        files_fixed += 1
                        
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
                    
    print(f"Total files fixed: {files_fixed}")

if __name__ == "__main__":
    fix_component_paths("e:\\Ai-Finance\\app")
    fix_component_paths("e:\\Ai-Finance\\backend")
    fix_component_paths("e:\\Ai-Finance\\frontend")
