import os
import datetime
import random

# ✅ Set your local repository path (not GitHub URL)
repo_path = r"D:\Portfolio-Website-Abdullah\assets"  # Change this to your repo's local path
os.chdir(repo_path)  # Navigate to the repo

# ✅ Define the date range for commits
start_date = datetime.date(2026, 4, 12)  # Start date
end_date = datetime.date(2026, 6, 1)  # End date
delta = datetime.timedelta(days=1)  # Step by one day

while start_date <= end_date:
    # ✅ Randomly decide whether to commit on this day
    if random.choice([True, False]):  
        for _ in range(random.randint(1, 5)):  # 1 to 5 commits per day
            with open("dummy.txt", "a") as file:
                file.write(f"Commit on {start_date}\n")

            os.system(f'git add dummy.txt')
            os.system(f'git commit --date="{start_date} 12:00:00" -m "Commit on {start_date}"')

    start_date += delta  # Move to the next day

# ✅ Push commits to GitHub
os.system("git push origin main")  

print("✅ Automated commits pushed successfully!")
