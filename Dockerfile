FROM node:alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary files
COPY package*.json ./
COPY .next ./.next
COPY public ./public
COPY next.config.mjs ./

# Install only production dependencies
RUN npm install --only=production

# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "run", "start"]
