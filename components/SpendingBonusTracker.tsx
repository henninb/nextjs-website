"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  alpha,
  useTheme,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import useAccountBonusProgress from "../hooks/useAccountBonusProgress";
import { currencyFormat } from "./Common";

type Props = {
  accountNameOwner: string;
  startDate: string;
  targetAmount: number;
  bonusAmount: number;
  windowDays?: number;
};

export default function SpendingBonusTracker({
  accountNameOwner,
  startDate,
  targetAmount,
  bonusAmount,
  windowDays = 90,
}: Props) {
  const theme = useTheme();
  const { data, isLoading, isError } = useAccountBonusProgress(
    accountNameOwner,
    startDate,
    targetAmount,
    bonusAmount,
    windowDays,
  );

  const clearedPct = Math.min(data?.percentComplete ?? 0, 100);
  const pendingPct =
    targetAmount > 0
      ? Math.min(
          ((data?.spentPending ?? 0) / targetAmount) * 100,
          100 - clearedPct,
        )
      : 0;

  const barColor = data?.bonusEarned
    ? theme.palette.success.main
    : clearedPct >= 75
      ? theme.palette.success.main
      : clearedPct >= 40
        ? theme.palette.primary.main
        : theme.palette.warning.main;

  const pendingColor = theme.palette.warning.main;

  if (isError) return null;

  return (
    <Card
      sx={{
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 12px 24px -4px rgba(0,0,0,0.4), 0 8px 16px -4px rgba(0,0,0,0.3)",
        },
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(barColor, 0.05)} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${barColor} 0%, ${theme.palette.background.paper} 100%)`,
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                color: barColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: alpha(barColor, 0.1),
                flexShrink: 0,
              }}
            >
              <CreditScoreIcon sx={{ fontSize: "1.25rem" }} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.7rem",
                }}
              >
                Spending Bonus
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                {currencyFormat(bonusAmount)} reward · ends{" "}
                {data?.windowEndDate
                  ? new Date(data.windowEndDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )
                  : "…"}
              </Typography>
            </Box>
          </Box>

          {data?.bonusEarned && (
            <Chip
              icon={<EmojiEventsIcon sx={{ fontSize: "0.9rem !important" }} />}
              label="Earned"
              size="small"
              sx={{
                backgroundColor: theme.palette.success.main,
                color: theme.palette.success.contrastText,
                fontWeight: 700,
                fontSize: "0.65rem",
                height: "20px",
                "& .MuiChip-icon": { color: theme.palette.success.contrastText },
              }}
            />
          )}
        </Box>

        {/* Progress bar + stats */}
        {isLoading ? (
          <>
            <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, mb: 1 }} />
            <Skeleton variant="text" width="60%" sx={{ fontSize: "0.75rem" }} />
          </>
        ) : (
          <>
            {/* Two-zone bar: cleared (solid) + pending (ghost) */}
            <Box
              sx={{
                position: "relative",
                height: 8,
                borderRadius: 4,
                mb: 1,
                backgroundColor: alpha(barColor, 0.15),
                overflow: "hidden",
              }}
            >
              {/* Ghost segment for pending spend */}
              {pendingPct > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: `${clearedPct}%`,
                    top: 0,
                    bottom: 0,
                    width: `${pendingPct}%`,
                    backgroundColor: alpha(pendingColor, 0.4),
                  }}
                />
              )}
              {/* Solid segment for cleared spend */}
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${clearedPct}%`,
                  borderRadius: "4px 0 0 4px",
                  backgroundColor: barColor,
                  transition: "width 0.6s ease",
                }}
              />
            </Box>

            {/* Amounts row */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: barColor, fontSize: "0.75rem" }}
                >
                  {currencyFormat(data?.spent ?? 0)}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 400 }}
                  >
                    {" "}/ {currencyFormat(targetAmount)}
                  </Typography>
                </Typography>
                {(data?.spentPending ?? 0) > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      fontSize: "0.65rem",
                      color: pendingColor,
                      fontWeight: 500,
                    }}
                  >
                    +{currencyFormat(data?.spentPending ?? 0)} pending
                  </Typography>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.7rem", textAlign: "right" }}
              >
                {data?.bonusEarned
                  ? "Goal reached!"
                  : `${currencyFormat(data?.remaining ?? 0)} left · ${data?.daysRemaining ?? 0}d remaining`}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
