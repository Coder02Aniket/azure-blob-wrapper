package com.example.azureblob.exception;

import com.azure.storage.blob.models.BlobStorageException;
import com.example.azureblob.dto.ApiError;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(BlobNotFoundException.class)
    public ResponseEntity<ApiError> handleBlobNotFound(BlobNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError(HttpStatus.NOT_FOUND.value(), "Not Found", ex.getMessage()));
    }

    @ExceptionHandler(BlobStorageException.class)
    public ResponseEntity<ApiError> handleAzureBlobStorageException(BlobStorageException ex) {
        int statusCode = ex.getStatusCode();
        HttpStatus status = HttpStatus.resolve(statusCode);
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        String message;
        if (statusCode == 404) {
            message = "Requested blob or container was not found.";
        } else if (statusCode == 403) {
            message = "Access denied by Azure Storage. Check your credentials.";
        } else if (statusCode == 409) {
            message = "Storage conflict error occurred.";
        } else {
            message = "Azure Storage error: " + (ex.getErrorCode() != null ? ex.getErrorCode().toString() : "unknown");
        }

        return ResponseEntity.status(status)
                .body(new ApiError(status.value(), status.getReasonPhrase(), message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage()));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParams(MissingServletRequestParameterException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(HttpStatus.BAD_REQUEST.value(), "Bad Request", "Missing required parameter: " + ex.getParameterName()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error", "An unexpected error occurred."));
    }
}
