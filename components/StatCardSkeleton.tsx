import React from "react";
import { Card, CardContent, Box, Skeleton, useTheme } from "@mui/material";

export default function StatCardSkeleton() {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        {/* Icon skeleton */}
        <Skeleton
          variant="rectangular"
          width={56}
          height={56}
          sx={{
            mb: 2,
            borderRadius: "12px",
          }}
        />

        {/* Label skeleton */}
        <Skeleton
          variant="text"
          width={80}
          height={20}
          sx={{
            mb: 1,
          }}
        />

        {/* Value skeleton */}
        <Skeleton variant="text" width={120} height={40} />
      </CardContent>
    </Card>
  );
}
