package com.example.azureblob.dto;

public record BlobDownload(
        String fileName,
        byte[] content,
        String contentType,
        long contentLength
) {
}
