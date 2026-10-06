const jwt = require('jsonwebtoken');

/**
 * Authorization: Bearer <token> 검증 후 req.user_id 설정.
 * 프로젝트의 유일한 인증 미들웨어 (중복이던 middlewares/auth.middleware.js 삭제)
 */

const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({success:false, message : '다시 로그인해주세요. 헤더에 인증정보가 없습니다.'});
    }
   
    const token = header.split(' ')[1]; 
    //console.log(token);
    
    // 시크릿은 요청 시점에 읽음 (모듈 로드 순서와 무관하게 .env 값 사용)
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        // 만료·위조 토큰은 인증 실패(401). 403은 모임 권한 없음 전용으로 사용해 FE가 로그아웃 여부를 구분
        if(error){
           // 내부 에러 내용(jwt expired 등)은 응답에 넣지 않음
           const message = error.name === 'TokenExpiredError'
               ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
               : '허가되지 않은 토큰입니다.';
           return res.status(401).json({success:false, message});
        }
        req.user_id = decoded.user_id;
        
        next();
    });
}

module.exports = auth;
