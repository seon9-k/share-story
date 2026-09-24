const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({success:false, message : '다시 로그인해주세요. 헤더에 인증정보가 없습니다.'});
    }
   
    const token = header.split(' ')[1]; 
    //console.log(token);
    
    jwt.verify(token, SECRET, (error, decoded) => {
        if(error){
           return res.status(403).json({success:false, message : `허가되지 않은 토큰입니다. ${error}`}); 
        }
        req.user_id = decoded.user_id;
        
        next();
    });
}

module.exports = auth;