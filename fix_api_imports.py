import os
import re

def fix_api_imports(directory):
    # Map module names to their new locations
    # Key: module filename (without extension), Value: new import path
    mappings = {
        'alphaVantage': '@/backend/alphaVantage',
        'binance': '@/backend/binance',
        'market-intelligence': '@/backend/market-intelligence',
        'themes': '@/backend/themes',
        'db': '@/backend/db',
        'prisma': '@/backend/db',
        'utils': '@/backend/utils',
        'auth-utils': '@/backend/auth-utils',
        'rate-limit': '@/backend/rate-limit',
        'rate-limiter': '@/backend/rate-limiter',
        'sanitize': '@/backend/sanitize',
        'validators': '@/backend/validators',
        'price-service': '@/backend/price-service',
        'env-validation': '@/backend/env-validation',
        'export-utils': '@/backend/export-utils',
        'api-client': '@/backend/api-client',
        'auth': '@/backend/auth',
    }

    files_fixed = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    new_lines = []
                    modified = False
                    
                    for line in lines:
                        original_line = line
                        # Check for relative imports like ../../../lib/module
                        # Regex to capture the module name
                        match = re.search(r'from\s+[\'"](\.\./+)(?:lib/)?([\w-]+)[\'"]', line)
                        if match:
                            module_name = match.group(2)
                            if module_name in mappings:
                                new_path = mappings[module_name]
                                # Create replacement regex
                                # patterns: ../../../lib/mod, ../../lib/mod, ../mod, etc.
                                pattern = r'[\'"](\.\./+)(?:lib/)?' + re.escape(module_name) + r'[\'"]'
                                replacement = f'"{new_path}"'
                                line = re.sub(pattern, replacement, line)
                        
                        if line != original_line:
                            modified = True
                            print(f"Fixed {filepath}: {line.strip()}")
                        
                        new_lines.append(line)
                    
                    if modified:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.writelines(new_lines)
                        files_fixed += 1
                        
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
                    
    print(f"Total files fixed: {files_fixed}")

if __name__ == "__main__":
    fix_api_imports("e:\\Ai-Finance\\app\\api")
