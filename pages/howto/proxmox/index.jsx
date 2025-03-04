import React from "react";
import Head from "next/head";

export default function Proxmox() {
  return (
    <div>
      <Head>
        <title>Proxmox Basics</title>
      </Head>

      <h2>Proxmox Basics</h2>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.commandTitle}>Update Proxmox Packages</h2>
          <p>
            Keep your Proxmox installation up-to-date with the latest package
            updates:
          </p>
          <code style={styles.code}>apt update && apt dist-upgrade</code>
        </section>

        <section style={styles.section}>
          <h2 style={styles.commandTitle}>Check Proxmox Version</h2>
          <p>Display the current version of Proxmox you are running:</p>
          <code style={styles.code}>pveversion</code>
        </section>

        <section style={styles.section}>
          <h2 style={styles.commandTitle}>Restart a VM</h2>
          <p>Restart a virtual machine with a specific VM ID:</p>
          <code style={styles.code}>qm restart [VMID]</code>
        </section>

        <section style={styles.section}>
          <h2 style={styles.commandTitle}>Start a VM</h2>
          <p>Start a virtual machine with a specific VM ID:</p>
          <code style={styles.code}>qm start [VMID]</code>
        </section>

        <section style={styles.section}>
          <h2 style={styles.commandTitle}>Stop a VM</h2>
          <p>Stop a virtual machine with a specific VM ID:</p>
          <code style={styles.code}>qm stop [VMID]</code>
        </section>

        <section style={styles.section}>
          <h2 style={styles.commandTitle}>List All VMs</h2>
          <p>Get a list of all virtual machines and their statuses:</p>
          <code style={styles.code}>qm list</code>
        </section>
      </main>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: "#0070f3",
    padding: "20px",
    textAlign: "center",
    color: "white",
  },
  title: {
    margin: "0",
    fontSize: "2.5rem",
  },
  subtitle: {
    margin: "10px 0",
    fontSize: "1.2rem",
  },
  main: {
    padding: "20px",
  },
  section: {
    marginBottom: "20px",
  },
  commandTitle: {
    fontSize: "1.5rem",
    marginBottom: "10px",
  },
  code: {
    display: "block",
    backgroundColor: "#f4f4f4",
    padding: "10px",
    borderRadius: "5px",
    fontFamily: "monospace",
  },
  backLink: {
    display: "block",
    marginTop: "20px",
    textDecoration: "none",
    color: "#0070f3",
  },
};
