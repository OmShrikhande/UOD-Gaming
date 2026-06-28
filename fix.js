const fs = require('fs');
const path = require('path');

// Fix emailService.js
let emailPath = path.join(process.cwd(), 'Server/utils/emailService.js');
let emailContent = fs.readFileSync(emailPath, 'utf8');

if (!emailContent.includes('import logger from')) {
  emailContent = emailContent.replace("import { format } from 'date-fns';", "import { format } from 'date-fns';\nimport logger from '../config/logger.js';");
}

emailContent = emailContent.replace(/console\.log\(/g, 'logger.info(');
emailContent = emailContent.replace(/console\.error\(/g, 'logger.error(');

let createTransporterOrig = 'const createTransporter = () => {';
let createTransporterNew = 'const createTransporter = () => {\n    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {\n        logger.error(\'CRITICAL: EMAIL_USER or EMAIL_PASSWORD environment variables are missing.\');\n        throw new Error(\'Email credentials are not properly configured.\');\n    }';
emailContent = emailContent.replace(createTransporterOrig, createTransporterNew);

emailContent = emailContent.replace("process.env.ADMIN_EMAIL || 'omshrikhande73@gmail.com'", 'process.env.ADMIN_EMAIL');

fs.writeFileSync(emailPath, emailContent);

// Fix auth.controller.js
let authPath = path.join(process.cwd(), 'Server/Controllers/auth.controller.js');
let authContent = fs.readFileSync(authPath, 'utf8');

if (!authContent.includes('delete req.body.role; // Fix for Role Injection Bypass')) {
  let findTarget = 'const { username, email, password, displayName } = req.body;';
  let replaceTarget = findTarget + '\n    delete req.body.role; // Fix for Role Injection Bypass';
  authContent = authContent.replace(findTarget, replaceTarget);
  fs.writeFileSync(authPath, authContent);
}

console.log('Done fixing critical issues.');
