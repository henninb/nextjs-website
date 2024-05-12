export default function Tools() {
  return (
      <div>
          <div className="container">
              <h2>Tools</h2>
              <a href="https://www.calculator.net" target="_blank" rel="noopener noreferrer">Calculator</a>
              <a href="https://ipinfo.io" target="_blank" rel="noopener noreferrer">IP Info</a>
              <a href="https://purifycss.online" target="_blank" rel="noopener noreferrer">PurifyCSS</a>
              <a href="https://www.ipvoid.com" target="_blank" rel="noopener noreferrer">IPVoid</a>
              <a href="https://mxtoolbox.com" target="_blank" rel="noopener noreferrer">MXToolbox</a>
              <a href="https://fast.com" target="_blank" rel="noopener noreferrer">Fast</a>
              <a href="https://pastebin.com" target="_blank" rel="noopener noreferrer">Pastebin</a>
              <a href="https://regexr.com" target="_blank" rel="noopener noreferrer">RegExr</a>
              <a href="https://jwt.io" target="_blank" rel="noopener noreferrer">JWT.io</a>
              <a href="https://www.timeanddate.com" target="_blank" rel="noopener noreferrer">Time and Date</a>
          </div>
          <style jsx>{`
              .container {
                  text-align: left;
                  background-color: #fff;
                  padding: 20px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h2 {
                  margin-bottom: 20px;
              }
              a {
                  display: block;
                  margin: 10px 0;
                  text-decoration: none;
                  color: #007BFF;
                  font-size: 18px;
              }
              a:hover {
                  text-decoration: underline;
              }
          `}</style>
      </div>
  );
}
