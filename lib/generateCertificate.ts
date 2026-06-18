import puppeteer from "puppeteer";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

export async function generateCertificate({
  participantName,
  festName,
  certId,
  templateUrl,
}: {
  participantName: string;
  festName: string;
  certId: string;
  templateUrl?: string;
}): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(
    `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certId}`
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Georgia', serif;
          background: #fff;
        }
        .certificate {
          width: 1123px;
          height: 794px;
          position: relative;
          background: ${templateUrl ? `url(${templateUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1a1a2e, #16213e)'};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${templateUrl ? '#000' : '#fff'};
          border: 8px solid gold;
          box-sizing: border-box;
          padding: 40px;
        }
        .title {
          font-size: 42px;
          font-weight: bold;
          color: gold;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          margin-bottom: 30px;
          opacity: 0.8;
        }
        .name {
          font-size: 52px;
          font-weight: bold;
          color: #f59e0b;
          border-bottom: 2px solid gold;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .description {
          font-size: 18px;
          text-align: center;
          max-width: 700px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .cert-id {
          font-size: 12px;
          opacity: 0.6;
          margin-top: 10px;
        }
        .qr {
          position: absolute;
          bottom: 30px;
          right: 40px;
          width: 90px;
          height: 90px;
        }
        .footer {
          position: absolute;
          bottom: 40px;
          left: 40px;
          font-size: 14px;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="title">Certificate of Achievement</div>
        <div class="subtitle">This is proudly presented to</div>
        <div class="name">${participantName}</div>
        <div class="description">
          For outstanding participation and dedication in the
          <strong>${festName}</strong> event organized by CertFIRE.
        </div>
        <div class="cert-id">Certificate ID: ${certId}</div>
        <img class="qr" src="${qrDataUrl}" alt="QR Code" />
        <div class="footer">Verify at: ${process.env.NEXT_PUBLIC_APP_URL}/verify/${certId}</div>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.setViewport({ width: 1123, height: 794 });

  const pdfBuffer = await page.pdf({
    width: "1123px",
    height: "794px",
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}

export function generateCertId(): string {
  return nanoid(12).toUpperCase();
}