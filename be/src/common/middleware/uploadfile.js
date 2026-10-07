const multer = require('multer');
const { uploadStream } = require('../services/blob.service');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 디스크 대신 Azure Blob으로 바로 스트리밍하는 스토리지 엔진. 완료 후 req.file.url에 공개 URL이 담김
const blobStorage = {
    _handleFile(req, file, done) {
        // 한글 파일명 깨짐 복원
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf-8');
        uploadStream(file.stream, originalname, file.mimetype)
            .then(({ blobName, url }) => done(null, { filename: blobName, url }))
            .catch(done);
    },
    _removeFile(req, file, done) { done(null); }
};

const upload = multer({
    storage: blobStorage,
    limits: { fileSize: 1024 * 1024 * 10 },  // 10MB
    fileFilter(req, file, done) {
        if (ALLOWED_MIME.includes(file.mimetype)) return done(null, true);
        // status를 달아 errorHandler가 500이 아닌 400으로 응답하게 함
        const error = new Error('이미지 파일(jpeg, png, webp, gif)만 업로드할 수 있습니다.');
        error.status = 400;
        done(error);
    }
});


module.exports = upload;
