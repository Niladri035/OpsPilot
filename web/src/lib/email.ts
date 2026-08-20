import { Resend } from "resend";

export type AlertEmailInput = {
  to: string;
  subject: string;
  incidentTitle: string;
  monitorName: string;
  monitorUrl: string;
  severity: string;
  workspaceName: string;
};

function buildEmailHtml(input: AlertEmailInput): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 12px; padding: 30px; border: 1px solid #333;">
    
    <h1 style="color: #ef4444; font-size: 22px; margin-bottom: 10px;">
      ⚠️ Incident Alert
    </h1>
    
    <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">
      OpsPilot detected an issue with your monitored service.
    </p>
    
    <div style="background-color: #27272a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #a1a1aa; padding: 6px 0;">Incident</td>
          <td style="color: #ffffff; padding: 6px 0; font-weight: bold;">${input.incidentTitle}</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa; padding: 6px 0;">Monitor</td>
          <td style="color: #ffffff; padding: 6px 0;">${input.monitorName}</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa; padding: 6px 0;">URL</td>
          <td style="color: #ffffff; padding: 6px 0;">${input.monitorUrl}</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa; padding: 6px 0;">Severity</td>
          <td style="color: #ef4444; padding: 6px 0; font-weight: bold;">${input.severity}</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa; padding: 6px 0;">Workspace</td>
          <td style="color: #ffffff; padding: 6px 0;">${input.workspaceName}</td>
        </tr>
      </table>
    </div>
    
    <p style="color: #a1a1aa; font-size: 13px;">
      Please check your OpsPilot dashboard for more details.
    </p>
    
    <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
    
    <p style="color: #666; font-size: 12px;">
      Sent by OpsPilot — Your AI On-Call Engineer
    </p>
    
  </div>
</body>
</html>
`;
}

export async function sendAlertEmail(input: AlertEmailInput): Promise<{
  success: boolean;
  method: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = input.to || process.env.ALERT_EMAIL_TO;

  if (!to) {
    console.log("[Mock Email] No recipient set. Email skipped.");
    return { success: false, method: "skipped" };
  }

  if (!apiKey) {
    console.log("[Mock Email] RESEND_API_KEY not set.");
    console.log(`[Mock Email] To: ${to}`);
    console.log(`[Mock Email] Subject: ${input.subject}`);
    console.log(`[Mock Email] Incident: ${input.incidentTitle}`);
    console.log(`[Mock Email] Monitor: ${input.monitorName}`);
    console.log(`[Mock Email] URL: ${input.monitorUrl}`);
    console.log(`[Mock Email] Severity: ${input.severity}`);
    return { success: true, method: "mock" };
  }

  try {
    const resend = new Resend(apiKey);

    const from = process.env.ALERT_EMAIL_FROM || "onboarding@resend.dev";

    await resend.emails.send({
      from,
      to,
      subject: input.subject,
      html: buildEmailHtml(input),
    });

    console.log(`[Email Sent] To: ${to} | Subject: ${input.subject}`);

    return { success: true, method: "resend" };
  } catch (error) {
    console.error("[Email Failed]", error);
    return { success: false, method: "error" };
  }
}