@echo off
echo Deleting node_modules...
rmdir /s /q node_modules 2>nul
if exist node_modules (
    echo Some files could not be deleted - they may be in use
    echo Please close any programs using these files and try again
) else (
    echo node_modules deleted successfully!
)
echo.
echo Frontend folder is ready for GitHub!
echo.
echo Next steps:
echo 1. git init
echo 2. git add .
echo 3. git commit -m "Initial commit"
echo 4. Create GitHub repo and push
pause
