// PDF Export for Client Profile
// ייצוא פרופיל לקוח ל-PDF

import { downloadPdf } from "@/lib/pdfGenerator";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface ClientData {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  website?: string | null;
  notes?: string | null;
  id_number?: string | null;
  created_at?: string;
}

interface ClientStats {
  totalRevenue?: number;
  totalHours?: number;
  totalProjects?: number;
  totalTasks?: number;
  totalMeetings?: number;
  completedTasks?: number;
}

interface ExportOptions {
  includeNotes?: boolean;
  includeStats?: boolean;
  includeProjects?: boolean;
  includeTasks?: boolean;
  includeMeetings?: boolean;
  includeInvoices?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  active: "פעיל",
  inactive: "לא פעיל",
  lead: "ליד",
  prospect: "פוטנציאלי",
};

export async function exportClientProfileToPdf(
  client: ClientData,
  stats: ClientStats = {},
  projects: any[] = [],
  tasks: any[] = [],
  meetings: any[] = [],
  invoices: any[] = [],
  options: ExportOptions = {
    includeNotes: true,
    includeStats: true,
    includeProjects: true,
    includeTasks: true,
    includeMeetings: true,
    includeInvoices: true,
  },
): Promise<void> {
  const today = format(new Date(), "dd/MM/yyyy", { locale: he });

  const html = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'David', 'Arial', sans-serif; }
      .header { 
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
        color: white;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 20px;
      }
      .header h1 { font-size: 28px; margin-bottom: 8px; color: #d4a843; }
      .header .subtitle { font-size: 14px; opacity: 0.8; }
      .header .badge { 
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        background: rgba(212, 168, 67, 0.2);
        border: 1px solid rgba(212, 168, 67, 0.5);
        color: #d4a843;
        font-size: 13px;
        margin-top: 8px;
      }
      .section { margin-bottom: 20px; }
      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #1e3a5f;
        border-bottom: 2px solid #d4a843;
        padding-bottom: 6px;
        margin-bottom: 12px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .info-item {
        padding: 8px 12px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .info-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
      .info-value { font-size: 14px; color: #1e293b; font-weight: 600; }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .stat-card {
        text-align: center;
        padding: 12px;
        background: #f0f9ff;
        border-radius: 8px;
        border: 1px solid #bae6fd;
      }
      .stat-value { font-size: 24px; font-weight: bold; color: #1e3a5f; }
      .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      th {
        background: #f1f5f9;
        padding: 8px;
        text-align: right;
        border-bottom: 2px solid #e2e8f0;
        color: #475569;
        font-weight: 600;
      }
      td {
        padding: 8px;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
      }
      tr:nth-child(even) { background: #fafafa; }
      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
      }
      .notes-box {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 12px;
        font-size: 13px;
        color: #92400e;
        white-space: pre-wrap;
      }
    </style>

    <!-- Header -->
    <div class="header">
      <h1>${client.name}</h1>
      <div class="subtitle">
        ${client.company ? `${client.company} | ` : ""}
        דו"ח תאריך: ${today}
      </div>
      ${client.status ? `<div class="badge">${STATUS_LABELS[client.status] || client.status}</div>` : ""}
      ${client.stage ? `<div class="badge" style="margin-right: 8px; margin-left: 8px;">${client.stage}</div>` : ""}
    </div>

    <!-- Contact Info -->
    <div class="section">
      <div class="section-title">פרטי קשר</div>
      <div class="info-grid">
        ${
          client.phone
            ? `
          <div class="info-item">
            <div class="info-label">טלפון</div>
            <div class="info-value" dir="ltr" style="text-align: left;">${client.phone}</div>
          </div>
        `
            : ""
        }
        ${
          client.email
            ? `
          <div class="info-item">
            <div class="info-label">אימייל</div>
            <div class="info-value">${client.email}</div>
          </div>
        `
            : ""
        }
        ${
          client.address
            ? `
          <div class="info-item">
            <div class="info-label">כתובת</div>
            <div class="info-value">${client.address}</div>
          </div>
        `
            : ""
        }
        ${
          client.website
            ? `
          <div class="info-item">
            <div class="info-label">אתר</div>
            <div class="info-value">${client.website}</div>
          </div>
        `
            : ""
        }
        ${
          client.id_number
            ? `
          <div class="info-item">
            <div class="info-label">מספר זהות / ח.פ</div>
            <div class="info-value">${client.id_number}</div>
          </div>
        `
            : ""
        }
        ${
          client.created_at
            ? `
          <div class="info-item">
            <div class="info-label">תאריך יצירה</div>
            <div class="info-value">${format(new Date(client.created_at), "dd/MM/yyyy", { locale: he })}</div>
          </div>
        `
            : ""
        }
      </div>
    </div>

    ${
      options.includeStats
        ? `
    <!-- Stats -->
    <div class="section">
      <div class="section-title">סיכום נתונים</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">₪${(stats.totalRevenue || 0).toLocaleString("he-IL")}</div>
          <div class="stat-label">הכנסות</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalHours || 0}</div>
          <div class="stat-label">שעות עבודה</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalProjects || 0}</div>
          <div class="stat-label">פרויקטים</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalTasks || 0}</div>
          <div class="stat-label">משימות</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalMeetings || 0}</div>
          <div class="stat-label">פגישות</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.completedTasks || 0}</div>
          <div class="stat-label">משימות שהושלמו</div>
        </div>
      </div>
    </div>
    `
        : ""
    }

    ${
      options.includeProjects && projects.length > 0
        ? `
    <!-- Projects -->
    <div class="section">
      <div class="section-title">פרויקטים (${projects.length})</div>
      <table>
        <thead>
          <tr>
            <th>שם הפרויקט</th>
            <th>סטטוס</th>
            <th>תאריך התחלה</th>
          </tr>
        </thead>
        <tbody>
          ${projects
            .slice(0, 15)
            .map(
              (p) => `
            <tr>
              <td>${p.name || "-"}</td>
              <td>${p.status || "-"}</td>
              <td>${p.start_date ? format(new Date(p.start_date), "dd/MM/yyyy") : "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${projects.length > 15 ? `<p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 8px;">ועוד ${projects.length - 15} פרויקטים...</p>` : ""}
    </div>
    `
        : ""
    }

    ${
      options.includeTasks && tasks.length > 0
        ? `
    <!-- Tasks -->
    <div class="section">
      <div class="section-title">משימות (${tasks.length})</div>
      <table>
        <thead>
          <tr>
            <th>משימה</th>
            <th>סטטוס</th>
            <th>תאריך יעד</th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .slice(0, 10)
            .map(
              (t) => `
            <tr>
              <td>${t.title || "-"}</td>
              <td>${t.status || "-"}</td>
              <td>${t.due_date ? format(new Date(t.due_date), "dd/MM/yyyy") : "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${tasks.length > 10 ? `<p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 8px;">ועוד ${tasks.length - 10} משימות...</p>` : ""}
    </div>
    `
        : ""
    }

    ${
      options.includeMeetings && meetings.length > 0
        ? `
    <!-- Meetings -->
    <div class="section">
      <div class="section-title">פגישות (${meetings.length})</div>
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>סוג</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody>
          ${meetings
            .slice(0, 10)
            .map(
              (m) => `
            <tr>
              <td>${m.start_time ? format(new Date(m.start_time), "dd/MM/yyyy") : "-"}</td>
              <td>${m.meeting_type || "-"}</td>
              <td>${(m.notes || "-").substring(0, 50)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    ${
      options.includeInvoices && invoices.length > 0
        ? `
    <!-- Invoices -->
    <div class="section">
      <div class="section-title">חשבוניות (${invoices.length})</div>
      <table>
        <thead>
          <tr>
            <th>מספר</th>
            <th>סכום</th>
            <th>סטטוס</th>
            <th>תאריך</th>
          </tr>
        </thead>
        <tbody>
          ${invoices
            .slice(0, 10)
            .map(
              (inv) => `
            <tr>
              <td>${inv.invoice_number || inv.id?.substring(0, 8) || "-"}</td>
              <td>₪${(inv.amount || 0).toLocaleString("he-IL")}</td>
              <td>${inv.status || "-"}</td>
              <td>${inv.created_at ? format(new Date(inv.created_at), "dd/MM/yyyy") : "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    ${
      options.includeNotes && client.notes
        ? `
    <!-- Notes -->
    <div class="section">
      <div class="section-title">הערות</div>
      <div class="notes-box">${client.notes}</div>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div class="footer">
      <p>דו"ח זה הופק אוטומטית מ-ArchFlow CRM בתאריך ${today}</p>
      <p>© כל הזכויות שמורות</p>
    </div>
  `;

  const filename = `פרופיל_${client.name.replace(/\s+/g, "_")}_${today.replace(/\//g, "-")}.pdf`;

  await downloadPdf(html, filename, {
    margin: 10,
    pageSize: "a4",
    orientation: "portrait",
  });
}
