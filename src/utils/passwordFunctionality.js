import bcrypt from 'bcrypt'

const hashPassword =  (password) => {
    const salt =  bcrypt.genSalt(10);
    const hashedPassword =  bcrypt.hash(password, salt);
    return hashedPassword;
}

const comparePassword = (password, hashedPassword)=>{
    const isMatch =  bcrypt.compare(password, hashedPassword);
    return isMatch;
}


export {comparePassword, hashPassword};