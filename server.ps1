# =============================================================================
# Nexora - Localhost Web Server (Pure Windows / PowerShell)
# =============================================================================
# Language: Windows PowerShell 5.1+
# Purpose: Starts an instant localhost HTTP server on port 8080 using the built-in
#          .NET System.Net.HttpListener (no Node.js, Python, or external tools required!)
# =============================================================================

# Line 1: Define port number where the server will listen
$Port = 8080

# Line 2: Define prefix URL for the HTTP listener
$Prefix = "http://localhost:$Port/"

# Line 3: Determine the root folder (directory where this script lives)
$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = Get-Location }

# Line 4: Hash table mapping file extensions to standard MIME Content-Types
# This tells web browsers how to handle HTML, CSS, JavaScript, audio, and video files
$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"          # HTML document
    ".htm"  = "text/html; charset=utf-8"          # Alternate HTML document
    ".css"  = "text/css; charset=utf-8"           # Cascading Style Sheets
    ".js"   = "application/javascript; charset=utf-8" # JavaScript application code
    ".json" = "application/json; charset=utf-8"   # JSON API data
    ".png"  = "image/png"                         # PNG image format
    ".jpg"  = "image/jpeg"                        # JPEG image format
    ".jpeg" = "image/jpeg"                        # JPEG image format
    ".svg"  = "image/svg+xml"                     # SVG vector icon format
    ".wav"  = "audio/wav"                         # Uncompressed WAV audio
    ".mp3"  = "audio/mpeg"                        # MP3 compressed audio
    ".m4a"  = "audio/mp4"                         # AAC/M4A high-quality audio
    ".aac"  = "audio/aac"                         # AAC audio stream
    ".ogg"  = "audio/ogg"                         # OGG Vorbis audio
    ".webm" = "video/webm"                        # WebM video recording
    ".mp4"  = "video/mp4"                         # MP4 video format
}

# Line 5: Create a new .NET HttpListener object
$Listener = New-Object System.Net.HttpListener

# Line 6: Add the listening prefix (http://localhost:8080/)
$Listener.Prefixes.Add($Prefix)

try {
    # Line 7: Start listening for incoming HTTP connections
    $Listener.Start()

    # Line 8: Display startup banner in console
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "   === Nexora Localhost Server Running! ===" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "-> Localhost URL: $Prefix" -ForegroundColor Yellow
    Write-Host "-> Serving folder: $RootDir" -ForegroundColor Gray
    Write-Host "=========================================================" -ForegroundColor Green

    # Line 9: Main request loop (runs continuously while server is listening)
    while ($Listener.IsListening) {
        try {
            # Line 10: Wait synchronously for the next incoming browser request
            $Context = $Listener.GetContext()
            $Request = $Context.Request
            $Response = $Context.Response

            # Line 11: Get requested relative URL path (e.g. "/index.html" or "/audio/kesariya.m4a")
            $LocalPath = $Request.Url.LocalPath

            # Line 12: If requested path is root "/", default to "/index.html"
            if ($LocalPath -eq "/" -or [string]::IsNullOrWhiteSpace($LocalPath)) {
                $LocalPath = "/index.html"
            }

            # Line 13: Handle API status check endpoint (/api/status)
            if ($LocalPath -eq "/api/status") {
                $json = '{"status":"online","server":"Nexora Native Server","port":8080}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.Headers.Add("Access-Control-Allow-Origin", "*")
                $Response.ContentLength64 = $bytes.Length
                $Response.OutputStream.Write($bytes, 0, $bytes.Length)
                $Response.Close()
                continue
            }

            # Line 14: Combine root folder with relative file path
            $FilePath = Join-Path $RootDir $LocalPath.TrimStart('/')

            # Line 15: Check if the requested file exists on disk
            if (Test-Path -Path $FilePath -PathType Leaf) {
                # Line 16: Identify file extension and corresponding MIME Content-Type
                $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
                $ContentType = $MimeTypes[$Ext]
                if (-not $ContentType) { $ContentType = "application/octet-stream" }

                # Line 17: Read file bytes from disk
                $Bytes = [System.IO.File]::ReadAllBytes($FilePath)

                # Line 18: Set HTTP response headers (ContentType, CORS, ContentLength, Status 200)
                $Response.ContentType = $ContentType
                $Response.Headers.Add("Access-Control-Allow-Origin", "*")
                $Response.ContentLength64 = $Bytes.Length
                $Response.StatusCode = 200

                # Line 19: Stream file bytes to browser and close connection
                $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            } else {
                # Line 20: File not found - return HTTP 404 status
                $Response.StatusCode = 404
                $NotFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $LocalPath")
                $Response.OutputStream.Write($NotFoundBytes, 0, $NotFoundBytes.Length)
            }
            $Response.Close()
        } catch {
            # Continue listening loop even if an individual request encounters an error
        }
    }
} finally {
    # Line 21: Stop listener when script terminates
    if ($Listener.IsListening) {
        $Listener.Stop()
    }
}
