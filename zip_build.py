
import shutil
import os

source_dir = os.path.join(os.getcwd(), '.next', 'standalone')
output_filename = os.path.join(os.getcwd(), 'deploy_package')

shutil.make_archive(output_filename, 'zip', source_dir)
print(f"Created {output_filename}.zip")
