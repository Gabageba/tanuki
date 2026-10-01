import {
  createBrowserRouter,
  Navigate,
  RouterProvider as InternalRouterProvider,
} from 'react-router';
import Layout from '@/app/Layout';
import AuthLayout from '@/app/AuthLayout';
import RequireAuth from '@/app/RequireAuth';
import RequireStaff from '@/app/RequireStaff';
import GuestOnly from '@/app/GuestOnly';
import RouteError from '@/app/RouteError';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SearchPage from '@/pages/Search/SearchPage';
import Sources from '@/pages/Sources';
import SourcesHealth from '@/pages/SourcesHealth';
import Notifications from '@/pages/Notifications';
import Bookmarks from '@/pages/Bookmarks';
import Catalog from '@/pages/Catalog';
import Title from '@/pages/Title';
import Reader from '@/pages/Reader';
import Login from '@/pages/Login';
import AccountDeletionScheduled from '@/pages/AccountDeletionScheduled';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import RevertEmailChange from '@/pages/RevertEmailChange';
import CancelAccountDeletion from '@/pages/CancelAccountDeletion';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Invites from '@/pages/Invites';
import Terms from '@/pages/Terms';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Playground from '@/pages/Playground';
import PlaygroundReadingMarks from '@/pages/Playground/ReadingMarks';
import PlaygroundChartLabels from '@/pages/Playground/ChartLabels';
import PlaygroundAccountGroups from '@/pages/Playground/AccountGroups';
import PlaygroundHeaderBackground from '@/pages/Playground/HeaderBackground';
import PlaygroundSourcesSetup from '@/pages/Playground/SourcesSetup';
import PlaygroundImportSourcePicker from '@/pages/Playground/ImportSourcePicker';
import PlaygroundThemePicker from '@/pages/Playground/ThemePicker';
import PlaygroundAdultContent from '@/pages/Playground/AdultContent';
import PlaygroundLoginBadge from '@/pages/Playground/LoginBadge';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

// Песочница с макетами вариантов интерфейса — только для разработки, в прод-сборку не попадает.
const PLAYGROUND_ROUTES = import.meta.env.DEV
  ? [
      {
        path: ROUTE_PATHS.PLAYGROUND,
        element: <Playground />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_READING_MARKS,
        element: <PlaygroundReadingMarks />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_CHART_LABELS,
        element: <PlaygroundChartLabels />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_ACCOUNT_GROUPS,
        element: <PlaygroundAccountGroups />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_HEADER_BACKGROUND,
        element: <PlaygroundHeaderBackground />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_SOURCES_SETUP,
        element: <PlaygroundSourcesSetup />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_IMPORT_SOURCE_PICKER,
        element: <PlaygroundImportSourcePicker />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_THEME_PICKER,
        element: <PlaygroundThemePicker />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_ADULT_CONTENT,
        element: <PlaygroundAdultContent />,
      },
      {
        path: ROUTE_PATHS.PLAYGROUND_LOGIN_BADGE,
        element: <PlaygroundLoginBadge />,
      },
    ]
  : [];

const router = createBrowserRouter([
  {
    // Упавший рендер любой страницы — свой экран вместо дефолтного экрана react-router.
    errorElement: <RouteError />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          {
            element: <Layout />,
            children: [
              {
                path: '/',
                element: <Navigate to={ROUTE_PATHS.SOURCES} replace />,
              },
              {
                path: ROUTE_PATHS.SOURCES,
                element: <Sources />,
              },
              {
                path: ROUTE_PATHS.SOURCES_HEALTH,
                element: <SourcesHealth />,
              },
              {
                path: ROUTE_PATHS.SEARCH,
                element: <SearchPage />,
              },
              {
                path: ROUTE_PATHS.CATALOG,
                element: <Catalog />,
              },
              {
                path: ROUTE_PATHS.TITLE,
                element: <Title />,
              },
              {
                path: ROUTE_PATHS.NOTIFICATIONS,
                element: <Notifications />,
              },
              {
                path: ROUTE_PATHS.BOOKMARKS,
                element: <Bookmarks />,
              },
              ...PLAYGROUND_ROUTES,
              {
                element: <RequireStaff />,
                children: [
                  {
                    path: ROUTE_PATHS.INVITES,
                    element: <Invites />,
                  },
                ],
              },
              {
                path: ROUTE_PATHS.PROFILE,
                element: <Profile />,
              },
              {
                path: ROUTE_PATHS.SETTINGS,
                element: <Settings />,
              },
              // Несуществующий адрес — внутри каркаса, чтобы с него было куда уйти по меню.
              {
                path: '*',
                element: <NotFound />,
              },
            ],
          },
          // Читалка живёт вне общего каркаса: она на весь экран и с чёрным фоном, шапка ей мешает.
          // Внутри RequireAuth всё равно остаётся — без сессии её тоже не открыть.
          {
            path: ROUTE_PATHS.READER,
            element: <Reader />,
          },
        ],
      },
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: ROUTE_PATHS.LOGIN,
                element: <Login />,
              },
              {
                path: ROUTE_PATHS.ACCOUNT_DELETION_SCHEDULED,
                element: <AccountDeletionScheduled />,
              },
              {
                path: ROUTE_PATHS.REGISTER,
                element: <Register />,
              },
              {
                path: ROUTE_PATHS.VERIFY_EMAIL,
                element: <VerifyEmail />,
              },
              {
                path: ROUTE_PATHS.FORGOT_PASSWORD,
                element: <ForgotPassword />,
              },
              {
                path: ROUTE_PATHS.RESET_PASSWORD,
                element: <ResetPassword />,
              },
            ],
          },
        ],
      },
      // Документы открываются и гостю (ссылка с регистрации), и уже вошедшему — поэтому вне GuestOnly.
      // Туда же ссылки из писем об аккаунте: их открывают и в браузере с активной сессией.
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTE_PATHS.REVERT_EMAIL_CHANGE,
            element: <RevertEmailChange />,
          },
          {
            path: ROUTE_PATHS.CANCEL_ACCOUNT_DELETION,
            element: <CancelAccountDeletion />,
          },
          {
            path: ROUTE_PATHS.TERMS,
            element: <Terms />,
          },
          {
            path: ROUTE_PATHS.PRIVACY_POLICY,
            element: <PrivacyPolicy />,
          },
        ],
      },
    ],
  },
]);

function RouterProvider() {
  return <InternalRouterProvider router={router} />;
}

export default RouterProvider;
