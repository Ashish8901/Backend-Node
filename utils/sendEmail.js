const nodemailer = require('nodemailer');

const sendMail = async (mailOptions) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    transporter
      .sendMail(mailOptions)
      .then((info) => {
        if (info) {
          resolve('success');
        }
      })
      .catch((error) => {
        if (error) {
          resolve('error');
        }
      });
  });
};

module.exports = sendMail;
