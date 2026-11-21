package com.example.azureblob.exception;

public class BlobNotFoundException extends RuntimeException {
    public BlobNotFoundException(String message) {
        super(message);
    }
}
