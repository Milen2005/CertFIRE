import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCertificateEmail({
  toEmail,
  toName,
  festName,
  certUrl,
  certId,
}: {
  toEmail: string;
  toName: string;
  festName: string;
  certUrl: string;
  certId: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "CertFIRE <onboarding@resend.dev>",
    to: toEmail,
    subject: `Your Certificate for ${festName} is Ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">🎓 Your Certificate is Ready!</h1>
        <p>Dear <strong>${toName}</strong>,</p>
        <p>Congratulations! Your certificate for <strong>${festName}</strong> has been generated.</p>
        <div style="margin: 30px 0;">
          <a href="${certUrl}" 
             style="background: #f59e0b; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Download Certificate
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Certificate ID: <strong>${certId}</strong><br/>
          You can verify this certificate at: 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify/${certId}">
            ${process.env.NEXT_PUBLIC_APP_URL}/verify/${certId}
          </a>
        </p>
        <hr/>
        <p style="color: #999; font-size: 12px;">
          This email was sent by CertFIRE. 
          Please do not reply to this email.
        </p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  return data;
}