package com.example.azureblob.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobProperties;
import com.example.azureblob.dto.BlobDownload;
import com.example.azureblob.dto.BlobMetadata;
import com.example.azureblob.dto.UploadResult;
import com.example.azureblob.exception.BlobNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class BlobStorageService {

    private static final Pattern CONTAINER_NAME_PATTERN =
            Pattern.compile("^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$");

    @Value("${azure.storage.container-name:your-container-name}")
    private String containerName;

    private final BlobServiceClient blobServiceClient;

    @Autowired
    public BlobStorageService(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }

    public static void validateContainerName(String container) {
        if (container == null || !CONTAINER_NAME_PATTERN.matcher(container).matches()) {
            throw new IllegalArgumentException(
                    "Invalid container name: '" + container + "'. Container names must be 3-63 characters, lowercase letters, numbers, and hyphens (no consecutive hyphens)."
            );
        }
    }

    private BlobContainerClient getContainerClient(String connectionString, String dynamicContainerName) {
        BlobServiceClient client = blobServiceClient;
        if (connectionString != null && !connectionString.trim().isEmpty()) {
            client = new BlobServiceClientBuilder()
                    .connectionString(connectionString.trim())
                    .buildClient();
        }

        String container = (dynamicContainerName != null && !dynamicContainerName.trim().isEmpty())
                ? dynamicContainerName.trim()
                : this.containerName;

        validateContainerName(container);

        BlobContainerClient containerClient = client.getBlobContainerClient(container);
        if (!containerClient.exists()) {
            containerClient.create();
        }
        return containerClient;
    }

    public UploadResult uploadFile(MultipartFile file) throws IOException {
        return uploadFile(file, null, null);
    }

    public UploadResult uploadFile(MultipartFile file, String connectionString, String dynamicContainerName) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            originalFilename = "unnamed_blob";
        }

        BlobContainerClient containerClient = getContainerClient(connectionString, dynamicContainerName);
        BlobClient blobClient = containerClient.getBlobClient(originalFilename);

        blobClient.upload(file.getInputStream(), file.getSize(), true);
        return new UploadResult(originalFilename, blobClient.getBlobUrl(), file.getSize());
    }

    public BlobDownload downloadFile(String fileName) {
        return downloadFile(fileName, null, null);
    }

    public BlobDownload downloadFile(String fileName, String connectionString, String dynamicContainerName) {
        BlobClient blobClient = getContainerClient(connectionString, dynamicContainerName).getBlobClient(fileName);
        if (!blobClient.exists()) {
            throw new BlobNotFoundException("Blob not found: " + fileName);
        }

        BlobProperties properties = blobClient.getProperties();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream);
        byte[] content = outputStream.toByteArray();

        String contentType = properties.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        return new BlobDownload(fileName, content, contentType, content.length);
    }

    public List<BlobMetadata> listFilesAsMetadata() {
        return listFilesAsMetadata(null, null);
    }

    public List<BlobMetadata> listFilesAsMetadata(String connectionString, String dynamicContainerName) {
        BlobContainerClient containerClient = getContainerClient(connectionString, dynamicContainerName);
        List<BlobMetadata> list = new ArrayList<>();
        for (BlobItem item : containerClient.listBlobs()) {
            list.add(toMetadata(item));
        }
        return list;
    }

    public void deleteFile(String fileName) {
        deleteFile(fileName, null, null);
    }

    public void deleteFile(String fileName, String connectionString, String dynamicContainerName) {
        BlobClient blobClient = getContainerClient(connectionString, dynamicContainerName).getBlobClient(fileName);
        if (!blobClient.exists()) {
            throw new BlobNotFoundException("Blob not found: " + fileName);
        }
        blobClient.delete();
    }

    private static BlobMetadata toMetadata(BlobItem item) {
        var props = item.getProperties();
        long size = (props != null && props.getContentLength() != null && props.getContentLength() > 0)
                ? props.getContentLength()
                : 0L;
        Instant lastModified = (props != null && props.getLastModified() != null)
                ? props.getLastModified().toInstant()
                : Instant.EPOCH;
        String contentType = (props != null && props.getContentType() != null && !props.getContentType().isBlank())
                ? props.getContentType()
                : "application/octet-stream";
        String etag = (props != null && props.getETag() != null)
                ? props.getETag()
                : "";

        return new BlobMetadata(item.getName(), size, lastModified, contentType, etag);
    }
}
