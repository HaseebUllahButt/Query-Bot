import nodemailer from "nodemailer";

async function sendEmailUsingGmail(to: string, otp: string) {
  const user = process.env.EMAIL_ID;
  const pass = process.env.EMAIL_SECRET;
  const subject = "OTP verification";
  const text = `Your OTP is: ${otp}`;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: user,
      to,
      subject,
      text,
    });

    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export { sendEmailUsingGmail };
