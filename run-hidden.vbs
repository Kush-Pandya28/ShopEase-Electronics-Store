' Starts ShopEase in the background (no window). Used by auto-start and the Windows task.
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
cmd = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & folder & "\start.ps1"" -Hidden -NoBrowser"
CreateObject("WScript.Shell").Run cmd, 0, False
