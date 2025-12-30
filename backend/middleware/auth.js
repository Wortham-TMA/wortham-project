import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();

export const auth = (req, res, next) => {
    const header = req.headers.authorization;

    if(!header){
        return res.status(401).json({error: "no Token Provided"});
    }


const token = header.split(" ")[1];



try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    }catch(err){
        return res.status(401).json({error: "Invalid or Expired token"});
    }
};

export const adminOnly = (req, res, next) => {
    if(req.user.role !== "ADMIN"){
        return res.status(403).json({error: "Admin access only"});
    }
    next();
}

