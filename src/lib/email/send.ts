import React from 'react'
import {
  VerificationEmailTemplate,
  MagicLinkEmailTemplate,
  PasswordResetEmailTemplate,
} from './templates'

async function renderEmailTemplate(template: React.ReactElement): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('Email rendering can only be done on the server')
  }
  const { renderToStaticMarkup } = await import('react-dom/server')
  return renderToStaticMarkup(template)
}

async function getResend() {
  if (typeof window !== 'undefined') {
    throw new Error('Resend can only be used on the server')
  }
  const { Resend } = await import('resend')
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(apiKey)
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'noreply@superfreakstudio.com'
}

function getFromName() {
  return process.env.RESEND_FROM_NAME || 'Superfreak Studio'
}

export async function sendVerificationEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName?: string
}) {
  try {
    const html = await renderEmailTemplate(
      React.createElement(VerificationEmailTemplate, { url, userName })
    )

    const resend = await getResend()
    const fromEmail = getFromEmail()
    const fromName = getFromName()

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Verify Your Email Address - Superfreak Studio',
      html,
    })

    if (result.error) {
      console.error('Error sending verification email:', result.error)
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { success: false, error }
  }
}

export async function sendMagicLinkEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName?: string
}) {
  try {
    const html = await renderEmailTemplate(
      React.createElement(MagicLinkEmailTemplate, { url, userName })
    )

    const resend = await getResend()
    const fromEmail = getFromEmail()
    const fromName = getFromName()

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Sign In to Superfreak Studio',
      html,
    })

    if (result.error) {
      console.error('Error sending magic link email:', result.error)
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error sending magic link email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName?: string
}) {
  try {
    const html = await renderEmailTemplate(
      React.createElement(PasswordResetEmailTemplate, { url, userName })
    )

    const resend = await getResend()
    const fromEmail = getFromEmail()
    const fromName = getFromName()

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Reset Your Password - Superfreak Studio',
      html,
    })

    if (result.error) {
      console.error('Error sending password reset email:', result.error)
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }
}
