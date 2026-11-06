import { Resend } from "resend"
import { env } from "$env/dynamic/private"
import handlebars from "handlebars"

export interface MailUser {
  id: string
  email: string
}

// Sends an email to the admin email address.
// Does not throw errors, but logs them.
export const sendAdminEmail = async ({
  subject,
  body,
}: {
  subject: string
  body: string
}) => {
  if (!env.PRIVATE_ADMIN_EMAIL) {
    return
  }

  try {
    const resend = new Resend(env.PRIVATE_RESEND_API_KEY)
    const resp = await resend.emails.send({
      from: env.PRIVATE_FROM_ADMIN_EMAIL || env.PRIVATE_ADMIN_EMAIL,
      to: [env.PRIVATE_ADMIN_EMAIL],
      subject: "ADMIN_MAIL: " + subject,
      text: body,
    })

    if (resp.error) {
      console.log("Failed to send admin email, error:", resp.error)
    }
  } catch (e) {
    console.log("Failed to send admin email, error:", e)
  }
}

export const sendUserEmail = async ({
  user,
  subject,
  from_email,
  template_name,
  template_properties,
}: {
  user: MailUser
  subject: string
  from_email: string
  template_name: string
  template_properties: Record<string, string>
}) => {
  const email = user.email
  if (!email) {
    console.log("No email for user. Aborting email. ", user.id)
    return
  }

  await sendTemplatedEmail({
    subject,
    to_emails: [email],
    from_email,
    template_name,
    template_properties,
  })
}

export const sendTemplatedEmail = async ({
  subject,
  to_emails,
  from_email,
  template_name,
  template_properties,
}: {
  subject: string
  to_emails: string[]
  from_email: string
  template_name: string
  template_properties: Record<string, string>
}) => {
  try {
    const resend = new Resend(env.PRIVATE_RESEND_API_KEY)

    const template = templates[template_name]
    if (!template) {
      console.log("Template not found: ", template_name)
      return
    }

    const html = template(template_properties)

    const resp = await resend.emails.send({
      from: from_email,
      to: to_emails,
      subject,
      html,
    })

    if (resp.error) {
      console.log("Failed to send templated email, error:", resp.error)
    }
  } catch (e) {
    console.log("Failed to send templated email, error:", e)
  }
}

const templates: Record<string, handlebars.TemplateDelegate> = {
  welcome_email: handlebars.compile(
    "<h1>Welcome!</h1><p>Thanks for joining {{companyName}}.</p><a href='{{WebsiteBaseUrl}}'>Go to app</a>",
  ),
}
