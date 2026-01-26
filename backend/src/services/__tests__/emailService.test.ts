import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../emailService.js';
import { settingsService } from '../settingsService.js';
import nodemailer from 'nodemailer';

// Mock dependencies
vi.mock('../settingsService.js', () => ({
  settingsService: {
    getSetting: vi.fn(),
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;

  beforeEach(() => {
    emailService = new EmailService();
    vi.clearAllMocks();

    // Create mock transporter
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter);
  });

  describe('getTransporter', () => {
    it('should create transporter with SMTP settings', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce('smtp.example.com') // smtpHost
        .mockResolvedValueOnce(587) // smtpPort
        .mockResolvedValueOnce('user@example.com') // smtpUser
        .mockResolvedValueOnce('password123'); // smtpPassword

      await emailService.getTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false, // port 587 is not secure
        auth: {
          user: 'user@example.com',
          pass: 'password123',
        },
      });
    });

    it('should use secure connection for port 465', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(465) // Secure port
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('password123');

      await emailService.getTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 465,
        secure: true, // port 465 is secure
        auth: {
          user: 'user@example.com',
          pass: 'password123',
        },
      });
    });

    it('should throw error when SMTP host is missing', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce('') // Empty host
        .mockResolvedValueOnce(587);

      await expect(emailService.getTransporter()).rejects.toThrow(
        'SMTP configuration incomplete'
      );
    });

    it('should create transporter without auth if credentials missing', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(587)
        .mockResolvedValueOnce('') // No user
        .mockResolvedValueOnce(''); // No password

      await emailService.getTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: undefined,
      });
    });

    it('should cache transporter instance', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValue('smtp.example.com')
        .mockResolvedValue(587)
        .mockResolvedValue('user@example.com')
        .mockResolvedValue('password123');

      await emailService.getTransporter();
      await emailService.getTransporter();

      // Should only create transporter once
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce(true) // emailNotificationsEnabled
        .mockResolvedValueOnce('noreply@example.com') // emailFromAddress
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(587)
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('password123');
    });

    it('should send email with correct parameters', async () => {
      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: expect.any(String),
      });
    });

    it('should handle multiple recipients', async () => {
      await emailService.sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com, user2@example.com',
        })
      );
    });

    it('should use provided text or convert HTML to text', async () => {
      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Custom text',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Custom text',
        })
      );
    });

    it('should skip sending when email notifications disabled', async () => {
      // Reset mocks to override beforeEach setup
      vi.mocked(settingsService.getSetting).mockReset();
      vi.mocked(settingsService.getSetting).mockResolvedValue(false); // All calls return false

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle send errors gracefully', async () => {
      // Reset and setup mocks for this test
      vi.mocked(settingsService.getSetting).mockReset();
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce(true) // emailNotificationsEnabled
        .mockResolvedValueOnce('noreply@example.com') // emailFromAddress
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(587)
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('password123');

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        })
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection successful', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(587)
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('password123');

      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(587)
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('password123');

      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('Email Template Methods', () => {
    beforeEach(() => {
      vi.mocked(settingsService.getSetting)
        .mockResolvedValueOnce(true) // emailNotificationsEnabled
        .mockResolvedValueOnce('noreply@example.com')
        .mockResolvedValueOnce('smtp.example.com')
        .mockResolvedValueOnce(587)
        .mockResolvedValueOnce('user@example.com')
        .mockResolvedValueOnce('password123');
    });

    describe('sendApprovalSubmitted', () => {
      it('should send approval submitted email with correct data', async () => {
        const data = {
          activityTitle: 'Test Activity',
          activitySn: 'ACT-001',
          actorName: 'John Doe',
          estimatedSpend: '$50,000',
          reason: 'Budget increase needed',
          approvalUrl: 'https://app.example.com/approvals/123',
        };

        await emailService.sendApprovalSubmitted(data, ['finance@example.com']);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'New Approval Pending: Test Activity',
            to: 'finance@example.com',
          })
        );

        const call = mockTransporter.sendMail.mock.calls[0][0];
        expect(call.html).toContain('Test Activity');
        expect(call.html).toContain('ACT-001');
        expect(call.html).toContain('John Doe');
        expect(call.html).toContain('$50,000');
      });
    });

    describe('sendApprovalFinanceApproved', () => {
      it('should send finance approved email', async () => {
        const data = {
          activityTitle: 'Test Activity',
          activitySn: 'ACT-001',
          actorName: 'Finance User',
          estimatedSpend: '$50,000',
          approvalUrl: 'https://app.example.com/approvals/123',
        };

        await emailService.sendApprovalFinanceApproved(data, [
          'committee@example.com',
        ]);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Finance Approved: Test Activity',
          })
        );
      });
    });

    describe('sendApprovalRejected', () => {
      it('should send rejection email with reason', async () => {
        const data = {
          activityTitle: 'Test Activity',
          activitySn: 'ACT-001',
          actorName: 'Finance User',
          estimatedSpend: '$50,000',
          reason: 'Insufficient justification',
          approvalUrl: 'https://app.example.com/approvals/123',
        };

        await emailService.sendApprovalRejected(data, ['pm@example.com']);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Approval Rejected: Test Activity',
          })
        );

        const call = mockTransporter.sendMail.mock.calls[0][0];
        expect(call.html).toContain('Insufficient justification');
      });
    });

    describe('sendApprovalApproved', () => {
      it('should send final approval email', async () => {
        const data = {
          activityTitle: 'Test Activity',
          activitySn: 'ACT-001',
          actorName: 'Committee User',
          estimatedSpend: '$50,000',
          approvalUrl: 'https://app.example.com/approvals/123',
        };

        await emailService.sendApprovalApproved(data, ['pm@example.com']);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Approval Approved: Test Activity',
          })
        );
      });
    });

    describe('sendVarianceAlert', () => {
      it('should send variance alert email with metrics', async () => {
        const data = {
          activityTitle: 'Test Activity',
          activitySn: 'ACT-001',
          estimated: '$50,000',
          actual: '$65,000',
          variance: '$15,000',
          variancePercent: '30%',
          activityUrl: 'https://app.example.com/activities/123',
        };

        await emailService.sendVarianceAlert(data, ['finance@example.com']);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Variance Alert: Test Activity',
          })
        );

        const call = mockTransporter.sendMail.mock.calls[0][0];
        expect(call.html).toContain('$50,000');
        expect(call.html).toContain('$65,000');
        expect(call.html).toContain('30%');
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render approval submitted template correctly', () => {
      const data = {
        activityTitle: 'Test Activity',
        activitySn: 'ACT-001',
        actorName: 'John Doe',
        estimatedSpend: '$50,000',
        reason: 'Budget increase',
        approvalUrl: 'https://app.example.com/approvals/123',
      };

      const html = emailService.renderApprovalSubmittedTemplate(data);

      expect(html).toContain('Test Activity');
      expect(html).toContain('ACT-001');
      expect(html).toContain('John Doe');
      expect(html).toContain('$50,000');
      expect(html).toContain('Budget increase');
      expect(html).toContain('https://app.example.com/approvals/123');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should render finance approved template correctly', () => {
      const data = {
        activityTitle: 'Test Activity',
        activitySn: 'ACT-001',
        actorName: 'Finance User',
        estimatedSpend: '$50,000',
        approvalUrl: 'https://app.example.com/approvals/123',
      };

      const html = emailService.renderFinanceApprovedTemplate(data);

      expect(html).toContain('Test Activity');
      expect(html).toContain('Finance Approval Granted');
    });

    it('should render rejection template with reason', () => {
      const data = {
        activityTitle: 'Test Activity',
        activitySn: 'ACT-001',
        actorName: 'Finance User',
        estimatedSpend: '$50,000',
        reason: 'Need more details',
        approvalUrl: 'https://app.example.com/approvals/123',
      };

      const html = emailService.renderApprovalRejectedTemplate(data);

      expect(html).toContain('Approval Rejected');
      expect(html).toContain('Need more details');
    });

    it('should render variance alert template with all metrics', () => {
      const data = {
        activityTitle: 'Test Activity',
        activitySn: 'ACT-001',
        estimated: '$50,000',
        actual: '$65,000',
        variance: '$15,000',
        variancePercent: '30%',
        activityUrl: 'https://app.example.com/activities/123',
      };

      const html = emailService.renderVarianceAlertTemplate(data);

      expect(html).toContain('Budget Variance Alert');
      expect(html).toContain('$50,000');
      expect(html).toContain('$65,000');
      expect(html).toContain('$15,000');
      expect(html).toContain('30%');
    });
  });

  describe('htmlToText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Hello World');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should handle HTML entities', () => {
      const html = 'Price: &lt;$100&gt; &amp; Free';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Price: <$100> & Free');
    });

    it('should handle nbsp entities', () => {
      const html = 'Hello&nbsp;World';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      const html = '  <p>  Hello  </p>  ';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Hello');
    });
  });
});
