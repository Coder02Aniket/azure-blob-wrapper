package com.example.azureblob.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.models.BlobItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class BlobStorageService {

    @Value("${azure.storage.container-name}")
    private String containerName;

    private final BlobServiceClient blobServiceClient;

    @Autowired
    public BlobStorageService(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }

    private BlobContainerClient getContainerClient() {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }
        return containerClient;
    }

    /**
     * Upload a file to Azure Blob Storage
     */
    public String uploadFile(MultipartFile file) throws IOException {
        BlobClient blobClient = getContainerClient().getBlobClient(file.getOriginalFilename());
        blobClient.upload(file.getInputStream(), file.getSize(), true);
        return blobClient.getBlobUrl();
    }

    /**
     * Download a file from Azure Blob Storage
     */
    public byte[] downloadFile(String fileName) {
        BlobClient blobClient = getContainerClient().getBlobClient(fileName);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream);
        return outputStream.toByteArray();
    }

    /**
     * List all files in the container
     */
    public List<String> listFiles() {
        List<String> fileNames = new ArrayList<>();
        for (BlobItem blobItem : getContainerClient().listBlobs()) {
            fileNames.add(blobItem.getName());
        }
        return fileNames;
    }

    /**
     * Delete a file from Azure Blob Storage
     */
    public boolean deleteFile(String fileName) {
        BlobClient blobClient = getContainerClient().getBlobClient(fileName);
        if (blobClient.exists()) {
            blobClient.delete();
            return true;
        }
        return false;
    }
}
