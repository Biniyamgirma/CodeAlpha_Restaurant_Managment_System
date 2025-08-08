import winston, { format } from 'winston';

export default winston.createLogger({
    transports:[
        new winston.transports.Console()
    ],
    format:format.combine(
        format.timestamp(),
        format.json()
    )
})
    
