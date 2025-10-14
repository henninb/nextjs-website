import React from "react";
import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

const TransactionCardSkeleton: React.FC = () => {
  return (
    <Card
      sx={{
        minHeight: "280px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: 3,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          "&:last-child": { pb: 3 },
        }}
      >
        {/* Header: Date Badge and Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Skeleton variant="rounded" width={100} height={24} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>

        {/* Description */}
        <Skeleton variant="text" width="85%" height={32} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />

        {/* Category */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={90} height={24} />
        </Box>

        {/* Amount */}
        <Skeleton variant="text" width={120} height={48} sx={{ mb: 2 }} />

        {/* State Badges */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
          <Skeleton variant="rounded" width={70} height={24} />
        </Stack>

        {/* Type and Reoccurring */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={75} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Stack>

        {/* Notes Section (at bottom) */}
        <Box sx={{ mt: "auto" }}>
          <Skeleton variant="text" width={50} height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="75%" height={20} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TransactionCardSkeleton;
