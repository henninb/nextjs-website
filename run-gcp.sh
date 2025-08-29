#!/bin/sh

# Log function for timestamped messages
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $*"
}

# Error function for timestamped error messages
log_error() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - ERROR: $*" >&2
}

# Function to check if SSH agent is running and accessible
check_ssh_agent() {
  ssh-add -l >/dev/null 2>&1
  ssh_add_exit_code=$?
  if [ $ssh_add_exit_code -ne 0 ]; then
    case $ssh_add_exit_code in
      1)
        log "SSH agent is running but has no identities loaded."
        return 0
        ;;
      2)
        log_error "SSH agent is not running or not accessible."
        log "Starting SSH agent..."
        ssh_agent_output=$(ssh-agent -s)
        if [ $? -eq 0 ]; then
          eval "$ssh_agent_output"
          export SSH_AUTH_SOCK SSH_AGENT_PID
          log "SSH agent started successfully (PID: $SSH_AGENT_PID, Socket: $SSH_AUTH_SOCK)."
          return 0
        else
          log_error "Failed to start SSH agent."
          return 1
        fi
        ;;
      *)
        log_error "Unknown error checking SSH agent status."
        return 1
        ;;
    esac
  fi
  log "SSH agent is running and accessible."
  return 0
}

# Function to add SSH key with error handling and retry
add_ssh_key() {
  local key_path="$1"
  local max_attempts=3
  local attempt=1

  if [ ! -f "$key_path" ]; then
    log_error "SSH key file not found: $key_path"
    return 1
  fi

  # Check if SSH agent is accessible
  if ! check_ssh_agent; then
    log_error "Cannot proceed without accessible SSH agent."
    return 1
  fi

  # Get the fingerprint of the key
  local key_fingerprint
  key_fingerprint=$(ssh-keygen -lf "$key_path" 2>/dev/null | awk '{print $2}') || {
    log_error "Failed to get fingerprint for SSH key: $key_path"
    return 1
  }

  # Check if key is already loaded
  if ssh-add -l 2>/dev/null | grep -q "$key_fingerprint"; then
    log "SSH key already loaded in agent."
    return 0
  fi

  # Attempt to add the key with retry logic
  while [ $attempt -le $max_attempts ]; do
    log "Adding SSH key (attempt $attempt/$max_attempts)..."

    # Capture ssh-add output to provide better error context
    ssh_add_output=$(ssh-add "$key_path" 2>&1)
    ssh_add_exit_code=$?

    if [ $ssh_add_exit_code -eq 0 ]; then
      log "SSH key added successfully."
      return 0
    else
      log_error "Failed to add SSH key (attempt $attempt/$max_attempts)."

      if [ $attempt -eq $max_attempts ]; then
        log_error "Failed to add SSH key after $max_attempts attempts."
        log_error "SSH key addition failed with output: $ssh_add_output"
        return 1
      fi
      attempt=$((attempt + 1))
      sleep 2
    fi
  done
}

# Function to test SSH connection with detailed error handling
test_ssh_connection() {
  local host="$1"
  local timeout=10
  local ssh_output
  local ssh_exit_code

  log "Testing SSH connection to $host..."

  # Test SSH connection with authentication
  ssh_output=$(ssh -o ConnectTimeout=$timeout -o StrictHostKeyChecking=no -o BatchMode=yes "$host" 'echo "SSH connection test successful"' 2>&1)
  ssh_exit_code=$?

  if [ $ssh_exit_code -eq 0 ]; then
    log "SSH connection to $host successful (key-based authentication)."
    return 0
  fi

  # If key-based authentication failed, analyze the specific failure
  case $ssh_exit_code in
    255)
      if echo "$ssh_output" | grep -q "Permission denied"; then
        log_error "SSH authentication to $host failed (Permission denied)."
        log_error "Please check:"
        log_error "  1. SSH key is added to ssh-agent (run: ssh-add -l)"
        log_error "  2. Public key is added to ~/.ssh/authorized_keys on $host"
        log_error "  3. SSH key has correct permissions (private key should be 600)"
        return 1
      elif echo "$ssh_output" | grep -q "Connection refused"; then
        log_error "SSH connection to $host refused (Connection refused)."
        log_error "Please check SSH service is running on $host"
        return 1
      elif echo "$ssh_output" | grep -q "No route to host"; then
        log_error "No route to host $host (network routing issue)."
        return 1
      elif echo "$ssh_output" | grep -q "Connection timed out"; then
        log_error "SSH connection to $host timed out."
        return 1
      else
        log_error "SSH connection to $host failed with output: $ssh_output"
        return 1
      fi
      ;;
    *)
      log_error "SSH connection to $host failed with unexpected exit code $ssh_exit_code."
      log_error "SSH output: $ssh_output"
      return 1
      ;;
  esac
}

