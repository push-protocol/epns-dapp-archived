import React from "react";

import { AiFillInfoCircle } from "react-icons/ai";
import { Tooltip } from "@material-ui/core";

// Faucet URLs
function InfoTooltip({ title }) {
  // render
  return (
    <Tooltip style={{ marginLeft: "5px" }} title={title}>
      <span>
        <AiFillInfoCircle style={{ color: "white" }} />
      </span>
    </Tooltip>
  );
}

// Export Default
export default InfoTooltip;
