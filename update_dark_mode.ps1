$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

$replacements = @{
    '\bbg-white\b' = 'bg-white dark:bg-slate-900'
    '\bbg-slate-50\b' = 'bg-slate-50 dark:bg-slate-800'
    '\bbg-slate-100\b' = 'bg-slate-100 dark:bg-slate-800'
    '\bbg-slate-200\b' = 'bg-slate-200 dark:bg-slate-700'
    '\btext-slate-900\b' = 'text-slate-900 dark:text-white'
    '\btext-slate-800\b' = 'text-slate-800 dark:text-slate-100'
    '\btext-slate-700\b' = 'text-slate-700 dark:text-slate-200'
    '\btext-slate-600\b' = 'text-slate-600 dark:text-slate-300'
    '\btext-slate-500\b' = 'text-slate-500 dark:text-slate-400'
    '\bborder-slate-100\b' = 'border-slate-100 dark:border-slate-700'
    '\bborder-slate-200\b' = 'border-slate-200 dark:border-slate-700'
    '\bborder-slate-300\b' = 'border-slate-300 dark:border-slate-600'
}

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw

    foreach ($key in $replacements.Keys) {
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $key, $replacements[$key])
    }
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
Write-Output "Done applying Dark Mode utility classes!"
