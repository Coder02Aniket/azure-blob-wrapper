package com.example.azureblob.dto;

/**
 * The opaque block id assigned to one staged chunk. The client must send these
 * back, in index order, when committing the block list.
 */
public record BlockStageResult(
        int index,
        String blockId
) {
}
