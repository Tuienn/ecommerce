import nodemailer from 'nodemailer'

const { MAIL_HOST, MAIL_PASSWORD } = process.env

export const sendMail = async (to: string, subject: string, html: string) => {
    try {
        // Tạo transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: MAIL_HOST, // Gmail của bạn
                pass: MAIL_PASSWORD // App password đã tạo
            }
        })

        // Nội dung email
        const mailOptions = {
            from: 'Winmart' + `<${MAIL_HOST}>`, // Người gửi
            to, // Người nhận
            subject, // Tiêu đề
            html // Nội dung dạng HTML
        }

        return await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}

export const registerOTPTemplate = (otp: string) => {
    return `<!doctype html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Mã OTP Winmart</title>
  <!-- Preheader (ẩn) -->
  <style>
    .preheader {display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;}
    @media (max-width:600px){
      .container{width:100%!important}
      .px-24{padding-left:16px!important;padding-right:16px!important}
      .py-24{padding-top:16px!important;padding-bottom:16px!important}
      .otp-box{font-size:28px!important;letter-spacing:6px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;">
  <!-- Hidden preheader text -->
  <div class="preheader">
    Mã OTP của bạn: {{otp}} – Hết hạn sau 5 phút. Vui lòng không chia sẻ mã với bất kỳ ai.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7f9;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8ee;">
          <!-- Header -->
          <tr>
            <td align="center" style="background:#e30613;padding:24px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:24px;color:#ffffff;font-weight:bold;">
                Winmart
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px-24 py-24" style="padding:24px 24px 8px 24px;background:#ffffff;">
              <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;">
                <h1 style="margin:0 0 12px 0;font-size:20px;line-height:28px;font-weight:700;">
                  Chào mừng bạn đến với Winmart 👋
                </h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#4b5563;">
                  Đây là <strong>Mã OTP</strong> dùng để <strong>đăng ký tài khoản mới</strong> tại Winmart.
                </p>
              </div>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:8px 24px 0 24px;background:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;border:1px dashed #d1d5db;border-radius:10px;">
                <tr>
                  <td align="center" style="padding:20px;">
                    <div class="otp-box" style="font-family:Consolas,Menlo,Monaco,monospace;font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;">
                      ${otp}
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;margin-top:8px;">
                      Mã hết hạn sau <strong>2 phút</strong>. Vui lòng không chia sẻ mã với bất kỳ ai.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Help / Note -->
          <tr>
            <td class="px-24" style="padding:16px 24px 24px 24px;background:#ffffff;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#374151;">
                Nếu bạn không yêu cầu mã này, hãy bỏ qua email hoặc liên hệ hỗ trợ của Winmart.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f3f4f6;padding:16px 24px;border-top:1px solid #e5e7eb;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;">
                © Winmart. Tất cả các quyền được bảo lưu.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
