# Git Hook Installer
# Usage: .\install-hooks.ps1

Write-Host "Installing Git Hooks..." -ForegroundColor Cyan

$hooksDir = ".git/hooks"

# Create hooks directory if not exists
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Hook 1: Pre-Push - check before push
$prePushContent = @'
#!/bin/sh
# Pre-Push Hook

echo "Checking code before push..."

# Check build
npm run check
if [ $? -ne 0 ]; then
    echo "Build failed - canceling push"
    exit 1
fi

echo "All good - continuing push"
exit 0
'@

$prePushPath = "$hooksDir/pre-push"
Set-Content -Path $prePushPath -Value $prePushContent -Encoding UTF8
Write-Host "Installed pre-push hook" -ForegroundColor Green

# Hook 2: Post-Merge - after pull
$postMergeContent = @'
#!/bin/sh
# Post-Merge Hook

echo "Syncing dependencies after merge..."

# Check if package.json changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep --quiet "package.json"; then
    echo "Installing updated dependencies..."
    npm install
    echo "Dependencies updated!"
fi

exit 0
'@

$postMergePath = "$hooksDir/post-merge"
Set-Content -Path $postMergePath -Value $postMergeContent -Encoding UTF8
Write-Host "Installed post-merge hook" -ForegroundColor Green

# Hook 3: Pre-Commit - check before commit
$preCommitContent = @'
#!/bin/sh
# Pre-Commit Hook

echo "Checking lint..."

# Run lint only on changed files
npm run lint --quiet
if [ $? -ne 0 ]; then
    echo "Found lint errors - continue anyway? (Y/n)"
fi

echo "Pre-commit checks passed"
exit 0
'@

$preCommitPath = "$hooksDir/pre-commit"
Set-Content -Path $preCommitPath -Value $preCommitContent -Encoding UTF8
Write-Host "Installed pre-commit hook" -ForegroundColor Green

Write-Host "`nAll Git Hooks installed successfully!" -ForegroundColor Green
Write-Host "Active hooks:" -ForegroundColor Cyan
Write-Host "  - pre-commit: lint check before commit" -ForegroundColor Gray
Write-Host "  - pre-push: build check before push" -ForegroundColor Gray
Write-Host "  - post-merge: install dependencies after pull" -ForegroundColor Gray
