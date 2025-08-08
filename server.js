import app from './src/app.js';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';

const PORT = config.port || 3000;

app.listen(PORT,()=>{
    logger.info(`Server is running on port ${PORT}`);
})