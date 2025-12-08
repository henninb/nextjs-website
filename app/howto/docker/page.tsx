import { Metadata } from "next";
import { Container, Typography, Box, Paper } from "@mui/material";

export const metadata: Metadata = {
  title: "Docker How-To - Basic Commands",
  description: "Essential Docker commands for container management, image building, and Docker Compose",
};

export default function DockerPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Basic Docker Commands
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            List Docker Containers
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
            <code>docker ps</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Lists all running containers.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            List All Docker Containers
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
            <code>docker ps -a</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Lists all containers, including those that are stopped.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Start a Docker Container
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
            <code>docker start &lt;container_name&gt;</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Starts a stopped container.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Stop a Docker Container
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
            <code>docker stop &lt;container_name&gt;</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Stops a running container.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Remove a Docker Container
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
            <code>docker rm &lt;container_name&gt;</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Removes a container. Use <code>-f</code> to force remove a running
            container.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Remove a Docker Image
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
            <code>docker rmi &lt;image_name&gt;</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Removes an image from the local storage.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Build a Docker Image
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
            <code>docker build -t &lt;image_name&gt; .</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Builds an image from the Dockerfile in the current directory.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Run a Docker Container
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
            <code>
              docker run -d --name &lt;container_name&gt; &lt;image_name&gt;
            </code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Runs a container from an image in detached mode.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            List Docker Images
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
            <code>docker images</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Lists all images stored locally.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            View Docker Logs
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
            <code>docker logs &lt;container_name&gt;</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Displays logs from a container.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Access a Running Container
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
            <code>docker exec -it &lt;container_name&gt; /bin/bash</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Opens an interactive terminal session in a running container.
          </Typography>
        </Paper>

        <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
          Docker Compose
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Docker Compose is a tool for defining and running multi-container
          Docker applications. Here are some basic commands:
        </Typography>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Start Services
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
            <code>docker-compose up</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Starts and runs all the services defined in a{" "}
            <code>docker-compose.yml</code> file.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Stop Services
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
            <code>docker-compose down</code>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Stops and removes all containers, networks, and volumes defined in a{" "}
            <code>docker-compose.yml</code> file.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
