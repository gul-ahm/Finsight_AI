
import tarfile
import os

source_dir = os.path.join(os.getcwd(), '.next', 'standalone')
output_filename = os.path.join(os.getcwd(), 'deploy_package.tar.gz')

def make_tarfile(output_filename, source_dir):
    with tarfile.open(output_filename, "w:gz") as tar:
        tar.add(source_dir, arcname=os.path.basename(source_dir))

print(f"Creating {output_filename}...")
make_tarfile(output_filename, source_dir)
print(f"Created {output_filename}")
