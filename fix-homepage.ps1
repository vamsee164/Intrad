# Fix corrupted homepage HTML
$file = "src\app\FPC\Homepage\homepage.component.html"
$lines = Get-Content $file

# Find the line index of "<!-- Forgot Password Modal -->" (0-indexed)
$forgotIdx = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "Forgot Password Modal") {
        $forgotIdx = $i
        break
    }
}

Write-Host "Forgot Password Modal found at line: $($forgotIdx + 1)"

# Keep lines 1-418 (indices 0-417) and from forgotIdx onwards
$clean = $lines[0..417] + $lines[$forgotIdx..($lines.Length - 1)]

$clean | Set-Content $file -Encoding UTF8
Write-Host "Done. Total lines: $($clean.Length)"
