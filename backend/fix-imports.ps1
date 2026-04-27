$files = Get-ChildItem -Path 'src\controllers','src\services','src\middlewares' -Filter '*.ts' -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content `
        -replace "from '../config/prisma'", "from '../config/prisma.ts'" `
        -replace "from '../middlewares/auth.middleware'", "from '../middlewares/auth.middleware.ts'" `
        -replace "from '../services/socket.service'", "from '../services/socket.service.ts'" `
        -replace "from '../services/fare.service'", "from '../services/fare.service.ts'"
    if ($content -ne $newContent) {
        Set-Content $file.FullName $newContent -NoNewline
        Write-Host ("Fixed: " + $file.Name)
    }
}
Write-Host "All done"
