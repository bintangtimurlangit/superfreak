/**
 * Email verification template
 * Used for sending verification codes to new users who sign up with email/password
 */

export interface VerificationEmailParams {
  verificationCode: string
  verificationLink?: string // Optional for resend emails
  isResend?: boolean // If true, omit signup message and link button
}

/**
 * Generate HTML email template for email verification
 */
export function getVerificationEmailHTML({ 
  verificationCode, 
  verificationLink, 
  isResend = false 
}: VerificationEmailParams): string {
  const introText = isResend 
    ? 'Please verify your email address by entering the code below:'
    : 'Thank you for signing up! Please verify your email address by entering the code below:'
  
  const footerText = isResend
    ? 'This verification code will expire in 24 hours. If you didn\'t request this code, you can safely ignore this email.'
    : 'This verification code will expire in 24 hours. If you didn\'t create an account, you can safely ignore this email.'
  
  const linkButton = !isResend && verificationLink ? `
        <p style="margin-top: 20px;">Or click the link below to verify:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #1D0DF3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Verify Email</a>
        </div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #292929; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1D0DF3; margin: 0;">Superfreak Studio</h1>
      </div>
      <div style="background-color: #F8F8F8; border: 1px solid #DCDCDC; border-radius: 12px; padding: 30px;">
        <h2 style="color: #292929; margin-top: 0;">Verify Your Email Address</h2>
        <p>${introText}</p>
        <div style="background-color: white; border: 2px solid #1D0DF3; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D0DF3; font-family: monospace;">
            ${verificationCode}
          </div>
        </div>
        ${linkButton}
        <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">${footerText}</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text email template for email verification
 */
export function getVerificationEmailText({ 
  verificationCode, 
  verificationLink, 
  isResend = false 
}: VerificationEmailParams): string {
  const linkText = !isResend && verificationLink 
    ? `\n\nOr visit this link to verify: ${verificationLink}`
    : ''
  
  return `Verify your email address${linkText}\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 24 hours.`
}
