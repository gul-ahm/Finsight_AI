import os
import re

directories = [r'e:\Ai-Finance\frontend', r'e:\Ai-Finance\app']
updated_files = []

for d in directories:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(('.ts', '.tsx')):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Replace "/api/ with "/finsight-ai/api/
                # Replace `/api/ with `/finsight-ai/api/
                # Replace '/api/ with '/finsight-ai/api/
                
                new_content = re.sub(r'(["\'`])/api/', r'\1/finsight-ai/api/', content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    updated_files.append(path)

print(f"Updated {len(updated_files)} files.")
for f in updated_files:
    print(f)
