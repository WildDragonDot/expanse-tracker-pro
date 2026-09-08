import { sendEmail, emailTemplates } from '../src/lib/email'

async function test() {
  console.log('Testing billReminder email template...')
  const template = emailTemplates.billReminder('Chandan', {
    title: 'Broadband Fiber',
    amount: 999,
    dueDate: '10 Sept 2026',
    category: 'Utilities',
    frequency: 'Monthly',
    isAutoDebit: false,
  })

  console.log('Subject:', template.subject)
  const res = await sendEmail({
    to: 'vishwakarmachandan336@gmail.com',
    subject: template.subject,
    html: template.html,
  })
  console.log('Result:', res)
}

test()
