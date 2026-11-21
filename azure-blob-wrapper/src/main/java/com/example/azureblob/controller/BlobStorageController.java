package com.example.azureblob.controller;

import com.example.azureblob.service.BlobStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = "*") // Added for web deployment flexibility; restrict in production
@RestController
@RequestMapping("/api/blobs")
public class BlobStorageController {

    private final BlobStorageService blobStorageService;

    @Autowired
    public BlobStorageController(BlobStorageService blobStorageService) {
        this.blobStorageService = blobStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        try {
            String url = blobStorageService.uploadFile(file, connectionString, containerName);
            return ResponseEntity.ok("File uploaded successfully. URL: " + url);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload file: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<ByteArrayResource> downloadFile(
            @PathVariable String fileName,
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        byte[] data = blobStorageService.downloadFile(fileName, connectionString, containerName);
        ByteArrayResource resource = new ByteArrayResource(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(resource);
    }

    @GetMapping("/list")
    public ResponseEntity<List<String>> listFiles(
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        List<String> files = blobStorageService.listFiles(connectionString, containerName);
        return ResponseEntity.ok(files);
    }

    @DeleteMapping("/delete/{fileName}")
    public ResponseEntity<String> deleteFile(
            @PathVariable String fileName,
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        boolean isDeleted = blobStorageService.deleteFile(fileName, connectionString, containerName);
        if (isDeleted) {
            return ResponseEntity.ok("File deleted successfully.");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
