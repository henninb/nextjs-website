import FinanceLayout from "../layouts/FinanceLayout";
import React from "react";

const Spinner = React.memo(function Spinner() {
  return (
    <div className="spinner-page">
      <FinanceLayout>
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
      </FinanceLayout>
    </div>
  );
});

export default Spinner;
