import { headers } from 'next/headers';

export const runtime = 'experimental-edge';

export default async function HeadersPage() {
    // Await the headers if they come back as a promise.
    let headerEntries = []
    try {
    const reqHeaders = await headers();
    console.log('await headers()')
    const headerEntries: Array<[string, string]> = [];
  
    reqHeaders.forEach((value, key) => {
      headerEntries.push([key, value]);
    });
    } catch {
      console.log('failed to get headers.')
    }
  
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Request Headers</h1>
        <table border={1} cellPadding={8} cellSpacing={0}>
          <thead>
            <tr>
              <th>Header</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {headerEntries.map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
}
// import { GetServerSideProps, NextPage } from 'next';

// export const runtime = "experimental-edge";

// interface HeadersPageProps {
//   headers: Record<string, string | string[]>;
// }

// const HeadersPage: NextPage<HeadersPageProps> = ({ headers }) => {
//   return (
//     <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
//       <h1>Request Headers</h1>
//       <table border={1} cellPadding={8} cellSpacing={0}>
//         <thead>
//           <tr>
//             <th>Header</th>
//             <th>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Object.entries(headers).map(([key, value]) => (
//             <tr key={key}>
//               <td>{key}</td>
//               <td>{Array.isArray(value) ? value.join(', ') : value}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export const getServerSideProps: GetServerSideProps = async ({ req }) => {
//   try {
//     // Log all incoming headers to see what's coming through
//     console.log('Incoming request headers:', req.headers);
//     return {
//       props: {
//         headers: req.headers,
//       },
//     };
//   } catch (error) {
//     console.error('Error processing request headers:', error);
//     // Return a minimal fallback if there's an issue
//     return {
//       props: {
//         headers: {},
//       },
//     };
//   }
// };

// export default HeadersPage;