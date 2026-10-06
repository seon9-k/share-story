const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('files')) {
  fs.mkdirSync('files');
}

const storage = multer.diskStorage({
    destination(req, file, done){ done(null, 'files/')},
    filename(req, file, done){
        // 한글 파일명 깨짐 복원
        const originalname = Buffer.from(file.originalname, "latin1").toString('utf-8');
        const ext = path.extname(originalname);
        
        // 파일명 공백 및 URL 특수문자 제거/치환
        const basename = path.basename(originalname, ext).replace(/[\s#%&{}\\<>*?/$!'":@+`|=]/g, '_');

        // 파일명 + 타임스탬프 + 확장자
        const filename = basename + Date.now() + ext;
        done(null, filename);
    }
})

const upload = multer({
    storage : storage,
    limits : {fileSize : 1024 * 1024 * 10}  // 10MB
});


module.exports = upload;