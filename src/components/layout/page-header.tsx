import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PageHeader = {
  /** Page or project name shown in the top bar. */
  title?: string;
  /** Optional count aligned to the right of the top bar. */
  count?: number;
  /** Show a back arrow that goes to the previous screen. */
  back?: boolean;
  /** Extra controls (menus) rendered at the far right. */
  actions?: ReactNode;
};

type Ctx = {
  header: PageHeader;
  setHeader: (next: PageHeader) => void;
};

const PageHeaderContext = createContext<Ctx>({ header: {}, setHeader: () => {} });

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeader>({});
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function useHeaderState() {
  return useContext(PageHeaderContext);
}

/** Register the current page's title, count and actions in the app top bar. */
// eslint-disable-next-line react-hooks/exhaustive-deps
export function usePageHeader(header: PageHeader, deps: unknown[] = []) {
  const { setHeader } = useHeaderState();
  useEffect(() => {
    setHeader(header);
    return () => setHeader({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
