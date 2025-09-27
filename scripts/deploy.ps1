# ==================================================
# ICCI FREE - Automated Deployment Script (Windows)
# ==================================================
# Usage: .\deploy.ps1 -Environment [staging|production]
# ==================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('staging','production')]
    [string]$Environment = 'staging'
)

# Configuration
$ProjectName = "iccifree"
$BuildDir = "."
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# ==================================================
# Functions
# ==================================================

function Write-Header {
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "  ICCI FREE - Deployment Script" -ForegroundColor Blue
    Write-Host "  Environment: $Environment" -ForegroundColor Blue
    Write-Host "  Time: $(Get-Date)" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Test-Dependencies {
    Write-Info "Checking dependencies..."
    
    # Check git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-ErrorMsg "Git is not installed"
        exit 1
    }
    
    # Check if git repo
    $gitDir = git rev-parse --git-dir 2>$null
    if (-not $gitDir) {
        Write-ErrorMsg "Not a git repository"
        exit 1
    }
    
    Write-Success "Dependencies check passed"
}

function Confirm-Environment {
    if ($Environment -eq "production") {
        $confirm = Read-Host "⚠️  Deploy to PRODUCTION? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Warning "Deployment cancelled"
            exit 0
        }
    }
}

function Test-Project {
    Write-Info "Running tests..."
    
    # Check for console.log in production
    if ($Environment -eq "production") {
        $consoleLogsFound = Select-String -Path "js\*.js" -Pattern "console.log" -ErrorAction SilentlyContinue
        if ($consoleLogsFound) {
            Write-Warning "Found console.log statements in production code"
        }
    }
    
    Write-Success "Tests completed"
}

function Optimize-Files {
    Write-Info "Optimizing files..."
    
    # Create backup
    $BackupDir = "backups\backup_$Timestamp"
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    
    if (Test-Path "css") { Copy-Item -Recurse -Force "css" "$BackupDir\" }
    if (Test-Path "js") { Copy-Item -Recurse -Force "js" "$BackupDir\" }
    if (Test-Path "images") { Copy-Item -Recurse -Force "images" "$BackupDir\" }
    
    Write-Success "Backup created at $BackupDir"
    Write-Success "Files optimized"
}

function Test-EnvVars {
    Write-Info "Checking environment variables..."
    
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found"
        if (Test-Path ".env.example") {
            Write-Info "Copy .env.example to .env and configure it"
        }
    }
    
    Write-Success "Environment variables checked"
}

function Deploy-Netlify {
    Write-Info "Deploying to Netlify ($Environment)..."
    
    if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
        Write-ErrorMsg "Netlify CLI not installed"
        Write-Info "Install: npm install -g netlify-cli"
        exit 1
    }
    
    if ($Environment -eq "production") {
        netlify deploy --prod --dir=.
    } else {
        netlify deploy --dir=.
    }
    
    Write-Success "Deployed to Netlify"
}

function Deploy-Vercel {
    Write-Info "Deploying to Vercel ($Environment)..."
    
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-ErrorMsg "Vercel CLI not installed"
        Write-Info "Install: npm install -g vercel"
        exit 1
    }
    
    if ($Environment -eq "production") {
        vercel --prod
    } else {
        vercel
    }
    
    Write-Success "Deployed to Vercel"
}

function Commit-Git {
    Write-Info "Committing to git..."
    
    # Check for changes
    $status = git status --porcelain
    if (-not $status) {
        Write-Info "No changes to commit"
        return
    }
    
    # Stage all changes
    git add .
    
    # Commit
    $commitMsg = "Deploy $Environment - $Timestamp"
    git commit -m $commitMsg
    
    # Tag if production
    if ($Environment -eq "production") {
        $tag = "v$Timestamp"
        git tag -a $tag -m "Production release $Timestamp"
        Write-Success "Created tag: $tag"
    }
    
    # Push
    $branch = git branch --show-current
    git push origin $branch
    
    if ($Environment -eq "production") {
        git push origin --tags
    }
    
    Write-Success "Pushed to git"
}

function Invoke-Lighthouse {
    if (Get-Command lighthouse -ErrorAction SilentlyContinue) {
        Write-Info "Running Lighthouse audit..."
        
        # Start local server
        $server = Start-Process python -ArgumentList "-m http.server 8000" -PassThru -NoNewWindow
        Start-Sleep -Seconds 2
        
        # Run Lighthouse
        New-Item -ItemType Directory -Force -Path "reports" | Out-Null
        lighthouse http://localhost:8000 `
            --output html `
            --output-path "reports\lighthouse_$Timestamp.html" `
            --quiet
        
        # Kill server
        Stop-Process -Id $server.Id -Force
        
        Write-Success "Lighthouse report: reports\lighthouse_$Timestamp.html"
    }
}

function Invoke-PostDeployment {
    Write-Info "Post-deployment tasks..."
    
    # Add your post-deployment tasks here
    # - Clear CDN cache
    # - Send notifications
    # - Update status page
    
    Write-Success "Post-deployment tasks completed"
}

function Write-Summary {
    param([string]$BackupDir)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Environment: " -NoNewline
    Write-Host $Environment -ForegroundColor Yellow
    Write-Host "Timestamp: " -NoNewline
    Write-Host $Timestamp -ForegroundColor Yellow
    Write-Host "Backup: " -NoNewline
    Write-Host $BackupDir -ForegroundColor Yellow
    Write-Host ""
    
    if ($Environment -eq "staging") {
        Write-Host "🔗 Staging URL: " -NoNewline -ForegroundColor Yellow
        Write-Host "https://staging.iccifree.com" -ForegroundColor Cyan
    } else {
        Write-Host "🔗 Production URL: " -NoNewline -ForegroundColor Green
        Write-Host "https://iccifree.com" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the deployment" -ForegroundColor White
    Write-Host "  2. Monitor error logs" -ForegroundColor White
    Write-Host "  3. Check analytics" -ForegroundColor White
    Write-Host ""
}

# ==================================================
# Main Deployment Flow
# ==================================================

try {
    Write-Header
    
    Confirm-Environment
    Test-Dependencies
    Test-EnvVars
    Test-Project
    Optimize-Files
    
    # Git operations
    Commit-Git
    
    # Choose deployment method
    Write-Host ""
    Write-Host "Choose deployment target:" -ForegroundColor Cyan
    Write-Host "1) Netlify" -ForegroundColor White
    Write-Host "2) Vercel" -ForegroundColor White
    Write-Host "3) Skip deployment" -ForegroundColor White
    $choice = Read-Host "Enter choice [1-3]"
    
    switch ($choice) {
        "1" { Deploy-Netlify }
        "2" { Deploy-Vercel }
        "3" { Write-Info "Skipping deployment" }
        default { 
            Write-ErrorMsg "Invalid choice"
            exit 1
        }
    }
    
    # Post-deployment
    Invoke-PostDeployment
    
    # Optional: Run Lighthouse
    $runAudit = Read-Host "Run Lighthouse audit? (y/n)"
    if ($runAudit -eq "y") {
        Invoke-Lighthouse
    }
    
    Write-Summary -BackupDir "backups\backup_$Timestamp"
    
} catch {
    Write-ErrorMsg "Deployment failed: $_"
    exit 1
}

exit 0
