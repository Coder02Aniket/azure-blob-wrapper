package com.example.azureblob.dto;

import java.time.Instant;

public record BlobMetadata(
        String name,
        long size,
        Instant lastModified,
        String contentType,
        String etag
) {
}
