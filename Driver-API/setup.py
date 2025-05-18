import subprocess
import sys
import pkg_resources
import os

def check_python_version():
    """Check if Python version is compatible"""
    required_version = (3, 8)
    current_version = sys.version_info[:2]
    
    if current_version < required_version:
        print(f"Error: Python {required_version[0]}.{required_version[1]} or higher is required")
        print(f"Current version: {current_version[0]}.{current_version[1]}")
        sys.exit(1)

def get_required_packages():
    """Read requirements from requirements.txt"""
    with open('requirements.txt', 'r') as f:
        requirements = []
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Remove any comments after the package name
                package = line.split('#')[0].strip()
                requirements.append(package)
        return requirements

def check_dependencies():
    """Check if all required packages are installed"""
    required = get_required_packages()
    installed = [pkg.key for pkg in pkg_resources.working_set]
    missing = []
    
    for package in required:
        # Extract package name without version
        package_name = package.split('>=')[0].split('==')[0].strip()
        if package_name.lower() not in [pkg.lower() for pkg in installed]:
            missing.append(package)
    
    return missing

def install_dependencies(packages):
    """Install missing dependencies"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + packages)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False

def main():
    print("Checking Python version...")
    check_python_version()
    
    print("Checking dependencies...")
    missing_packages = check_dependencies()
    
    if missing_packages:
        print("\nMissing packages:")
        for pkg in missing_packages:
            print(f"  - {pkg}")
        
        print("\nInstalling missing packages...")
        if install_dependencies(missing_packages):
            print("All dependencies installed successfully!")
        else:
            print("Failed to install some dependencies.")
            sys.exit(1)
    else:
        print("All required packages are already installed!")

    print("\nSetup complete! You can now run the application with:")
    print("python main.py")

if __name__ == "__main__":
    main()
