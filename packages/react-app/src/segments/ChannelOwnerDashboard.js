import React from "react";

import styled, { css } from "styled-components";
import { Section, Content } from "components/SharedStyling";

import SendNotifications from "components/SendNotifications";
import ChannelSettings from "components/ChannelSettings";

// CREATE CHANNEL OWNER DASHBOARD
function ChannelOwnerDashboard({
  epnsReadProvider, epnsWriteProvider, epnsCommReadProvider, epnsCommWriteProvider 
}) {
  React.useEffect(() => {});
  const [key, setKey] = React.useState(50);

  // RRENDER
  return (
    <>
      <Section>
        <Content padding="0px">
          <ChannelSettings
            epnsReadProvider={epnsReadProvider}
            epnsCommReadProvider={epnsCommReadProvider}
            epnsWriteProvider={epnsWriteProvider}
            epnsCommWriteProvider={epnsCommWriteProvider}
            setKey={setKey}
          />
          <SendNotifications
            key={key}
            epnsReadProvider={epnsReadProvider}
            epnsCommReadProvider={epnsCommReadProvider}
            epnsWriteProvide={epnsWriteProvider}
            epnsCommWriteProvider={epnsCommWriteProvider}
          />
        </Content>
      </Section>
    </>
  );
}

// css styles

// Export Default
export default ChannelOwnerDashboard;
