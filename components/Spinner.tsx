export default function Spinner() {
  return (
    <div className="spinner-page">
      <div data-testid="loader">
        {/*<Loader type="Rings" color="#9965f4" />*/}

        <div className="lds-roller">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
