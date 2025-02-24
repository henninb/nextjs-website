import { FinanceThemeProvider } from "../components/FinanceThemeProvider";

const FinanceLayout = ({ children }: { children: React.ReactNode }) => {
  return <FinanceThemeProvider>{children}</FinanceThemeProvider>;
};

export default FinanceLayout;
