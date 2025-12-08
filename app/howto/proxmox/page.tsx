import { Metadata } from "next";
import { Container, Typography, Box, Paper } from "@mui/material";

export const metadata: Metadata = {
  title: "Proxmox Basics - How-To Guide",
  description: "Essential Proxmox commands for VM management and system administration",
};

export default function ProxmoxPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Proxmox Basics
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Update Proxmox Packages
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Keep your Proxmox installation up-to-date with the latest package
            updates:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "common.white",
              p: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}
          >
            <code>apt update && apt dist-upgrade</code>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Check Proxmox Version
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Display the current version of Proxmox you are running:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "common.white",
              p: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}
          >
            <code>pveversion</code>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Restart a VM
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Restart a virtual machine with a specific VM ID:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "common.white",
              p: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}
          >
            <code>qm restart [VMID]</code>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Start a VM
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start a virtual machine with a specific VM ID:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "common.white",
              p: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}
          >
            <code>qm start [VMID]</code>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Stop a VM
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Stop a virtual machine with a specific VM ID:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "common.white",
              p: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}
          >
            <code>qm stop [VMID]</code>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            List All VMs
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Get a list of all virtual machines and their statuses:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "common.white",
              p: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}
          >
            <code>qm list</code>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
