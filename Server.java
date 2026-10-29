// =============================================================================
// Nexora Media Studio - Java Backend Web Server
// =============================================================================
// Language: Java (Standard Edition - Java SE 8+)
// Purpose: Built-in HTTP server that serves HTML, CSS, JavaScript,
//          audio files (.m4a, .wav), and video files (.mp4, .webm).
// Note: Runs on pure Java SE without external libraries (no Maven or Tomcat).
// =============================================================================

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;

/**
 * Main Server Class
 * Starts a native HTTP server on port 8080 to serve Nexora files to browsers.
 */
public class Server {
    // Port number for the server: http://localhost:8080
    private static final int PORT = 8080;

    // Root folder containing website files ("." means current directory)
    private static final String ROOT_DIR = ".";

    // Lookup map for matching file extensions to HTTP MIME Content-Types
    private static final Map<String, String> MIME_TYPES = new HashMap<>();

    static {
        // Web text documents
        MIME_TYPES.put("html", "text/html; charset=UTF-8");
        MIME_TYPES.put("css",  "text/css; charset=UTF-8");
        MIME_TYPES.put("js",   "application/javascript; charset=UTF-8");
        MIME_TYPES.put("json", "application/json; charset=UTF-8");

        // Images
        MIME_TYPES.put("png",  "image/png");
        MIME_TYPES.put("jpg",  "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("svg",  "image/svg+xml");

        // Audio files for music playback and editing
        MIME_TYPES.put("mp3",  "audio/mpeg");
        MIME_TYPES.put("m4a",  "audio/mp4");
        MIME_TYPES.put("aac",  "audio/aac");
        MIME_TYPES.put("wav",  "audio/wav");
        MIME_TYPES.put("ogg",  "audio/ogg");

        // Video files for video studio
        MIME_TYPES.put("mp4",  "video/mp4");
        MIME_TYPES.put("webm", "video/webm");
    }

    public static void main(String[] args) {
        try {
            // 1. Create HTTP server listening on port 8080
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
            
            // 2. Register route handlers
            server.createContext("/", new StaticFileHandler());
            server.createContext("/api/status", new ApiStatusHandler());

            // 3. Set default thread executor and start
            server.setExecutor(null);
            server.start();

            // Print friendly server startup banner in console
            System.out.println("=================================================");
            System.out.println("     === Nexora Localhost Server Running! ===");
            System.out.println("=================================================");
            System.out.println("-> Localhost URL: http://localhost:" + PORT + "/");
            System.out.println("-> Press Ctrl+C in this terminal to stop server.");
            System.out.println("=================================================");
        } catch (IOException e) {
            System.err.println("Server error: " + e.getMessage());
        }
    }

    /**
     * StaticFileHandler
     * Reads requested files from disk and streams them to the browser.
     */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Get requested URL path (e.g., "/index.html" or "/audio/kesariya.m4a")
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            File file = new File(ROOT_DIR + path);

            // Security check: Prevent directory traversal outside project root
            String canonicalPath = file.getCanonicalPath();
            String rootCanonical = new File(ROOT_DIR).getCanonicalPath();
            if (!canonicalPath.startsWith(rootCanonical)) {
                sendError(exchange, 403, "403 Forbidden: Access outside root denied");
                return;
            }

            // Return 404 if file does not exist
            if (!file.exists() || file.isDirectory()) {
                sendError(exchange, 404, "404 Not Found: " + path);
                return;
            }

            // Resolve MIME Content-Type
            String ext = getFileExtension(file.getName());
            String contentType = MIME_TYPES.getOrDefault(ext, "application/octet-stream");

            // Set headers and send HTTP 200 OK
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, file.length());

            // Stream file bytes to browser
            try (OutputStream os = exchange.getResponseBody();
                 FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[8192]; // 8 KB transfer buffer
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
            }
        }
    }

    /**
     * ApiStatusHandler
     * Responds with JSON server health status at /api/status
     */
    static class ApiStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String json = "{\"status\":\"online\",\"server\":\"Nexora Native Java Server\",\"port\":" + PORT + "}";
            byte[] bytes = json.getBytes("UTF-8");

            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, bytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // Helper: Extracts file extension from file name
    private static String getFileExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return (dot > 0 && dot < fileName.length() - 1) ? fileName.substring(dot + 1).toLowerCase() : "";
    }

    // Helper: Sends HTTP error response with message
    private static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        byte[] bytes = message.getBytes("UTF-8");
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
