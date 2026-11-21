package com.example.azureblob.dto;

public record UploadResult(
        String name,
        String url,
        long size
) {
}
