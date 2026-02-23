@echo off
cd C:\Users\user\orchids-projects\purple-tiglon
git add .
git commit -m "Fix Vercel deployment: move deps to root, add api/index.js"
git push origin main
echo DONE
