package com.example.azureblob.controller;

import com.example.azureblob.dto.BlobDownload;
import com.example.azureblob.dto.BlobMetadata;
import com.example.azureblob.dto.UploadResult;
import com.example.azureblob.service.BlobStorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/blobs")
public class BlobStorageController {

    private final BlobStorageService blobStorageService;

    public BlobStorageController(BlobStorageService blobStorageService) {
        this.blobStorageService = blobStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<UploadResult> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) throws IOException {
        UploadResult result = blobStorageService.uploadFile(file, connectionString, containerName);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/download")
    public ResponseEntity<ByteArrayResource> downloadFile(
            @RequestParam("name") String fileName,
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        BlobDownload download = blobStorageService.downloadFile(fileName, connectionString, containerName);

        String encodedName = URLEncoder.encode(download.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
        String safeName = download.fileName().replace("\"", "\\\"");
        String contentDisposition = "attachment; filename=\"" + safeName + "\"; filename*=UTF-8''" + encodedName;

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (download.contentType() != null && !download.contentType().isBlank()) {
                mediaType = MediaType.parseMediaType(download.contentType());
            }
        } catch (Exception ignored) {
            // fallback to octet-stream
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .contentType(mediaType)
                .contentLength(download.contentLength())
                .body(new ByteArrayResource(download.content()));
    }

    @GetMapping("/list")
    public ResponseEntity<List<BlobMetadata>> listFiles(
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        List<BlobMetadata> list = blobStorageService.listFilesAsMetadata(connectionString, containerName);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/delete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteFile(
            @RequestParam("name") String fileName,
            @RequestHeader(value = "X-Azure-Connection-String", required = false) String connectionString,
            @RequestHeader(value = "X-Azure-Container-Name", required = false) String containerName) {
        blobStorageService.deleteFile(fileName, connectionString, containerName);
        return ResponseEntity.noContent().build();
    }
}
