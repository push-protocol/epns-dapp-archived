import React from "react";
import styled from "styled-components";
import { useWeb3React } from "@web3-react/core";
import { useSelector, useDispatch } from "react-redux";
import { envConfig } from "@project/contracts";
import SpamBox from "segments/spam";
import { api, utils } from "@epnsproject/frontend-sdk-staging";
import {
  incrementPage,
  setFinishedFetching,
  updateTopNotifications,
} from "redux/slices/notificationSlice";

const NOTIFICATIONS_PER_PAGE = 10;
// Create Header
function Feedbox() {
  const dispatch = useDispatch();
  const { account } = useWeb3React();
  const { notifications, toggle } = useSelector(
    (state: any) => state.notifications
  );

  const [bgUpdateLoading, setBgUpdateLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [currentTab] = React.useState("inbox");

  const fetchLatestNotifications = async () => {
    if (loading || bgUpdateLoading) return;
    setBgUpdateLoading(true);
    setLoading(true);
    try {
      const { count, results } = await api.fetchNotifications(
        account,
        NOTIFICATIONS_PER_PAGE,
        1,
        envConfig.apiUrl
      );
      if (!notifications.length) {
        dispatch(incrementPage());
      }
      const parsedResponse = utils.parseApiResponse(results);
      // replace the first 20 notifications with these
      dispatch(
        updateTopNotifications({
          notifs: parsedResponse,
          pageSize: NOTIFICATIONS_PER_PAGE,
        })
      );
      if (count === 0) {
        dispatch(setFinishedFetching());
      }
    } catch (err) {
      console.log(err);
    } finally {
      setBgUpdateLoading(false);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (account && currentTab === "inbox") {
      fetchLatestNotifications();
    }
    // eslint-disable-next-line
  }, [account, currentTab]);

  React.useEffect(() => {
    fetchLatestNotifications();
    // eslint-disable-next-line
  }, [toggle]);

  // Render
  return (
    <FullWidth>
      <SpamBox currentTab={currentTab} />
    </FullWidth>
  );
}

const FullWidth = styled.div`
  width: 100%;
`;

// Export Default
export default Feedbox;
