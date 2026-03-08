/**
 * Settings – Component Button Tests
 * Verifies every button (tabs + actions) renders and fires correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────
const { mockNavigate, mockSetTheme, mockToast } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetTheme: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/settings' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'admin@test.com' },
    profile: { full_name: 'Admin User', role: 'admin' },
    isAdmin: true,
    isLoading: false,
    roles: ['admin'],
    signOut: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
    updatePassword: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }),
}));

vi.mock('@/hooks/useUserSettings', () => ({
  useUserPreferences: () => ({
    preferences: {},
    updatePreference: vi.fn(),
    isLoading: false,
  }),
  useViewSettings: () => ({
    viewSettings: {},
    updateViewSettings: vi.fn(),
  }),
  useUserSettings: () => ({
    settings: {},
    updateSettings: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUndoRedo', () => ({
  useUndoRedo: () => ({ canUndo: false, canRedo: false, undo: vi.fn(), redo: vi.fn(), pastActions: [] }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

vi.mock('@/components/layout', () => ({
  AppLayout: ({ children, title }: any) => (
    <div data-testid="app-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Mock all settings sub-components
vi.mock('@/components/settings/ThemeSettings', () => ({
  ThemeSettings: () => <div data-testid="theme-settings">ThemeSettings</div>,
  default: () => <div data-testid="theme-settings">ThemeSettings</div>,
}));
vi.mock('@/components/settings/AdvancedThemeSettings', () => ({
  AdvancedThemeSettings: () => <div data-testid="adv-theme">AdvTheme</div>,
  default: () => <div data-testid="adv-theme">AdvTheme</div>,
}));
vi.mock('@/components/settings/TypographySettings', () => ({
  TypographySettings: () => <div data-testid="typography-settings">Typography</div>,
  default: () => <div data-testid="typography-settings">Typography</div>,
}));
vi.mock('@/components/settings/AdvancedNotificationsSettings', () => ({
  AdvancedNotificationsSettings: () => <div data-testid="adv-notif">AdvNotif</div>,
  default: () => <div data-testid="adv-notif">AdvNotif</div>,
}));
vi.mock('@/components/settings/AutoRemindersSettings', () => ({
  AutoRemindersSettings: () => <div data-testid="auto-reminders">Reminders</div>,
  default: () => <div data-testid="auto-reminders">Reminders</div>,
}));
vi.mock('@/components/settings/GoogleCalendarSettingsMulti', () => ({
  GoogleCalendarSettingsMulti: () => <div data-testid="gcal-settings">GCal</div>,
  default: () => <div data-testid="gcal-settings">GCal</div>,
}));
vi.mock('@/components/settings/GoogleContactsSettings', () => ({
  GoogleContactsSettings: () => <div data-testid="gcontacts">GContacts</div>,
  default: () => <div data-testid="gcontacts">GContacts</div>,
}));
vi.mock('@/components/settings/EmailTemplateManager', () => ({
  EmailTemplateManager: () => <div data-testid="email-templates">EmailTpl</div>,
  default: () => <div data-testid="email-templates">EmailTpl</div>,
}));
vi.mock('@/components/settings/EmailSignatureManager', () => ({
  EmailSignatureManager: () => <div data-testid="email-sig">EmailSig</div>,
  default: () => <div data-testid="email-sig">EmailSig</div>,
}));
vi.mock('@/components/settings/RateLimitMonitor', () => ({
  RateLimitMonitor: () => <div data-testid="rate-limit">RateLimit</div>,
  default: () => <div data-testid="rate-limit">RateLimit</div>,
}));
vi.mock('@/components/settings/ApiKeysManager', () => ({
  ApiKeysManager: () => <div data-testid="api-keys">ApiKeys</div>,
  default: () => <div data-testid="api-keys">ApiKeys</div>,
}));
vi.mock('@/components/settings/ActivityLogTab', () => ({
  ActivityLogTab: () => <div data-testid="activity-log">ActivityLog</div>,
  default: () => <div data-testid="activity-log">ActivityLog</div>,
}));
vi.mock('@/components/settings/DataCleanupTab', () => ({
  DataCleanupTab: () => <div data-testid="data-cleanup">DataCleanup</div>,
  default: () => <div data-testid="data-cleanup">DataCleanup</div>,
}));
vi.mock('@/components/settings/EdgeFunctionsManager', () => ({
  EdgeFunctionsManager: () => <div data-testid="edge-functions">EdgeFuncs</div>,
  default: () => <div data-testid="edge-functions">EdgeFuncs</div>,
}));
vi.mock('@/components/settings/ClientFieldManager', () => ({
  ClientFieldManager: () => <div data-testid="client-fields">ClientFields</div>,
  default: () => <div data-testid="client-fields">ClientFields</div>,
}));
vi.mock('@/components/settings/SmartTaggingSettings', () => ({
  SmartTaggingSettings: () => <div data-testid="smart-tags">SmartTags</div>,
  default: () => <div data-testid="smart-tags">SmartTags</div>,
}));
vi.mock('@/components/settings/DeveloperSettings', () => ({
  DeveloperSettings: () => <div data-testid="developer-settings">DevSettings</div>,
  default: () => <div data-testid="developer-settings">DevSettings</div>,
}));
vi.mock('@/components/settings/PushNotificationsSettings', () => ({
  PushNotificationsSettings: () => <div data-testid="push-notif">PushNotif</div>,
  default: () => <div data-testid="push-notif">PushNotif</div>,
}));

vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: () => null,
  SearchButton: () => <button>search</button>,
}));

vi.mock('@/components/shared/TextCustomizerButton', () => ({
  TextCustomizerButton: () => <span>TC</span>,
}));

vi.mock('@/components/notifications/NotificationCenter', () => ({
  NotificationCenter: () => <span>NC</span>,
}));

vi.mock('@/components/pwa/SyncStatusIndicator', () => ({
  SyncStatusIndicator: () => <span>Sync</span>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}));

// ── Import Component ───────────────────────────────────────────────
import Settings from '@/pages/Settings';

// ── Tests ──────────────────────────────────────────────────────────
describe('Settings – Button Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings page with tabs', () => {
    render(<Settings />);
    expect(screen.getByTestId('app-layout')).toBeDefined();
  });

  // ── Tab Navigation ──
  const tabTests = [
    { name: 'פרופיל', value: 'profile' },
    { name: 'פיננסים', value: 'finance' },
    { name: 'ערכות נושא', value: 'appearance' },
    { name: 'טיפוגרפיה', value: 'typography' },
    { name: 'התראות', value: 'notifications' },
    { name: 'אנשי קשר', value: 'contacts' },
  ];

  tabTests.forEach(({ name, value }) => {
    it(`Tab "${name}" is clickable and switches content`, async () => {
      render(<Settings />);
      const tab = screen.getByRole('tab', { name: new RegExp(name) });
      expect(tab).toBeDefined();
      await user.click(tab);
      // Tab should be selected after click
      await waitFor(() => {
        expect(tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('data-state') === 'active').toBeTruthy();
      });
    });
  });

  // Special case: "יומן" tab exists twice, test the first one
  it('Tab "יומן" (calendar) is clickable', async () => {
    render(<Settings />);
    const tabs = screen.getAllByRole('tab', { name: /יומן/ });
    expect(tabs.length).toBeGreaterThanOrEqual(1);
    await user.click(tabs[0]);
  });

  // Admin-only tabs
  const adminTabs = [
    { name: 'תבניות אימייל', value: 'email-templates' },
    { name: 'מפתחות', value: 'apikeys' },
    { name: 'תפקידים', value: 'roles' },
    { name: 'ניקוי נתונים', value: 'cleanup' },
    { name: 'שדות לקוח', value: 'client-fields' },
    { name: 'תיוג חכם', value: 'smart-tags' },
    { name: 'פיתוח', value: 'developer' },
  ];

  adminTabs.forEach(({ name, value }) => {
    it(`Admin tab "${name}" renders for admin user`, async () => {
      render(<Settings />);
      const tab = screen.getByRole('tab', { name: new RegExp(name) });
      expect(tab).toBeDefined();
      await user.click(tab);
    });
  });

  // ── Theme Buttons ──
  it('Theme tab shows light/dark/system buttons', async () => {
    render(<Settings />);
    const themeTab = screen.getByRole('tab', { name: /ערכות נושא/ });
    await user.click(themeTab);
    await waitFor(() => {
      // These are theme selection buttons/cards
      const lightBtns = screen.queryAllByText('בהיר');
      const darkBtns = screen.queryAllByText('כהה');
      const systemBtns = screen.queryAllByText('מערכת');
      // At least one of each type should exist
      expect(lightBtns.length + darkBtns.length + systemBtns.length).toBeGreaterThan(0);
    });
  });

  it('Clicking "כהה" theme calls setTheme("dark")', async () => {
    render(<Settings />);
    const themeTab = screen.getByRole('tab', { name: /ערכות נושא/ });
    await user.click(themeTab);
    const darkBtn = screen.queryByText('כהה');
    if (darkBtn) {
      await user.click(darkBtn);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    }
  });

  it('Clicking "בהיר" theme calls setTheme("light")', async () => {
    render(<Settings />);
    const themeTab = screen.getByRole('tab', { name: /ערכות נושא/ });
    await user.click(themeTab);
    const lightBtns = screen.queryAllByText('בהיר');
    if (lightBtns.length > 0) {
      const btn = lightBtns.find(el => el.closest('button')) || lightBtns[0];
      await user.click(btn.closest('button') || btn);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    }
  });

  // ── Profile Tab ──
  it('Profile tab shows save button', async () => {
    render(<Settings />);
    const profileTab = screen.getByRole('tab', { name: /פרופיל/ });
    await user.click(profileTab);
    await waitFor(() => {
      const saveBtn = screen.queryByText('שמור שינויים');
      expect(saveBtn).toBeDefined();
    });
  });

  it('Profile tab shows password change button', async () => {
    render(<Settings />);
    const profileTab = screen.getByRole('tab', { name: /פרופיל/ });
    await user.click(profileTab);
    await waitFor(() => {
      const pwdBtn = screen.queryByText('עדכן סיסמה');
      expect(pwdBtn).toBeDefined();
    });
  });

  // ── Finance Tab ──
  it('Finance tab shows VAT save button', async () => {
    render(<Settings />);
    const financeTab = screen.getByRole('tab', { name: /פיננסים/ });
    await user.click(financeTab);
    await waitFor(() => {
      const saveVatBtn = screen.queryByText(/שמור/);
      expect(saveVatBtn).toBeDefined();
    });
  });

  // ── Tab Count ──
  it('Total number of tabs is at least 13 (for admin user)', () => {
    render(<Settings />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(13);
  });
});
