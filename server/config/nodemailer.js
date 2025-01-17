import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // false for port 587
    auth: {
        user: process.env.SMTP_USER, // Your Brevo SMTP username
        pass: process.env.SMTP_PASSWORD, // Your Brevo SMTP password
    },
});

export const defaultMailOptions = {
    from: process.env.SENDER_EMAIL, // Default "from" email
};


export default transporter;