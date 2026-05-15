const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'rahuljayantibhai.p@iitgn.ac.in', pass: 'avpfauewpcppvlva' }
});
const ADMIN_EMAILS = ['loriyasagar.b@iitgn.ac.in', 'abhay.maurya@iitgn.ac.in', 'md.faizan@iitgn.ac.in', 'rishabh.dangi@iitgn.ac.in', 'dhruvit.patel@iitgn.ac.in', 'rahuljayantibhai.p@iitgn.ac.in', 'iea@iitgn.ac.in'];
transporter.sendMail({
  from: '"Fox Kisem" <rahuljayantibhai.p@iitgn.ac.in>',
  to: ADMIN_EMAILS,
  subject: 'Test Email SMTP Delivery',
  text: 'Testing SMTP bulk delivery to all IITGN admins.'
}).then(info => console.log('Success:', info.messageId)).catch(err => console.error('Error:', err));
