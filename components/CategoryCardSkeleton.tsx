import React from "react";
import { Card, CardContent, Box, Skeleton } from "@mui/material";

export default function CategoryCardSkeleton() {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        {/* Header with Icon and Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Skeleton variant="rounded" width={48} height={48} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>

        {/* Category Name */}
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 2 }} />

        {/* Status and Usage Badges */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={70} height={24} />
        </Box>

        {/* Transaction Count */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>

        {/* Metadata */}
        <Box
          sx={{
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Skeleton variant="text" width="70%" height={16} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="70%" height={16} />
        </Box>
      </CardContent>
    </Card>
  );
}