log "Starting GCP deployment..."

# Add SSH key with robust error handling
KEY_PATH="$HOME/.ssh/id_rsa_gcp"
if [ -f "$KEY_PATH" ]; then
  log "SSH key found at $KEY_PATH, attempting to add..."
  if ! add_ssh_key "$KEY_PATH"; then
    log_error "Failed to add SSH key for GCP deployment."
    log_error "Deployment cannot continue without SSH access."
    exit 1
  fi
else
  log_error "SSH key not found at $KEY_PATH"
  log_error "Please ensure the SSH key exists and has correct permissions."
  exit 1
fi

# Exit if the token file does not exist or is empty
if [ ! -s token ]; then
    log_error "Cloudflare tunnel Token file is missing or empty."
    exit 1
fi

log "Cloudflare tunnel token exists"

CLOUDFLARE_TOKEN=$(cat token)
# Test SSH connection to GCP host first
GCP_HOST="brianhenning@34.170.214.18"
if ! test_ssh_connection "$GCP_HOST"; then
  log_error "Cannot establish SSH connection to GCP host ($GCP_HOST)."
  log_error "Deployment cannot continue without SSH access to the remote host."
  exit 1
fi

# Set Docker host to use SSH
export DOCKER_HOST="ssh://$GCP_HOST"
log "Set DOCKER_HOST to: $DOCKER_HOST"

# Test Docker connectivity over SSH
log "Testing Docker connectivity over SSH..."
if ! docker version >/dev/null 2>&1; then
  log_error "Failed to connect to Docker daemon via SSH."
  log_error "Please check:"
  log_error "  1. Docker is installed and running on the remote host"
  log_error "  2. Your user has permission to access Docker on the remote host"
  log_error "  3. SSH connection allows Docker socket access"
  exit 1
fi
log "Docker connectivity over SSH verified."

# Install dependencies and build before pruning devDependencies.
log "Installing dependencies..."
if ! npm install; then
  log_error "npm install failed"
  exit 1
fi

log "Building application..."
if ! npm run build; then
  log_error "npm run build failed"
  exit 1
fi

log "Pruning dev dependencies..."
if ! npm prune --production; then
  log_error "npm prune failed"
  exit 1
fi

# Clean up Docker system
log "Cleaning up Docker system..."
docker system prune -af

# Build the React app image
log "Building React app Docker image..."
if ! docker build -t react-app .; then
  log_error "Failed to build React app Docker image"
  exit 1
fi

# Remove existing react-app container if it exists
log "Removing existing react-app container..."
docker rm -f react-app 2>/dev/null || true

# Run the React app container
log "Starting React app container..."
if ! docker run --name=react-app -h react-app --restart unless-stopped -p 3001:3000 -d react-app; then
  log_error "Failed to start React app container"
  exit 1
fi

# Remove existing cloudflared container if it exists
log "Removing existing cloudflared container..."
docker rm -f cloudflared 2>/dev/null || true

# Run the cloudflared tunnel
log "Starting cloudflared tunnel..."
if ! docker run -d --name cloudflared --restart=unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ${CLOUDFLARE_TOKEN}; then
  log_error "Failed to start cloudflared tunnel"
  exit 1
fi

# Final cleanup
log "Final Docker cleanup..."
docker system prune -af

log "Listing running containers..."
docker ps -a
# Display helpful information
log "Deployment completed successfully!"
log ""
log "Useful commands:"
log "  Create firewall rule: gcloud compute firewall-rules create allow-react-app-rule --allow tcp:3001"
log "  SSH to instance: gcloud compute ssh --zone 'us-central1-b' 'www-bhenning-com' --project 'sa-brian-henning'"
log ""
log "ssh gcp 'docker logs react-app -f'"
log "Testing application accessibility..."
if curl -f 'http://34.170.214.18:3001/' >/dev/null 2>&1; then
  log "Application is accessible at http://34.170.214.18:3001/"
else
  log_error "Application may not be accessible yet. This could be normal if containers are still starting."
  log "Check container status with: docker ps"
  log "Check logs with: docker logs react-app"
fi

log "GCP deployment process completed."
exit 0
