import os
import random
import string
import subprocess

# Random commit message generator
def random_message(length=10):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

# 20 random commits
for i in range(20):
    # Dummy change in file
    with open("dummy.txt", "a") as f:
        f.write(f"Random line {i} - {random_message()}\n")
    
    # Git add and commit
    subprocess.run(["git", "add", "dummy.txt"])
    subprocess.run(["git", "commit", "-m", f"Random Commit {i+1}: {random_message()}"])

print("✅ 20 random commits done!")
