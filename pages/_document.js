import Document, {Head, Html, Main, NextScript} from 'next/document';
// import '../styles/index.css';

class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        return {...initialProps};
    }


    render() {
        return (
            <Html>
                <Head>
                  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"/>
                  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
                  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
                  <script src="//client.px-cloud.net/PXjJ0cYtn9/main.min.js" async></script>
                  <script src="https://henninb.github.io/human-challenge/human-challenge.js"></script>
                  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossOrigin="anonymous"></script>
                </Head>
                <body>
                <Main/>
                <NextScript/>
                </body>
            </Html>
        );
    }
}

export default MyDocument;
