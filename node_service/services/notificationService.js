const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./sesService');
const { sendSMS } = require('./snsService');

/**
 * createNotification
 *
 * @param {object} params
 *   userId        — recipient user ID
 *   ticketId      — linked ticket ID (optional)
 *   type          — notification type enum
 *   title         — short title shown in-app
 *   message       — plain text message shown in-app
 *   channels      — { inApp, email, sms }
 *   meta          — extra context for email rendering:
 *                   { ticketTitle, shortId, rejectionReason, performedByRole }
 * @param {object} options — mongoose save options (e.g. { session })
 */
const createNotification = async ({
    userId,
    ticketId = null,
    type,
    title,
    message,
    channels = { inApp: true, email: false, sms: false },
    meta = {}
}, options = {}) => {
    if (!userId || !type || !title || !message) return null;

    // Auto-enable email for important lifecycle events
    const IMPORTANT_EVENTS = [
        'TICKET_CREATED',
        'TICKET_RESOLVED',
        'TICKET_REJECTED',
        'DOCUMENT_REJECTED',
        'STATUS_CHANGED'
    ];
    if (IMPORTANT_EVENTS.includes(type)) {
        channels.email = true;
    }

    const notification = new Notification({
        userId,
        ticketId,
        type,
        title,
        message,
        channels: {
            inApp: channels.inApp !== false,
            email: !!channels.email,
            sms: !!channels.sms
        }
    });

    await notification.save(options);

    if (channels.email || channels.sms) {
        try {
            const user = await User.findById(userId).select('email phoneNumber name').lean();

            if (channels.email && user?.email) {
                const emailHtml = buildEmailHtml({ type, title, message, meta, userName: user.name });
                await sendEmail({
                    to: user.email,
                    subject: buildEmailSubject({ type, meta }),
                    message: emailHtml
                });
            }

            if (channels.sms && user?.phoneNumber) {
                await sendSMS({ phoneNumber: user.phoneNumber, message });
            }
        } catch (err) {
            console.error('[Notifications] Delivery failed (non-critical):', err.message);
        }
    }

    return notification;
};

/**
 * Build a professional email subject line with ticket reference
 */
const buildEmailSubject = ({ type, meta }) => {
    const ref = meta?.shortId ? `[#${meta.shortId}] ` : '';
    switch (type) {
        case 'TICKET_CREATED':   return `${ref}Your Service Request Has Been Received — FinnovaX`;
        case 'TICKET_RESOLVED':  return `${ref}Your Request Has Been Resolved — FinnovaX`;
        case 'TICKET_REJECTED':
        case 'DOCUMENT_REJECTED': return `${ref}Action Required: Request Rejected — FinnovaX`;
        case 'STATUS_CHANGED':   return `${ref}Ticket Status Update — FinnovaX`;
        case 'RETURNED_TO_L1':   return `${ref}Ticket Under Further Review — FinnovaX`;
        case 'FRAUD_HOLD':       return `${ref}Security Review In Progress — FinnovaX`;
        default:                 return `${ref}FinnovaX Notification`;
    }
};

/**
 * Build the full branded HTML email body
 */
