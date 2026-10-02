const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if(!header || !header.startsWith('Bearer ')){
        // 로그인 기능 완성 전까지는 development에서 body.user_id로 대체 허용한다.
        if (process.env.NODE_ENV === 'development' && req.body?.user_id) {
            req.user_id = req.body.user_id;
            return next();
        }
        return res.status(401).json({success:false, message : '다시 로그인해주세요. 헤더에 인증정보가 없습니다.'});
    }
   
    const token = header.split(' ')[1]; 
    //console.log(token);
    
    jwt.verify(token, SECRET, (error, decoded) => {
        // 만료·위조 토큰은 인증 실패(401). 403은 모임 권한 없음 전용으로 사용해 FE가 로그아웃 여부를 구분
        if(error){
           return res.status(401).json({success:false, message : `허가되지 않은 토큰입니다. ${error}`});
        }
        req.user_id = decoded.user_id;
        
        next();
    });
}

module.exports = auth;