package com.example.azureblob.controller;

import com.example.azureblob.dto.BlobDownload;
import com.example.azureblob.dto.BlobMetadata;
import com.example.azureblob.dto.BlockStageResult;
import com.example.azureblob.dto.UploadResult;
import com.example.azureblob.exception.BlobNotFoundException;
import com.example.azureblob.service.BlobStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BlobStorageController.class)
class BlobStorageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BlobStorageService blobStorageService;

    @Test
    void testListFiles_ReturnsMetadataJson() throws Exception {
        BlobMetadata item = new BlobMetadata(
                "documents/report.pdf",
                1024L,
                Instant.parse("2026-11-22T00:00:00Z"),
                "application/pdf",
                "\"0x8D8...\""
        );
        when(blobStorageService.listFilesAsMetadata(isNull(), isNull())).thenReturn(List.of(item));

        mockMvc.perform(get("/api/blobs/list"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].name").value("documents/report.pdf"))
                .andExpect(jsonPath("$[0].size").value(1024))
                .andExpect(jsonPath("$[0].contentType").value("application/pdf"));
    }

    @Test
    void testDownload_QueryParam_Success() throws Exception {
        byte[] payload = "test content".getBytes();
        BlobDownload download = new BlobDownload("test.txt", payload, "text/plain", payload.length);
        when(blobStorageService.downloadFile(eq("test.txt"), isNull(), isNull())).thenReturn(download);

        mockMvc.perform(get("/api/blobs/download").param("name", "test.txt"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test.txt\"; filename*=UTF-8''test.txt"))
                .andExpect(content().contentType(MediaType.TEXT_PLAIN))
                .andExpect(content().bytes(payload));
    }

    @Test
    void testDownload_NotFound_Returns404() throws Exception {
        when(blobStorageService.downloadFile(eq("missing.txt"), isNull(), isNull()))
                .thenThrow(new BlobNotFoundException("Blob not found: missing.txt"));

        mockMvc.perform(get("/api/blobs/download").param("name", "missing.txt"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    void testDelete_QueryParam_Returns204() throws Exception {
        doNothing().when(blobStorageService).deleteFile(eq("test.txt"), isNull(), isNull());

        mockMvc.perform(delete("/api/blobs/delete").param("name", "test.txt"))
                .andExpect(status().isNoContent());
    }

    @Test
    void testDelete_NotFound_Returns404() throws Exception {
        doThrow(new BlobNotFoundException("Blob not found: missing.txt"))
                .when(blobStorageService).deleteFile(eq("missing.txt"), isNull(), isNull());

        mockMvc.perform(delete("/api/blobs/delete").param("name", "missing.txt"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void testUpload_ReturnsUploadResult() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "Hello World".getBytes()
        );
        UploadResult result = new UploadResult("hello.txt", "https://example.com/hello.txt", 11L);
        when(blobStorageService.uploadFile(any(), isNull(), isNull())).thenReturn(result);

        mockMvc.perform(multipart("/api/blobs/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("hello.txt"))
                .andExpect(jsonPath("$.size").value(11))
                .andExpect(jsonPath("$.url").value("https://example.com/hello.txt"));
    }

    @Test
    void testStageBlock_ReturnsBlockId() throws Exception {
        MockMultipartFile chunk = new MockMultipartFile(
                "file", "chunk-0", "application/octet-stream", "chunk bytes".getBytes()
        );
        when(blobStorageService.stageBlock(
                eq("large.bin"), eq("upload-1"), eq(0), any(), eq(11L), isNull(), isNull()
        )).thenReturn(new BlockStageResult(0, "dXBsb2FkLTEtMDAwMDAwMDA="));

        mockMvc.perform(multipart("/api/blobs/upload/block")
                        .file(chunk)
                        .param("name", "large.bin")
                        .param("uploadId", "upload-1")
                        .param("index", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.index").value(0))
                .andExpect(jsonPath("$.blockId").value("dXBsb2FkLTEtMDAwMDAwMDA="));
    }

    @Test
    void testCompleteUpload_CommitsBlockList() throws Exception {
        UploadResult result = new UploadResult("large.bin", "https://example.com/large.bin", 42L);
        when(blobStorageService.commitBlocks(
                eq("large.bin"), eq("application/octet-stream"),
                eq(List.of("block-0", "block-1")), isNull(), isNull()
        )).thenReturn(result);

        mockMvc.perform(post("/api/blobs/upload/complete")
                        .param("name", "large.bin")
                        .param("blockIds", "block-0,block-1")
                        .param("contentType", "application/octet-stream"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("large.bin"))
                .andExpect(jsonPath("$.size").value(42));
    }

    @Test
    void testCompleteUpload_MissingBlockIds_Returns400() throws Exception {
        mockMvc.perform(post("/api/blobs/upload/complete").param("name", "large.bin"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void testIllegalArgumentException_Returns400() throws Exception {
        when(blobStorageService.listFilesAsMetadata(isNull(), eq("INVALID_CONTAINER")))
                .thenThrow(new IllegalArgumentException("Invalid container name"));

        mockMvc.perform(get("/api/blobs/list").header("X-Azure-Container-Name", "INVALID_CONTAINER"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid container name"));
    }
}
