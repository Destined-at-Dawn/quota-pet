param([Parameter(Mandatory=$true)][string]$JobFile)
$ErrorActionPreference='Stop'
$job=Get-Content -LiteralPath $JobFile -Raw -Encoding UTF8 | ConvertFrom-Json
$log=Join-Path (Split-Path -Parent $JobFile) 'result.json'
$moved=$false; $installed=$false; $child=$null
function Result($status,$reason){ @{status=$status;reason=$reason;version=$job.version} | ConvertTo-Json | Set-Content -LiteralPath $log -Encoding UTF8 }
try {
 if($job.id -notmatch '^[a-f0-9-]{36}$'){throw 'INVALID_ID'}
 $root=[IO.Path]::GetFullPath($job.root); $resources=Join-Path $root 'resources'; $target=[IO.Path]::GetFullPath($job.target)
 if($target -ne (Join-Path $resources 'app') -or [IO.Path]::GetFullPath($job.exe) -ne (Join-Path $root 'QuotaPet.exe')){throw 'INVALID_ROOT'}
 foreach($p in @($root,$resources,$target)){if((Get-Item -LiteralPath $p).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'REPARSE_ROOT'}}
 $stage=Join-Path $resources ('.app-update-'+$job.id);$backup=Join-Path $resources ('.app-before-'+$job.id)
 foreach($p in @($stage,$backup)){if([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($p)) -ne $resources -or (Test-Path -LiteralPath $p)){throw 'INVALID_STAGE'}}
 $archiveHash=([System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([IO.File]::ReadAllBytes([string]$job.archive))).Replace('-', '').ToLowerInvariant())
 if($archiveHash -ne $job.sha256){throw 'ARCHIVE_CHANGED'}
 New-Item -ItemType Directory -Path $stage | Out-Null
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $zip=[IO.Compression.ZipFile]::OpenRead($job.archive);$total=0
 try{foreach($entry in $zip.Entries){
  $name=$entry.FullName.Replace('/',[IO.Path]::DirectorySeparatorChar)
  if([IO.Path]::IsPathRooted($name) -or $name.Contains(':') -or $name.Split('\') -contains '..' -or (($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960){throw 'INVALID_ARCHIVE_PATH'}
  $dest=[IO.Path]::GetFullPath((Join-Path $stage $name));if(-not $dest.StartsWith($stage+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'ARCHIVE_ESCAPE'}
  $total+=$entry.Length;if($total -gt 536870912){throw 'ARCHIVE_TOO_LARGE'}
  if($entry.Name -eq ''){New-Item -ItemType Directory -Force -Path $dest | Out-Null;continue}
  New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($dest)) | Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$dest,$false)
 }}finally{$zip.Dispose()}
 $package=Get-Content -LiteralPath (Join-Path $stage 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 if($package.name -ne 'quota-pet' -or $package.version -ne $job.version -or $package.main -ne 'main.js' -or -not (Test-Path -LiteralPath (Join-Path $stage 'main.js'))){throw 'INVALID_APP'}
 # Never replace running code. The main process exits voluntarily; no broad process kill.
 $parent=Get-Process -Id $job.parentPid -ErrorAction SilentlyContinue
 if($parent){if($parent.Path -ne $job.exe){throw 'PARENT_CHANGED'};Wait-Process -Id $job.parentPid -Timeout 90 -ErrorAction Stop}
 Move-Item -LiteralPath $target -Destination $backup;$moved=$true
 Move-Item -LiteralPath $stage -Destination $target;$installed=$true
 $argument='--update-health='+$job.id
 $child=Start-Process -FilePath $job.exe -ArgumentList $argument -WorkingDirectory $root -WindowStyle Hidden -PassThru
 $deadline=(Get-Date).AddSeconds(60);$healthy=$false
 while((Get-Date) -lt $deadline){if(Test-Path -LiteralPath $job.marker){$health=Get-Content -LiteralPath $job.marker -Raw -Encoding UTF8 | ConvertFrom-Json;if($health.healthy -and $health.version -eq $job.version -and $health.pid -eq $child.Id){$healthy=$true;break}};if($child.HasExited){break};Start-Sleep -Milliseconds 300}
 if(-not $healthy){throw 'NEW_APP_NOT_HEALTHY'}
 Result 'installed' 'HEALTHY';exit 0
}catch{
 $reason=$_.Exception.Message
 if($moved){
  if($child -and -not $child.HasExited){$running=Get-Process -Id $child.Id -ErrorAction SilentlyContinue;if($running -and $running.Path -eq $job.exe){Stop-Process -Id $child.Id -Force;Start-Sleep -Milliseconds 500}}
  try{
   if($installed -and (Test-Path -LiteralPath $target)){Move-Item -LiteralPath $target -Destination (Join-Path $resources ('.app-failed-'+$job.id))}
   Move-Item -LiteralPath $backup -Destination $target
   Start-Process -FilePath $job.exe -WorkingDirectory $root -WindowStyle Hidden
   Result 'restored' $reason
  }catch{Result 'restore_failed' $_.Exception.Message;exit 2}
 }else{Result 'unchanged' $reason}
 exit 1
}

