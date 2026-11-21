package com.example.azureblob.dto;

public record ApiError(
        int status,
        String error,
        String message
) {
}
