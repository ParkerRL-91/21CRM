import { AppRouterProviders } from '@/app/components/AppRouterProviders';
import { LazyRoute } from '@/app/components/LazyRoute';
import { SettingsRoutes } from '@/app/components/SettingsRoutes';
import { VerifyLoginTokenEffect } from '@/auth/components/VerifyLoginTokenEffect';

import { VerifyEmailEffect } from '@/auth/components/VerifyEmailEffect';
import indexAppPath from '@/navigation/utils/indexAppPath';
import { BlankLayout } from '@/ui/layout/page/components/BlankLayout';
import { DefaultLayout } from '@/ui/layout/page/components/DefaultLayout';
import { AppPath } from 'twenty-shared/types';

import { lazy, useMemo } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';

const RecordIndexPage = lazy(() =>
  import('~/pages/object-record/RecordIndexPage').then((module) => ({
    default: module.RecordIndexPage,
  })),
);

const RecordShowPage = lazy(() =>
  import('~/pages/object-record/RecordShowPage').then((module) => ({
    default: module.RecordShowPage,
  })),
);

const SignInUp = lazy(() =>
  import('~/pages/auth/SignInUp').then((module) => ({
    default: module.SignInUp,
  })),
);

const PasswordReset = lazy(() =>
  import('~/pages/auth/PasswordReset').then((module) => ({
    default: module.PasswordReset,
  })),
);

const Authorize = lazy(() =>
  import('~/pages/auth/Authorize').then((module) => ({
    default: module.Authorize,
  })),
);

const CreateWorkspace = lazy(() =>
  import('~/pages/onboarding/CreateWorkspace').then((module) => ({
    default: module.CreateWorkspace,
  })),
);

const CreateProfile = lazy(() =>
  import('~/pages/onboarding/CreateProfile').then((module) => ({
    default: module.CreateProfile,
  })),
);

const SyncEmails = lazy(() =>
  import('~/pages/onboarding/SyncEmails').then((module) => ({
    default: module.SyncEmails,
  })),
);

const InviteTeam = lazy(() =>
  import('~/pages/onboarding/InviteTeam').then((module) => ({
    default: module.InviteTeam,
  })),
);

const ChooseYourPlan = lazy(() =>
  import('~/pages/onboarding/ChooseYourPlan').then((module) => ({
    default: module.ChooseYourPlan,
  })),
);

const PaymentSuccess = lazy(() =>
  import('~/pages/onboarding/PaymentSuccess').then((module) => ({
    default: module.PaymentSuccess,
  })),
);

const BookCallDecision = lazy(() =>
  import('~/pages/onboarding/BookCallDecision').then((module) => ({
    default: module.BookCallDecision,
  })),
);

const BookCall = lazy(() =>
  import('~/pages/onboarding/BookCall').then((module) => ({
    default: module.BookCall,
  })),
);

const QuoteBuilderPage = lazy(() =>
  import('~/pages/cpq/QuoteBuilderPage').then((module) => ({
    default: module.QuoteBuilderPage,
  })),
);

const QuoteListPage = lazy(() =>
  import('~/pages/cpq/QuoteListPage').then((module) => ({
    default: module.QuoteListPage,
  })),
);

const QuickQuotePage = lazy(() =>
  import('~/pages/cpq/QuickQuotePage').then((module) => ({
    default: module.QuickQuotePage,
  })),
);

const CpqDashboardPage = lazy(() =>
  import('~/pages/cpq/CpqDashboardPage').then((module) => ({
    default: module.CpqDashboardPage,
  })),
);

const StandalonePageLayoutPage = lazy(() =>
  import('~/pages/page-layout/StandalonePageLayoutPage').then((module) => ({
    default: module.StandalonePageLayoutPage,
  })),
);

const NotFound = lazy(() =>
  import('~/pages/not-found/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

export const useCreateAppRouter = (
  isFunctionSettingsEnabled?: boolean,
  isAdminPageEnabled?: boolean,
) =>
  // Memoize to avoid rebuilding the router on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <Route
            element={<AppRouterProviders />}
            // To switch state to `loading` temporarily to enable us
            // to set scroll position before the page is rendered
            loader={async () => Promise.resolve(null)}
          >
            <Route element={<DefaultLayout />}>
              <Route
                path={AppPath.Verify}
                element={<VerifyLoginTokenEffect />}
              />
              <Route
                path={AppPath.VerifyEmail}
                element={<VerifyEmailEffect />}
              />
              <Route
                path={AppPath.SignInUp}
                element={
                  <LazyRoute>
                    <SignInUp />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.Invite}
                element={
                  <LazyRoute>
                    <SignInUp />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.ResetPassword}
                element={
                  <LazyRoute>
                    <PasswordReset />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.CreateWorkspace}
                element={
                  <LazyRoute>
                    <CreateWorkspace />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.CreateProfile}
                element={
                  <LazyRoute>
                    <CreateProfile />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.SyncEmails}
                element={
                  <LazyRoute>
                    <SyncEmails />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.InviteTeam}
                element={
                  <LazyRoute>
                    <InviteTeam />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.PlanRequired}
                element={
                  <LazyRoute>
                    <ChooseYourPlan />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.PlanRequiredSuccess}
                element={
                  <LazyRoute>
                    <PaymentSuccess />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.BookCallDecision}
                element={
                  <LazyRoute>
                    <BookCallDecision />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.BookCall}
                element={
                  <LazyRoute>
                    <BookCall />
                  </LazyRoute>
                }
              />
              <Route path={indexAppPath.getIndexAppPath()} element={<></>} />
              <Route
                path={AppPath.RecordIndexPage}
                element={
                  <LazyRoute>
                    <RecordIndexPage />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.RecordShowPage}
                element={
                  <LazyRoute>
                    <RecordShowPage />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.PageLayoutPage}
                element={
                  <LazyRoute>
                    <StandalonePageLayoutPage />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.SettingsCatchAll}
                element={
                  <SettingsRoutes
                    isFunctionSettingsEnabled={isFunctionSettingsEnabled}
                    isAdminPageEnabled={isAdminPageEnabled}
                  />
                }
              />
              <Route
                path="/cpq"
                element={
                  <LazyRoute>
                    <CpqDashboardPage />
                  </LazyRoute>
                }
              />
              <Route
                path="/cpq/dashboard"
                element={
                  <LazyRoute>
                    <CpqDashboardPage />
                  </LazyRoute>
                }
              />
              <Route
                path="/cpq/quick-quote"
                element={
                  <LazyRoute>
                    <QuickQuotePage />
                  </LazyRoute>
                }
              />
              <Route
                path="/cpq/quotes/new"
                element={
                  <LazyRoute>
                    <QuoteBuilderPage />
                  </LazyRoute>
                }
              />
              <Route
                path="/cpq/quotes/:id"
                element={
                  <LazyRoute>
                    <QuoteBuilderPage />
                  </LazyRoute>
                }
              />
              <Route
                path="/cpq/quotes"
                element={
                  <LazyRoute>
                    <QuoteListPage />
                  </LazyRoute>
                }
              />
              <Route
                path={AppPath.NotFoundWildcard}
                element={
                  <LazyRoute>
                    <NotFound />
                  </LazyRoute>
                }
              />
            </Route>
            <Route element={<BlankLayout />}>
              <Route
                path={AppPath.Authorize}
                element={
                  <LazyRoute>
                    <Authorize />
                  </LazyRoute>
                }
              />
            </Route>
          </Route>,
        ),
      ),
    [isFunctionSettingsEnabled, isAdminPageEnabled],
  );
