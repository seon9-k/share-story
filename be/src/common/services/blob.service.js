const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('crypto');
const path = require('path');

let containerClient;

// 환경변수 로드 이후 최초 호출 시 생성함
function getContainerClient() {
  if (!containerClient) {
    containerClient = BlobServiceClient
      .fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
      .getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);
  }
  return containerClient;
}

/* 스트림을 Blob에 올리고 공개 URL 반환 */
async function uploadStream(stream, originalname, contentType) {
  const blobName = `${crypto.randomUUID()}${path.extname(originalname).toLowerCase()}`;
  const blockBlob = getContainerClient().getBlockBlobClient(blobName);
  await blockBlob.uploadStream(stream, 4 * 1024 * 1024, 5, {
    // 파일명이 UUID라 내용이 바뀌지 않으므로 브라우저·CDN이 오래 캐시하게 함
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000, immutable'
    }
  });
  return { blobName, url: blockBlob.url };
}

module.exports = { uploadStream };
