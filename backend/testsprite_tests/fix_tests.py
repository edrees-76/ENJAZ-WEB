import os
import glob

def fix_test_files():
    test_dir = r"d:\enjaz-web\backend\testsprite_tests"
    py_files = glob.glob(os.path.join(test_dir, "TC*.py"))
    
    count = 0
    for file_path in py_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Fix token keys (snake_case -> camelCase)
        content = content.replace('"access_token"', '"accessToken"')
        content = content.replace('"refresh_token"', '"refreshToken"')
        
        # 2. Fix empty samples array causing 400 Bad Request in TC008 and others
        content = content.replace('"samples": []', '"samples": [{"sampleName": "Test Sample", "description": "Test"}]')
        
        # 3. Fix passwords (ensure all use the recovery admin password)
        content = content.replace('"password": "admin"', '"password": "Edrees1222004"')
        content = content.replace('"password": "password"', '"password": "Edrees1222004"')
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {os.path.basename(file_path)}")
            count += 1
            
    print(f"Successfully updated {count} test files.")

if __name__ == "__main__":
    fix_test_files()
