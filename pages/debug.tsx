import { GetServerSideProps, NextPage } from "next";

export const runtime = "experimental-edge";

interface HeadersPageProps {
  headers: Record<string, string | string[]>;
}

const HeadersPage: NextPage<HeadersPageProps> = ({ headers }) => {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Request Headers</h1>
      <table border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>Header</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(headers).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{Array.isArray(value) ? value.join(", ") : value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Log the headers for debugging purposes
  console.log("Incoming request headers:", req.headers);

  return {
    props: {
      headers: req.headers,
    },
  };
};

export default HeadersPage;
