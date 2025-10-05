#!/usr/bin/env python3

import os
import requests
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

def create_directories(course_codes):
    """Create directories for each unique subject code under courses/."""
    subjects = set()
    for course in course_codes:
        # Extract subject (first 4 letters)
        subject = course[:4].lower()
        subjects.add(subject)
    
    # Create main courses directory
    os.makedirs("courses", exist_ok=True)
    
    for subject in subjects:
        subject_path = f"courses/{subject}"
        os.makedirs(subject_path, exist_ok=True)
        print(f"Created/verified directory: {subject_path}/")
    
    return subjects

def download_course_html(course_code):
    """
    Download HTML for a single course code.
    
    Args:
        course_code: Course code like 'SYSC4907'
    """
    # Extract subject and number
    subject = course_code[:4]
    number = course_code[4:]
    
    # Construct URL - format: https://calendar.carleton.ca/search/?P=SYSC%202301
    url = f"https://calendar.carleton.ca/search/?P={subject}%20{number}"
    
    # Create filename path in courses subdirectory
    subject_lower = subject.lower()
    filename = f"courses/{subject_lower}/{course_code.lower()}.html"
    
    try:
        # Simplified output for parallel downloads
        print(f"Downloading {course_code}...", end=" ", flush=True)
        
        # Make request with proper headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Save HTML content
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"✓ Saved to {filename}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Error downloading {course_code}: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error for {course_code}: {e}")
        return False

def main():
    # Use test file for testing
    input_file = "test_courses.txt"
    
    # Read course codes
    try:
        with open(input_file, 'r') as f:
            course_codes = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
        return
    
    print(f"Found {len(course_codes)} course codes to download (test run)")
    
    # Create directories
    subjects = create_directories(course_codes)
    print(f"Created directories for {len(subjects)} subjects: {sorted(subjects)}")
    
    # Download HTML for all courses in parallel
    successful = 0
    failed = 0
    
    print(f"Starting parallel downloads...")
    
    # Use ThreadPoolExecutor for concurrent downloads
    with ThreadPoolExecutor(max_workers=10) as executor:
        # Submit all download tasks
        future_to_course = {executor.submit(download_course_html, course): course for course in course_codes}
        
        # Process completed downloads
        for future in as_completed(future_to_course):
            course_code = future_to_course[future]
            try:
                if future.result():
                    successful += 1
                else:
                    failed += 1
            except Exception as exc:
                print(f'Course {course_code} generated an exception: {exc}')
                failed += 1
    
    print(f"\nDownload complete!")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Total: {len(course_codes)}")

if __name__ == "__main__":
    main()