const buildEmailHtml = ({ type, title, message, meta = {}, userName }) => {
    const { ticketTitle = '', shortId = '', rejectionReason = '', performedByRole = 'Our Review Team' } = meta;

    const greeting = `Hello ${userName || 'Valued Investor'},`;
    const ticketRef = shortId ? `#${shortId}` : null;
    const ticketLabel = ticketTitle || title;

    const wrapperOpen = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; color: #18181b; line-height: 1.6;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background-color: #18181b; padding: 28px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">FinnovaX</h1>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #a1a1aa; letter-spacing: 0.5px; text-transform: uppercase;">Investor Services Portal</p>
                </div>
                <!-- Body -->
                <div style="padding: 36px 40px;">
    `;

    const wrapperClose = `
                </div>
                <!-- Footer -->
                <div style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 20px 40px; text-align: center;">
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px;">FinnovaX Support Team &nbsp;·&nbsp; This is an automated notification</p>
                    <p style="margin: 6px 0 0; color: #d4d4d8; font-size: 11px;">© ${new Date().getFullYear()} FinnovaX. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;

    // Ticket reference banner (appears in all emails with a ticketId)
    const ticketRefBanner = ticketRef ? `
        <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center;">
            <div>
                <p style="margin: 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Reference</p>
                <p style="margin: 2px 0 0; font-size: 15px; font-weight: 600; color: #18181b; font-family: 'Courier New', monospace;">${ticketRef}</p>
                ${ticketLabel ? `<p style="margin: 2px 0 0; font-size: 13px; color: #52525b;">${ticketLabel}</p>` : ''}
            </div>
        </div>
    ` : '';

    let innerContent;

    switch (type) {
        case 'TICKET_CREATED':
            innerContent = `
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #18181b;">We've received your request 📝</h2>
                <p style="margin: 0 0 20px; font-size: 14px; color: #71717a;">Submitted successfully and queued for review</p>
                ${ticketRefBanner}
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${greeting}</p>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">Your service request has been successfully submitted. Our team will begin reviewing it shortly and keep you updated at every step.</p>
                <div style="background-color: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px; padding: 14px 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #15803d; font-size: 14px;"><strong>What happens next?</strong><br/>An L1 agent will review your request and may request additional documents if needed. You will be notified of every status change.</p>
                </div>
                <p style="color: #71717a; font-size: 14px; margin: 0;">Best regards,<br/><strong style="color: #18181b;">The FinnovaX Team</strong></p>
            `;
            break;

        case 'TICKET_RESOLVED':
            innerContent = `
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #18181b;">Your request has been resolved 🎉</h2>
                <p style="margin: 0 0 20px; font-size: 14px; color: #71717a;">Approved by ${performedByRole}</p>
                ${ticketRefBanner}
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${greeting}</p>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">We are pleased to inform you that your service request has been reviewed, approved, and successfully processed by our team.</p>
                ${message ? `
                <div style="background-color: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px; padding: 14px 16px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px;">Resolution Note</p>
                    <p style="margin: 0; color: #15803d; font-size: 14px;">${message}</p>
                </div>` : ''}
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">The changes have been applied to your account. Please allow up to 24 hours for all systems to reflect the update.</p>
                <p style="color: #71717a; font-size: 14px; margin: 0;">Best regards,<br/><strong style="color: #18181b;">The FinnovaX Team</strong></p>
            `;
            break;

        case 'TICKET_REJECTED':
        case 'DOCUMENT_REJECTED':
            innerContent = `
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #18181b;">Action required on your request ⚠️</h2>
                <p style="margin: 0 0 20px; font-size: 14px; color: #71717a;">Reviewed by ${performedByRole}</p>
                ${ticketRefBanner}
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${greeting}</p>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">Unfortunately, we were unable to process your service request at this time. Please review the reason provided below and resubmit with the necessary corrections.</p>
                <div style="background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; padding: 14px 16px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;">Reason for Rejection</p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">${rejectionReason || message}</p>
                </div>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">Please log in to your FinnovaX dashboard to review the full details and resubmit your request.</p>
                <p style="color: #71717a; font-size: 14px; margin: 0;">Best regards,<br/><strong style="color: #18181b;">The FinnovaX Team</strong></p>
            `;
            break;

        case 'STATUS_CHANGED':
        case 'RETURNED_TO_L1':
            innerContent = `
                <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #18181b;">Ticket status update 🔄</h2>
                <p style="margin: 0 0 20px; font-size: 14px; color: #71717a;">Your request is progressing through our review pipeline</p>
                ${ticketRefBanner}
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${greeting}</p>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${message}</p>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">You can log in to your FinnovaX dashboard at any time to track the progress of your request.</p>
                <p style="color: #71717a; font-size: 14px; margin: 0;">Best regards,<br/><strong style="color: #18181b;">The FinnovaX Team</strong></p>
            `;
            break;

        default:
            innerContent = `
                ${ticketRefBanner}
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${greeting}</p>
                <p style="color: #52525b; font-size: 15px; margin: 0 0 12px;">${message}</p>
                <p style="color: #71717a; font-size: 14px; margin: 0;">Best regards,<br/><strong style="color: #18181b;">The FinnovaX Team</strong></p>
            `;
    }

    return wrapperOpen + innerContent + wrapperClose;
};

module.exports = { createNotification };
