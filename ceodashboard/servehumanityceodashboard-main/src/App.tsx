import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Shell Layout
import { Route as DashboardLayoutRoute } from "./routes/_dashboard";

// Top-level Auth routes
import { Route as LoginRoute } from "./routes/login";
import { Route as ForgotPasswordRoute } from "./routes/forgot-password";
import { Route as ResetPasswordRoute } from "./routes/reset-password";

// Main Dashboard Pages
import { Route as OverviewRoute } from "./routes/_dashboard.index";
import { Route as DonateRoute } from "./routes/_dashboard.donate";
import { Route as ChaptersRoute } from "./routes/_dashboard.chapters";
import { Route as RolesRoute } from "./routes/_dashboard.roles";
import { Route as VerificationRoute } from "./routes/_dashboard.verification";
import { Route as OperationsRoute } from "./routes/_dashboard.operations";
import { Route as WebsiteRoute } from "./routes/_dashboard.website";
import { Route as WebsiteEventsRoute } from "./routes/_dashboard.website-events";
import { Route as ReviewsRoute } from "./routes/_dashboard.reviews";
import { Route as ContactMessagesRoute } from "./routes/_dashboard.contact-messages";
import { Route as NewsletterRoute } from "./routes/_dashboard.newsletter";
import { Route as BoardRoute } from "./routes/_dashboard.board";
import { Route as ItRoute } from "./routes/_dashboard.it";
import { Route as ItBoardMessagesRoute } from "./routes/_dashboard.it-board-messages";
import { Route as ItChapterMessagesRoute } from "./routes/_dashboard.it-chapter-messages";
import { Route as ContactItRoute } from "./routes/_dashboard.contact-it";
import { Route as ReportsRoute } from "./routes/_dashboard.reports";
import { Route as NotificationsRoute } from "./routes/_dashboard.notifications";
import { Route as WarningMailRoute } from "./routes/_dashboard.warning-mail";
import { Route as SettingsRoute } from "./routes/_dashboard.settings";

// Documentation Pages
import { Route as DocIndexRoute } from "./routes/_dashboard.documentation.index";
import { Route as DocCasesRoute } from "./routes/_dashboard.documentation.cases";
import { Route as DocHealthRoute } from "./routes/_dashboard.documentation.health";
import { Route as DocMarriageRoute } from "./routes/_dashboard.documentation.marriage";
import { Route as DocFeeRoute } from "./routes/_dashboard.documentation.fee";
import { Route as DocRationRoute } from "./routes/_dashboard.documentation.ration";
import { Route as DocMonthlyReportsRoute } from "./routes/_dashboard.documentation.monthly-reports";
import { Route as DocRationFilesRoute } from "./routes/_dashboard.documentation.ration-files";
import { Route as DocDrivesRoute } from "./routes/_dashboard.documentation.drives";
import { Route as DocStatsRoute } from "./routes/_dashboard.documentation.stats";
import { Route as DocReferencesRoute } from "./routes/_dashboard.documentation.references";
import { Route as DocTypeParamRoute } from "./routes/_dashboard.documentation.$docType";

// Finance Pages
import { Route as FinanceIndexRoute } from "./routes/_dashboard.finance.index";
import { Route as FinanceMonthlyDonationsRoute } from "./routes/_dashboard.finance.monthly-donations";
import { Route as FinanceCaseFilesRoute } from "./routes/_dashboard.finance.case-files";

// Media Pages
import { Route as MediaIndexRoute } from "./routes/_dashboard.media.index";
import { Route as MediaCaseFilesRoute } from "./routes/_dashboard.media.case-files";
import { Route as MediaCertificateGeneratorRoute } from "./routes/_dashboard.media.certificate-generator";
import { Route as MediaTemplatesRoute } from "./routes/_dashboard.media.templates";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const DashboardLayout = DashboardLayoutRoute.component;
  const Login = LoginRoute.component;
  const ForgotPassword = ForgotPasswordRoute.component;
  const ResetPassword = ResetPasswordRoute.component;

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated Dashboard Shell Layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<OverviewRoute.component />} />
        <Route path="/donate" element={<DonateRoute.component />} />
        <Route path="/chapters" element={<ChaptersRoute.component />} />
        <Route path="/roles" element={<RolesRoute.component />} />
        <Route path="/verification" element={<VerificationRoute.component />} />
        <Route path="/operations" element={<OperationsRoute.component />} />
        <Route path="/website" element={<WebsiteRoute.component />} />
        <Route path="/website-events" element={<WebsiteEventsRoute.component />} />
        <Route path="/reviews" element={<ReviewsRoute.component />} />
        <Route path="/contact-messages" element={<ContactMessagesRoute.component />} />
        <Route path="/newsletter" element={<NewsletterRoute.component />} />
        <Route path="/board" element={<BoardRoute.component />} />
        <Route path="/it" element={<ItRoute.component />} />
        <Route path="/it-board-messages" element={<ItBoardMessagesRoute.component />} />
        <Route path="/it-chapter-messages" element={<ItChapterMessagesRoute.component />} />
        <Route path="/contact-it" element={<ContactItRoute.component />} />
        <Route path="/reports" element={<ReportsRoute.component />} />
        <Route path="/notifications" element={<NotificationsRoute.component />} />
        <Route path="/warning-mail" element={<WarningMailRoute.component />} />
        <Route path="/settings" element={<SettingsRoute.component />} />

        {/* Documentation Sub-routes */}
        <Route path="/documentation" element={<DocIndexRoute.component />} />
        <Route path="/documentation/cases" element={<DocCasesRoute.component />} />
        <Route path="/documentation/health" element={<DocHealthRoute.component />} />
        <Route path="/documentation/marriage" element={<DocMarriageRoute.component />} />
        <Route path="/documentation/fee" element={<DocFeeRoute.component />} />
        <Route path="/documentation/ration" element={<DocRationRoute.component />} />
        <Route path="/documentation/monthly-reports" element={<DocMonthlyReportsRoute.component />} />
        <Route path="/documentation/ration-files" element={<DocRationFilesRoute.component />} />
        <Route path="/documentation/drives" element={<DocDrivesRoute.component />} />
        <Route path="/documentation/stats" element={<DocStatsRoute.component />} />
        <Route path="/documentation/references" element={<DocReferencesRoute.component />} />
        <Route path="/documentation/:docType" element={<DocTypeParamRoute.component />} />

        {/* Finance Sub-routes */}
        <Route path="/finance" element={<FinanceIndexRoute.component />} />
        <Route path="/finance/monthly-donations" element={<FinanceMonthlyDonationsRoute.component />} />
        <Route path="/finance/case-files" element={<FinanceCaseFilesRoute.component />} />

        {/* Media Sub-routes */}
        <Route path="/media" element={<MediaIndexRoute.component />} />
        <Route path="/media/case-files" element={<MediaCaseFilesRoute.component />} />
        <Route path="/media/certificate-generator" element={<MediaCertificateGeneratorRoute.component />} />
        <Route path="/media/templates" element={<MediaTemplatesRoute.component />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
