import React from "react";
import { Card, CardContent, Box, Skeleton, useTheme } from "@mui/material";

export default function AccountCardSkeleton() {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent
        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Header: Type Icon + Actions Menu */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton
              variant="rectangular"
              width={40}
              height={40}
              sx={{ borderRadius: "10px" }}
            />
            <Skeleton
              variant="rectangular"
              width={60}
              height={24}
              sx={{ borderRadius: "6px" }}
            />
          </Box>
          <Skeleton variant="circular" width={32} height={32} />
        </Box>

        {/* Account Name */}
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />

        {/* Moniker + Status */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Skeleton
            variant="rectangular"
            width={70}
            height={24}
            sx={{ borderRadius: "6px" }}
          />
          <Skeleton
            variant="rectangular"
            width={60}
            height={24}
            sx={{ borderRadius: "6px" }}
          />
        </Box>

        {/* Financial Metrics */}
        <Box sx={{ flex: 1, mb: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Skeleton
                variant="text"
                width="100%"
                height={16}
                sx={{ mb: 0.5 }}
              />
              <Skeleton variant="text" width="100%" height={20} />
            </Box>
            <Box>
              <Skeleton
                variant="text"
                width="100%"
                height={16}
                sx={{ mb: 0.5 }}
              />
              <Skeleton variant="text" width="100%" height={20} />
            </Box>
            <Box>
              <Skeleton
                variant="text"
                width="100%"
                height={16}
                sx={{ mb: 0.5 }}
              />
              <Skeleton variant="text" width="100%" height={20} />
            </Box>
          </Box>
        </Box>

        {/* Footer: Validation Date */}
        <Box
          sx={{
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Skeleton variant="text" width="60%" height={14} />
        </Box>
      </CardContent>
    </Card>
  );
}
