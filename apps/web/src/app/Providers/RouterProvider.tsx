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
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Invites from '@/pages/Invites';
import Terms from '@/pages/Terms';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Playground from '@/pages/Playground';
import PlaygroundReadingMarks from '@/pages/Playground/ReadingMarks';
import PlaygroundChartLabels from '@/pages/Playground/ChartLabels';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

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
    ]
  : [];

const router = createBrowserRouter([
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
  {
    element: <AuthLayout />,
    children: [
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
]);

function RouterProvider() {
  return <InternalRouterProvider router={router} />;
}

export default RouterProvider;
