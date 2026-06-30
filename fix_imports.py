import os

root_dir = r"e:\Ai-Finance"
skip_dirs = {"node_modules", ".git", ".next"}

for root, dirs, files in os.walk(root_dir):
    # Modify dirs in-place to skip unwanted directories
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx")):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Replace incorrect import path
                new_content = content.replace("@/backend/lib/", "@/backend/")
                new_content = new_content.replace("@/frontend/components/ui/", "@/frontend/ui/")
                new_content = new_content.replace("@/components/ui/", "@/frontend/ui/")
                
                if new_content != content:
                    print(f"Fixing: {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

print("Import fix completed.")
