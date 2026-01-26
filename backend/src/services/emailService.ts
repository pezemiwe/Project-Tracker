import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { settingsService } from "./settingsService.js";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface ApprovalEmailData {
  activityTitle: string;
  activitySn: string;
  actorName: string;
  estimatedSpend: string;
  reason?: string;
  approvalUrl: string;
}

interface VarianceAlertData {
  activityTitle: string;
  activitySn: string;
  estimated: string;
  actual: string;
  variance: string;
  variancePercent: string;
  activityUrl: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = (await settingsService.getSetting("smtpHost")) as string;
    const port = (await settingsService.getSetting("smtpPort")) as number;
    const user = (await settingsService.getSetting("smtpUser")) as string;
    const password = (await settingsService.getSetting(
      "smtpPassword"
    )) as string;

    if (!host || !port) {
      throw new Error("SMTP configuration incomplete");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth:
        user && password
          ? {
              user,
              pass: password,
            }
          : undefined,
    });

    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const enabled = (await settingsService.getSetting(
      "emailNotificationsEnabled"
    )) as boolean;

    if (!enabled) {
      console.log("Email notifications disabled, skipping email send");
      return;
    }

    try {
      const from = (await settingsService.getSetting(
        "emailFromAddress"
      )) as string;
      const transporter = await this.getTransporter();

      await transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("SMTP connection test failed:", error);
      return false;
    }
  }

  // Email Templates

  async sendApprovalSubmitted(
    data: ApprovalEmailData,
    to: string[]
  ): Promise<void> {
    const subject = `New Approval Pending: ${data.activityTitle}`;
    const html = this.renderApprovalSubmittedTemplate(data);

    await this.sendEmail({ to, subject, html });
  }

  async sendApprovalFinanceApproved(
    data: ApprovalEmailData,
    to: string[]
  ): Promise<void> {
    const subject = `Finance Approved: ${data.activityTitle}`;
    const html = this.renderFinanceApprovedTemplate(data);

    await this.sendEmail({ to, subject, html });
  }

  async sendApprovalRejected(
    data: ApprovalEmailData,
    to: string[]
  ): Promise<void> {
    const subject = `Approval Rejected: ${data.activityTitle}`;
    const html = this.renderApprovalRejectedTemplate(data);

    await this.sendEmail({ to, subject, html });
  }

  async sendApprovalApproved(
    data: ApprovalEmailData,
    to: string[]
  ): Promise<void> {
    const subject = `Approval Approved: ${data.activityTitle}`;
    const html = this.renderApprovalApprovedTemplate(data);

    await this.sendEmail({ to, subject, html });
  }

  async sendVarianceAlert(
    data: VarianceAlertData,
    to: string[]
  ): Promise<void> {
    const subject = `Variance Alert: ${data.activityTitle}`;
    const html = this.renderVarianceAlertTemplate(data);

    await this.sendEmail({ to, subject, html });
  }

  // Template Renderers

  private renderApprovalSubmittedTemplate(data: ApprovalEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Approval Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${data.actorName}</strong> has submitted a new approval request that requires your review.</p>

              <div class="details">
                <h3>Approval Details</h3>
                <ul>
                  <li><strong>Activity SN:</strong> ${data.activitySn}</li>
                  <li><strong>Activity:</strong> ${data.activityTitle}</li>
                  <li><strong>Estimated Spend:</strong> ${data.estimatedSpend}</li>
                  ${data.reason ? `<li><strong>Reason:</strong> ${data.reason}</li>` : ""}
                </ul>
              </div>

              <a href="${data.approvalUrl}" class="button">Review Approval</a>

              <p>Please review and take action on this approval request at your earliest convenience.</p>
            </div>
            <div class="footer">
              <p>Donor Oversight System | Automated Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderFinanceApprovedTemplate(data: ApprovalEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Finance Approval Granted</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>The Finance team has approved the following request. It now requires Committee approval.</p>

              <div class="details">
                <h3>Approval Details</h3>
                <ul>
                  <li><strong>Activity SN:</strong> ${data.activitySn}</li>
                  <li><strong>Activity:</strong> ${data.activityTitle}</li>
                  <li><strong>Estimated Spend:</strong> ${data.estimatedSpend}</li>
                </ul>
              </div>

              <a href="${data.approvalUrl}" class="button">View Approval</a>

              <p>Please proceed with Committee review.</p>
            </div>
            <div class="footer">
              <p>Donor Oversight System | Automated Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderApprovalRejectedTemplate(data: ApprovalEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
            .button { display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Approval Rejected</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your approval request has been rejected.</p>

              <div class="details">
                <h3>Request Details</h3>
                <ul>
                  <li><strong>Activity SN:</strong> ${data.activitySn}</li>
                  <li><strong>Activity:</strong> ${data.activityTitle}</li>
                  <li><strong>Estimated Spend:</strong> ${data.estimatedSpend}</li>
                  ${data.reason ? `<li><strong>Rejection Reason:</strong> ${data.reason}</li>` : ""}
                </ul>
              </div>

              <a href="${data.approvalUrl}" class="button">View Details</a>

              <p>Please review the feedback and make necessary changes before resubmitting.</p>
            </div>
            <div class="footer">
              <p>Donor Oversight System | Automated Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderApprovalApprovedTemplate(data: ApprovalEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Approval Granted</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Congratulations! Your approval request has been fully approved.</p>

              <div class="details">
                <h3>Approved Request</h3>
                <ul>
                  <li><strong>Activity SN:</strong> ${data.activitySn}</li>
                  <li><strong>Activity:</strong> ${data.activityTitle}</li>
                  <li><strong>Estimated Spend:</strong> ${data.estimatedSpend}</li>
                </ul>
              </div>

              <a href="${data.approvalUrl}" class="button">View Activity</a>

              <p>You may now proceed with the approved activity.</p>
            </div>
            <div class="footer">
              <p>Donor Oversight System | Automated Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderVarianceAlertTemplate(data: VarianceAlertData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            .alert-box { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Budget Variance Alert</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A significant budget variance has been detected for the following activity:</p>

              <div class="alert-box">
                <strong>⚠️ Over Budget Alert</strong>
                <p>Actual spend exceeds estimated budget by ${data.variancePercent}</p>
              </div>

              <div class="details">
                <h3>Activity Details</h3>
                <ul>
                  <li><strong>Activity SN:</strong> ${data.activitySn}</li>
                  <li><strong>Activity:</strong> ${data.activityTitle}</li>
                  <li><strong>Estimated:</strong> ${data.estimated}</li>
                  <li><strong>Actual:</strong> ${data.actual}</li>
                  <li><strong>Variance:</strong> ${data.variance} (${data.variancePercent})</li>
                </ul>
              </div>

              <a href="${data.activityUrl}" class="button">Review Activity</a>

              <p>Please review this variance and take appropriate action.</p>
            </div>
            <div class="footer">
              <p>Donor Oversight System | Automated Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
}

export const emailService = new EmailService();
