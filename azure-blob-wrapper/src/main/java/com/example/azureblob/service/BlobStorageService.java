package com.example.azureblob.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
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

    private BlobContainerClient getContainerClient(String connectionString, String containerName) {
        BlobServiceClient client = blobServiceClient;
        if (connectionString != null && !connectionString.trim().isEmpty()) {
            client = new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();
        }
        
        String container = (containerName != null && !containerName.trim().isEmpty()) 
                ? containerName 
                : this.containerName;
                
        BlobContainerClient containerClient = client.getBlobContainerClient(container);
        if (!containerClient.exists()) {
            containerClient.create();
        }
        return containerClient;
    }

    /**
     * Upload a file to Azure Blob Storage using default credentials
     */
    public String uploadFile(MultipartFile file) throws IOException {
        return uploadFile(file, null, null);
    }

    /**
     * Upload a file to Azure Blob Storage using dynamic credentials
     */
    public String uploadFile(MultipartFile file, String connectionString, String containerName) throws IOException {
        BlobClient blobClient = getContainerClient(connectionString, containerName).getBlobClient(file.getOriginalFilename());
        blobClient.upload(file.getInputStream(), file.getSize(), true);
        return blobClient.getBlobUrl();
    }

    /**
     * Download a file from Azure Blob Storage using default credentials
     */
    public byte[] downloadFile(String fileName) {
        return downloadFile(fileName, null, null);
    }

    /**
     * Download a file from Azure Blob Storage using dynamic credentials
     */
    public byte[] downloadFile(String fileName, String connectionString, String containerName) {
        BlobClient blobClient = getContainerClient(connectionString, containerName).getBlobClient(fileName);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream);
        return outputStream.toByteArray();
    }

    /**
     * List all files in the container using default credentials
     */
    public List<String> listFiles() {
        return listFiles(null, null);
    }

    /**
     * List all files in the container using dynamic credentials
     */
    public List<String> listFiles(String connectionString, String containerName) {
        List<String> fileNames = new ArrayList<>();
        for (BlobItem blobItem : getContainerClient(connectionString, containerName).listBlobs()) {
            fileNames.add(blobItem.getName());
        }
        return fileNames;
    }

    /**
     * Delete a file from Azure Blob Storage using default credentials
     */
    public boolean deleteFile(String fileName) {
        return deleteFile(fileName, null, null);
    }

    /**
     * Delete a file from Azure Blob Storage using dynamic credentials
     */
    public boolean deleteFile(String fileName, String connectionString, String containerName) {
        BlobClient blobClient = getContainerClient(connectionString, containerName).getBlobClient(fileName);
        if (blobClient.exists()) {
            blobClient.delete();
            return true;
        }
        return false;
    }
}
