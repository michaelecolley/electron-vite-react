import { EmailTask } from '../types/emailTask'

export const dummyTasks: EmailTask[] = [
  {
    id: '1',
    type: 'email',
    title: 'Customer Newsletter - April 2024',
    description: 'Monthly newsletter draft for customer base',
    status: 'pending',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
    metadata: {
      from: 'marketing@company.com',
      to: ['customers@company.com'],
      subject: 'April Newsletter: Spring Updates & New Features',
      content: `
        <h1>Spring Updates & New Features</h1>
        <p>Dear valued customers,</p>
        <p>We're excited to share our latest updates with you:</p>
        <ul>
          <li>New dashboard interface</li>
          <li>Improved performance</li>
          <li>Extended API capabilities</li>
        </ul>
        <p>Best regards,<br>The Marketing Team</p>
      `,
      attachments: [
        {
          name: 'newsletter-preview.pdf',
          url: '/files/preview.pdf',
          size: 1024 * 1024 // 1MB
        }
      ]
    }
  },
  {
    id: '2',
    type: 'email',
    title: 'Urgent: Security Update Notice',
    description: 'Security notification for all users',
    status: 'pending',
    createdAt: '2024-03-20T11:00:00Z',
    updatedAt: '2024-03-20T11:00:00Z',
    metadata: {
      from: 'security@company.com',
      to: ['all-users@company.com'],
      subject: 'Important Security Update Required',
      content: `
        <h2>Security Update Notice</h2>
        <p>Dear users,</p>
        <p>We need to inform you about an important security update:</p>
        <ul>
          <li>Critical security patch available</li>
          <li>Required action: Update before March 25th</li>
          <li>No downtime expected</li>
        </ul>
        <p>Security Team</p>
      `
    }
  }
]