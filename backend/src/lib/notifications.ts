import { prisma } from './database'

export interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  expenseAlerts: boolean
  budgetWarnings: boolean
  weeklyReports: boolean
  monthlyReports: boolean
  transactionUpdates: boolean
  securityAlerts: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  expenseAlerts: true,
  budgetWarnings: true,
  weeklyReports: false,
  monthlyReports: true,
  transactionUpdates: true,
  securityAlerts: true,
}

/**
 * Get user's notification settings
 */
export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationSettings: true }
  })

  if (!user?.notificationSettings) {
    return defaultNotificationSettings
  }

  return user.notificationSettings as unknown as NotificationSettings
}

/**
 * Check if a specific notification type is enabled for a user
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType: keyof NotificationSettings
): Promise<boolean> {
  const settings = await getUserNotificationSettings(userId)
  return settings[notificationType]
}

/**
 * Send email notification if enabled
 */
export async function sendEmailIfEnabled(
  userId: string,
  emailData: {
    to: string
    subject: string
    html: string
  }
): Promise<boolean> {
  const enabled = await isNotificationEnabled(userId, 'emailNotifications')
  
  if (!enabled) {
    return false
  }

  try {
    // Email sending implementation would go here
    // For now, we'll return true to indicate the notification was processed
    // In a real implementation, you would integrate with your email service
    return true
  } catch (error) {
    return false
  }
}

/**
 * Send push notification if enabled
 */
export async function sendPushIfEnabled(
  userId: string,
  pushData: {
    title: string
    body: string
    data?: any
  }
): Promise<boolean> {
  const enabled = await isNotificationEnabled(userId, 'pushNotifications')
  
  if (!enabled) {
    return false
  }

  try {
    // Push notification implementation would go here
    // For now, we'll return true to indicate the notification was processed
    // In a real implementation, you would integrate with your push service
    return true
  } catch (error) {
    return false
  }
}

/**
 * Send expense alert if enabled
 */
export async function sendExpenseAlert(
  userId: string,
  expenseData: {
    title: string
    amount: number
    category: string
  }
): Promise<void> {
  const enabled = await isNotificationEnabled(userId, 'expenseAlerts')
  
  if (!enabled) return

  // Send notification
  await sendPushIfEnabled(userId, {
    title: 'New Expense Added',
    body: `${expenseData.title} - ₹${expenseData.amount}`,
    data: expenseData
  })
}

/**
 * Send budget warning if enabled
 */
export async function sendBudgetWarning(
  userId: string,
  budgetData: {
    category: string
    spent: number
    limit: number
    percentage: number
  }
): Promise<void> {
  const enabled = await isNotificationEnabled(userId, 'budgetWarnings')
  
  if (!enabled) return

  await sendPushIfEnabled(userId, {
    title: 'Budget Warning',
    body: `You've spent ${budgetData.percentage}% of your ${budgetData.category} budget`,
    data: budgetData
  })
}

/**
 * Send transaction update if enabled
 */
export async function sendTransactionUpdate(
  userId: string,
  transactionData: {
    type: string
    amount: number
    status: string
  }
): Promise<void> {
  const enabled = await isNotificationEnabled(userId, 'transactionUpdates')
  
  if (!enabled) return

  await sendPushIfEnabled(userId, {
    title: 'Transaction Update',
    body: `${transactionData.type} of ₹${transactionData.amount} - ${transactionData.status}`,
    data: transactionData
  })
}

/**
 * Send security alert if enabled
 */
export async function sendSecurityAlert(
  userId: string,
  alertData: {
    title: string
    message: string
    severity: 'low' | 'medium' | 'high'
  }
): Promise<void> {
  const enabled = await isNotificationEnabled(userId, 'securityAlerts')
  
  if (!enabled) return

  // Security alerts should always be sent via email too
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  })

  if (user) {
    await sendEmailIfEnabled(userId, {
      to: user.email,
      subject: `Security Alert: ${alertData.title}`,
      html: `
        <h2>Security Alert</h2>
        <p><strong>Severity:</strong> ${alertData.severity.toUpperCase()}</p>
        <p>${alertData.message}</p>
      `
    })
  }

  await sendPushIfEnabled(userId, {
    title: alertData.title,
    body: alertData.message,
    data: alertData
  })
}
