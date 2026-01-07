"use client";

/**
 * Monthly Spending Trends Page
 * Modern, accessible UI for visualizing spending patterns and insights
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  Stack,
  Autocomplete,
  TextField,
  Alert,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CategoryIcon from "@mui/icons-material/Category";
import TransactionIcon from "@mui/icons-material/Receipt";

import PageHeader from "../../../components/PageHeader";
import LoadingState from "../../../components/LoadingState";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import { currencyFormat } from "../../../components/Common";

import useSpendingTrends, {
  TrendsFilters,
} from "../../../hooks/useSpendingTrends";
import useAccountFetch from "../../../hooks/useAccountFetch";
import useCategoryFetch from "../../../hooks/useCategoryFetch";
import { useAuth } from "../../../components/AuthProvider";

const TrendsPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Local state for filters and UI
  const [filters, setFilters] = useState<TrendsFilters>({
    dateRange: { months: 12 },
    includeTransfers: false,
    includeRefunds: true,
    accountFilter: [],
    categoryFilter: [],
    excludeCategories: [],
  });
  const [stackedView, setStackedView] = useState(false);

  // Data fetching hooks
  const {
    data: trendsData,
    isLoading: isLoadingTrends,
    isError: isErrorTrends,
    error: errorTrends,
    refetch: refetchTrends,
  } = useSpendingTrends(filters);

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    error: errorAccounts,
  } = useAccountFetch();

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    error: errorCategories,
  } = useCategoryFetch();

  // Authentication redirect
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Handle filter changes
  const handleDateRangeChange = (months: number) => {
    setFilters((prev) => ({ ...prev, dateRange: { months } }));
  };

  const handleAccountFilterChange = (accounts: string[]) => {
    setFilters((prev) => ({ ...prev, accountFilter: accounts }));
  };

  const handleCategoryFilterChange = (categories: string[]) => {
    setFilters((prev) => ({ ...prev, categoryFilter: categories }));
  };

  const handleTransferToggle = (includeTransfers: boolean) => {
    setFilters((prev) => ({ ...prev, includeTransfers }));
  };

  // Check loading states
  const isLoading =
    loading || isLoadingTrends || isLoadingAccounts || isLoadingCategories;
  const isError = isErrorTrends || isErrorAccounts || isErrorCategories;
  const error = errorTrends || errorAccounts || errorCategories;

  // Format chart data
  const chartData =
    trendsData?.monthlySpending
      .map((month) => ({
        month: month.yearMonth,
        spending: month.totalSpend,
        transactions: month.transactionCount,
        ...month.categories,
      }))
      .reverse() || [];

  // Render loading state
  if (isLoading) {
    return (
      <>
        <LoadingState variant="card" message="Loading spending trends..." />
      </>
    );
  }

  // Render error state
  if (isError) {
    return (
      <>
        <PageHeader
          title="Monthly Spending Trends"
          subtitle="Analyze your spending patterns and track month-over-month changes."
        />
        <ErrorDisplay
          error={error}
          variant="card"
          title="Error Loading Spending Trends"
          showRetry={true}
          onRetry={refetchTrends}
        />
      </>
    );
  }

  // Render empty state
  if (!trendsData || trendsData.monthlySpending.length === 0) {
    return (
      <>
        <PageHeader
          title="Monthly Spending Trends"
          subtitle="Analyze your spending patterns and track month-over-month changes."
        />
        <EmptyState
          title="No Spending Data Found"
          message="Start by adding some transactions to see your spending trends."
          dataType="generic"
          variant="data"
        />
      </>
    );
  }

  const formatPercentageChange = (change: number | null) => {
    if (change === null) return "N/A";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return null;
    return change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getChangeClassName = (change: number | null) => {
    if (change === null) return "";
    return change >= 0 ? "positive-change" : "negative-change";
  };

  return (
    <>
      <PageHeader
        title="Monthly Spending Trends"
        subtitle="Analyze your spending patterns and track month-over-month changes."
      />

      {/* Filters Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange?.months || 12}
                  label="Date Range"
                  onChange={(e) =>
                    handleDateRangeChange(e.target.value as number)
                  }
                  inputProps={{
                    tabIndex: 0,
                    "aria-label": "Date Range",
                  }}
                >
                  <MenuItem value={6}>6 months</MenuItem>
                  <MenuItem value={12}>12 months</MenuItem>
                  <MenuItem value={24}>24 months</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                multiple
                options={accountsData?.map((a) => a.accountNameOwner) || []}
                value={filters.accountFilter || []}
                onChange={(_, newValue) => handleAccountFilterChange(newValue)}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Accounts"
                    placeholder="All accounts"
                    inputProps={{
                      ...params.inputProps,
                      "aria-label": "Accounts",
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                multiple
                options={categoriesData?.map((c) => c.categoryName) || []}
                value={filters.categoryFilter || []}
                onChange={(_, newValue) => handleCategoryFilterChange(newValue)}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categories"
                    placeholder="All categories"
                    inputProps={{
                      ...params.inputProps,
                      "aria-label": "Categories",
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!filters.includeTransfers}
                    onChange={(e) => handleTransferToggle(!e.target.checked)}
                    inputProps={{
                      tabIndex: 0,
                      "aria-label": "Exclude transfers",
                    }}
                  />
                }
                label="Exclude transfers"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Hero KPIs Section */}
      <Box role="region" aria-label="Key Performance Indicators" sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <TransactionIcon
                  sx={{ fontSize: 40, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h4" component="div">
                  {currencyFormat(trendsData.currentMonth?.totalSpend || 0)}
                </Typography>
                <Typography color="text.secondary">Total Spend</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <CategoryIcon
                  sx={{ fontSize: 40, color: "secondary.main", mb: 1 }}
                />
                <Typography variant="h4" component="div">
                  {trendsData.currentMonth?.transactionCount || 0}
                </Typography>
                <Typography color="text.secondary">Transactions</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <ShowChartIcon
                  sx={{ fontSize: 40, color: "info.main", mb: 1 }}
                />
                <Typography variant="h4" component="div">
                  {trendsData.topCategories[0]?.category || "None"}
                </Typography>
                <Typography color="text.secondary">Top Category</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                {getChangeIcon(
                  trendsData.monthOverMonth?.percentageChange || null,
                )}
                <Typography
                  variant="h4"
                  component="div"
                  className={getChangeClassName(
                    trendsData.monthOverMonth?.percentageChange || null,
                  )}
                  sx={{
                    color:
                      trendsData.monthOverMonth?.percentageChange &&
                      trendsData.monthOverMonth.percentageChange >= 0
                        ? "success.main"
                        : "error.main",
                  }}
                >
                  {formatPercentageChange(
                    trendsData.monthOverMonth?.percentageChange || null,
                  )}
                </Typography>
                <Typography color="text.secondary">vs Last Month</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" component="h2">
                  Monthly Spending Trend
                </Typography>
              </Box>
              <Box
                role="region"
                aria-label="Monthly spending chart"
                height={300}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={currencyFormat} />
                    <Tooltip
                      formatter={(value: number) => [
                        currencyFormat(value),
                        "Spending",
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="spending"
                      stroke="#1976d2"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" component="h2">
                  Spending by Category
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={stackedView}
                      onChange={(e) => setStackedView(e.target.checked)}
                      size="small"
                      inputProps={{
                        "aria-label": "Stacked view",
                      }}
                    />
                  }
                  label="Stacked view"
                />
              </Box>
              <Box
                role="region"
                aria-label="Category breakdown chart"
                height={300}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={currencyFormat} />
                    <Tooltip
                      formatter={(value: number) => [
                        currencyFormat(value),
                        "Amount",
                      ]}
                    />
                    <Legend />
                    {trendsData.topCategories.map((cat, index) => (
                      <Bar
                        key={cat.category}
                        dataKey={cat.category}
                        stackId={stackedView ? "category" : index}
                        fill={`hsl(${index * 60}, 70%, 50%)`}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Breakdown Section */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" mb={2}>
                Top Categories This Month
              </Typography>
              <Stack spacing={1}>
                {trendsData.topCategories.map((category) => (
                  <Box
                    key={category.category}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={1}
                    sx={{ bgcolor: "grey.50", borderRadius: 1 }}
                  >
                    <Typography variant="body1">{category.category}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {currencyFormat(category.amount)}
                      </Typography>
                      <Chip
                        label={`${category.percentage.toFixed(1)}%`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" mb={2}>
                Biggest Changes
              </Typography>
              <Stack spacing={1}>
                {trendsData.categoryChanges.slice(0, 5).map((change) => (
                  <Box
                    key={change.category}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={1}
                    sx={{ bgcolor: "grey.50", borderRadius: 1 }}
                  >
                    <Typography variant="body1">{change.category}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          color:
                            change.absoluteChange >= 0
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {change.absoluteChange >= 0 ? "+" : ""}
                        {currencyFormat(change.absoluteChange)}
                      </Typography>
                      <Chip
                        label={formatPercentageChange(change.percentageChange)}
                        size="small"
                        variant="outlined"
                        sx={{
                          color:
                            change.absoluteChange >= 0
                              ? "success.main"
                              : "error.main",
                          borderColor:
                            change.absoluteChange >= 0
                              ? "success.main"
                              : "error.main",
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default TrendsPage;
