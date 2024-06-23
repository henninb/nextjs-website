import Head from "next/head";

export default function Docker() {
  return (
    <div>
      <Head>
        <title>Docker Howto</title>
      </Head>

      <h2>Basic Docker Commands</h2>

      <h3>List Docker Containers</h3>
      <pre>
        <code>docker ps</code>
      </pre>
      <p>Lists all running containers.</p>

      <h3>List All Docker Containers</h3>
      <pre>
        <code>docker ps -a</code>
      </pre>
      <p>Lists all containers, including those that are stopped.</p>

      <h3>Start a Docker Container</h3>
      <pre>
        <code>docker start &lt;container_name&gt;</code>
      </pre>
      <p>Starts a stopped container.</p>

      <h3>Stop a Docker Container</h3>
      <pre>
        <code>docker stop &lt;container_name&gt;</code>
      </pre>
      <p>Stops a running container.</p>

      <h3>Remove a Docker Container</h3>
      <pre>
        <code>docker rm &lt;container_name&gt;</code>
      </pre>
      <p>
        Removes a container. Use <code>-f</code> to force remove a running
        container.
      </p>

      <h3>Remove a Docker Image</h3>
      <pre>
        <code>docker rmi &lt;image_name&gt;</code>
      </pre>
      <p>Removes an image from the local storage.</p>

      <h3>Build a Docker Image</h3>
      <pre>
        <code>docker build -t &lt;image_name&gt; .</code>
      </pre>
      <p>Builds an image from the Dockerfile in the current directory.</p>

      <h3>Run a Docker Container</h3>
      <pre>
        <code>
          docker run -d --name &lt;container_name&gt; &lt;image_name&gt;
        </code>
      </pre>
      <p>Runs a container from an image in detached mode.</p>

      <h3>List Docker Images</h3>
      <pre>
        <code>docker images</code>
      </pre>
      <p>Lists all images stored locally.</p>

      <h3>View Docker Logs</h3>
      <pre>
        <code>docker logs &lt;container_name&gt;</code>
      </pre>
      <p>Displays logs from a container.</p>

      <h3>Access a Running Container</h3>
      <pre>
        <code>docker exec -it &lt;container_name&gt; /bin/bash</code>
      </pre>
      <p>Opens an interactive terminal session in a running container.</p>

      <h3>Docker Compose</h3>
      <p>
        Docker Compose is a tool for defining and running multi-container Docker
        applications. Here are some basic commands:
      </p>

      <h4>Start Services</h4>
      <pre>
        <code>docker-compose up</code>
      </pre>
      <p>
        Starts and runs all the services defined in a{" "}
        <code>docker-compose.yml</code> file.
      </p>

      <h4>Stop Services</h4>
      <pre>
        <code>docker-compose down</code>
      </pre>
      <p>
        Stops and removes all containers, networks, and volumes defined in a{" "}
        <code>docker-compose.yml</code> file.
      </p>
    </div>
  );
}
