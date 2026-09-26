# Win32 process-image approach adapted from active-win (MIT); see THIRD_PARTY_NOTICES.md.
# Collects executable names only, not browser titles or URLs.
$ErrorActionPreference='Stop'
try {
 Add-Type @"
using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;
public static class PetForeground {
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
 [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint access,bool inherit,uint pid);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] static extern bool QueryFullProcessImageName(IntPtr h,uint flags,StringBuilder name,ref uint length);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 public static string Name() {
  var window=GetForegroundWindow();if(window==IntPtr.Zero)return "";
  uint pid;GetWindowThreadProcessId(window,out pid);
  var process=OpenProcess(0x1000,false,pid);if(process==IntPtr.Zero)throw new Exception("process-query-failed");
  try {var name=new StringBuilder(32768);uint length=32768;if(!QueryFullProcessImageName(process,0,name,ref length))throw new Exception("process-path-failed");return Path.GetFileNameWithoutExtension(name.ToString()).ToLowerInvariant();}
  finally {CloseHandle(process);}
 }
}
"@
 $defaultBrowser=''
 try {
  $progId=(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice').ProgId
  $command=(Get-Item ('Registry::HKEY_CLASSES_ROOT\'+$progId+'\shell\open\command')).GetValue('')
  if($command -match '^"([^"]+\.exe)"'){$defaultBrowser=[IO.Path]::GetFileNameWithoutExtension($Matches[1]).ToLowerInvariant()}
  elseif($command -match '^(\S+\.exe)'){$defaultBrowser=[IO.Path]::GetFileNameWithoutExtension($Matches[1]).ToLowerInvariant()}
  if($defaultBrowser -in @('explorer','rundll32','msedgewebview2')){$defaultBrowser=''}
 } catch {}
 $previous='' 
 while($true){
  try {
   $name=[PetForeground]::Name()
   $browser=$name -in @('chrome','msedge','firefox','brave','opera','vivaldi','arc','browser','chromium','whale','sogouexplorer','liebao','360chrome','360se','qqbrowser','zen','waterfox','floorp','tabbit browser','tabbit') -or ($defaultBrowser -ne '' -and $name -eq $defaultBrowser)
   $line=@{status='ok';browser=$browser;processName=$name}|ConvertTo-Json -Compress
   if($line -ne $previous){[Console]::Out.WriteLine($line);[Console]::Out.Flush();$previous=$line}
  } catch {[Console]::Out.WriteLine('{"status":"error"}');[Console]::Out.Flush()}
  Start-Sleep -Milliseconds 250
 }
} catch {[Console]::Error.WriteLine('foreground-startup-failed');exit 1}
