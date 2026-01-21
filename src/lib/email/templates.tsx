import React from 'react'

interface EmailTemplateProps {
  title: string
  content: React.ReactNode
  buttonText?: string
  buttonUrl?: string
  footerText?: React.ReactNode
}

export function EmailTemplate({ title, content, buttonText, buttonUrl, footerText }: EmailTemplateProps) {
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || 
    `${process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'}/logo.png`

  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#F8F8F8' }}>
        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#F8F8F8',
            padding: '40px 20px',
          }}
        >
          <tr>
            <td align="center" style={{ padding: '0' }}>
              <table
                role="presentation"
                style={{
                  maxWidth: '600px',
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EFEFEF',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <tr>
                  <td style={{ padding: '40px 40px 30px', textAlign: 'center', borderBottom: '1px solid #EFEFEF' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Superfreak Studio"
                      style={{
                        maxWidth: '180px',
                        height: 'auto',
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '40px 40px 30px' }}>
                    <h1
                      style={{
                        margin: '0 0 20px',
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#292929',
                        lineHeight: '1.4',
                      }}
                    >
                      {title}
                    </h1>
                    <div
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#292929',
                        marginBottom: buttonText && buttonUrl ? '30px' : '0',
                      }}
                    >
                      {content}
                    </div>
                    {buttonText && buttonUrl && (
                      <table role="presentation" style={{ width: '100%', marginTop: '30px' }}>
                        <tr>
                          <td align="center" style={{ padding: '0' }}>
                            <a
                              href={buttonUrl}
                              style={{
                                display: 'inline-block',
                                padding: '14px 32px',
                                backgroundColor: '#1D0DF3',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                borderRadius: '12px',
                                fontWeight: '500',
                                fontSize: '16px',
                                lineHeight: '1.5',
                              }}
                            >
                              {buttonText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    )}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      padding: '30px 40px 40px',
                      textAlign: 'center',
                      borderTop: '1px solid #EFEFEF',
                      fontSize: '14px',
                      color: '#989898',
                      lineHeight: '1.5',
                    }}
                  >
                    {footerText || (
                      <>
                        <p style={{ margin: '0 0 10px' }}>
                          This email was sent by Superfreak Studio
                        </p>
                        <p style={{ margin: '0' }}>
                          If you didn&apos;t request this, please ignore this email.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

export function VerificationEmailTemplate(props: { url: string; userName?: string }) {
  const { url, userName } = props
  return (
    <EmailTemplate
      title="Verify Your Email Address"
      content={
        <>
          <p style={{ margin: '0 0 16px' }}>
            {userName ? `Hi ${userName},` : 'Hi there,'}
          </p>
          <p style={{ margin: '0 0 16px' }}>
            Thank you for signing up for Superfreak Studio! Please verify your email address by clicking the button below.
          </p>
          <p style={{ margin: '0' }}>
            This link will expire in 24 hours for security reasons.
          </p>
        </>
      }
      buttonText="Verify Email Address"
      buttonUrl={url}
      footerText={
        <>
          <p style={{ margin: '0 0 10px' }}>
            If the button doesn&apos;t work, copy and paste this link into your browser:
          </p>
          <p style={{ margin: '0', wordBreak: 'break-all', color: '#1D0DF3' }}>
            {url}
          </p>
        </>
      }
    />
  )
}

export function MagicLinkEmailTemplate(props: { url: string; userName?: string }) {
  const { url, userName } = props
  return (
    <EmailTemplate
      title="Your Magic Link"
      content={
        <>
          <p style={{ margin: '0 0 16px' }}>
            {userName ? `Hi ${userName},` : 'Hi there,'}
          </p>
          <p style={{ margin: '0 0 16px' }}>
            Click the button below to sign in to your Superfreak Studio account. This magic link will log you in automatically.
          </p>
          <p style={{ margin: '0' }}>
            This link will expire in 15 minutes for security reasons.
          </p>
        </>
      }
      buttonText="Sign In with Magic Link"
      buttonUrl={url}
      footerText={
        <>
          <p style={{ margin: '0 0 10px' }}>
            If the button doesn&apos;t work, copy and paste this link into your browser:
          </p>
          <p style={{ margin: '0', wordBreak: 'break-all', color: '#1D0DF3' }}>
            {url}
          </p>
        </>
      }
    />
  )
}

export function PasswordResetEmailTemplate(props: { url: string; userName?: string }) {
  const { url, userName } = props
  return (
    <EmailTemplate
      title="Reset Your Password"
      content={
        <>
          <p style={{ margin: '0 0 16px' }}>
            {userName ? `Hi ${userName},` : 'Hi there,'}
          </p>
          <p style={{ margin: '0 0 16px' }}>
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <p style={{ margin: '0' }}>
            This link will expire in 1 hour for security reasons. If you didn&apos;t request this, please ignore this email.
          </p>
        </>
      }
      buttonText="Reset Password"
      buttonUrl={url}
      footerText={
        <>
          <p style={{ margin: '0 0 10px' }}>
            If the button doesn&apos;t work, copy and paste this link into your browser:
          </p>
          <p style={{ margin: '0', wordBreak: 'break-all', color: '#1D0DF3' }}>
            {url}
          </p>
        </>
      }
    />
  )
}
