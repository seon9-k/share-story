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
    blobHTTPHeaders: { blobContentType: contentType }
  });
  return { blobName, url: blockBlob.url };
}

module.exports = { uploadStream };
