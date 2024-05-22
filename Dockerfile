FROM node:alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first for better cache utilization
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application if necessary
# Uncomment the next line if your app needs a build step
RUN npm run build

# Expose the port your app runs on
# EXPOSE 3030

# Define the command to run your app
CMD ["npm", "run", "start"]
