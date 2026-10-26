import React from "react";
import {
  Link as RRLink,
  useNavigate as useRRNavigate,
  useLocation as useRRLocation,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
  Outlet,
  Navigate,
} from "react-router-dom";

// TanStack Router `Link` compatibility:
export const Link = React.forwardRef<HTMLAnchorElement, any>((props, ref) => {
  const { to, search, params, ...rest } = props;
  let targetTo = to;
  if (typeof to === "string" && search) {
    const q = new URLSearchParams(search).toString();
    targetTo = q ? `${to}?${q}` : to;
  }
  return React.createElement(RRLink, { ...rest, to: targetTo, ref });
});
Link.displayName = "Link";

// TanStack Router `useNavigate` wrapper:
export function useNavigate() {
  const navigate = useRRNavigate();
  return (options: any) => {
    if (typeof options === "string") {
      return navigate(options);
    }
    if (options && typeof options === "object") {
      const { to, search, replace } = options;
      let target = to || "";
      if (search) {
        const q = new URLSearchParams(search).toString();
        target = q ? `${target}?${q}` : target;
      }
      return navigate(target, { replace: !!replace });
    }
    return navigate(options);
  };
}

// TanStack Router `useRouterState` wrapper:
export function useRouterState<T = any>(opts?: { select?: (state: any) => T }): T {
  const location = useRRLocation();
  const state = { location };
  if (opts && typeof opts.select === "function") {
    return opts.select(state);
  }
  return state as unknown as T;
}

// TanStack Router `useLocation` wrapper:
export function useLocation() {
  return useRRLocation();
}

// TanStack Router `useParams` wrapper:
export function useParams() {
  return useRRParams();
}

// TanStack Router `useSearch` wrapper:
export function useSearch(): Record<string, string> {
  const [searchParams] = useRRSearchParams();
  const result: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    result[key] = val;
  });
  return result;
}

// TanStack Router `redirect` wrapper:
export function redirect(options: { to: string }) {
  return options;
}

// TanStack Router `createFileRoute` adapter:
export function createFileRoute(_path: string) {
  return function (routeOptions: any) {
    let component = routeOptions?.component;
    if (!component && routeOptions?.beforeLoad) {
      component = () => {
        try {
          routeOptions.beforeLoad();
        } catch (redir: any) {
          if (redir?.to) {
            return React.createElement(Navigate, { to: redir.to, replace: true });
          }
        }
        return null;
      };
    }
    if (!component) component = () => null;

    return {
      options: routeOptions,
      component,
      useParams: () => useRRParams(),
      useSearch: () => {
        const [searchParams] = useRRSearchParams();
        const result: Record<string, any> = {};
        searchParams.forEach((val, key) => {
          result[key] = val;
        });
        return result;
      },
    };
  };
}

export { Outlet, Navigate };
