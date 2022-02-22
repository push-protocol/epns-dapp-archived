import React from "react";
import styled from "styled-components";

import { toast } from "react-toastify";

function NotificationToast({ notification, clearToast }) {
  // toast customize
  const LoaderToast = () => (
    <Toaster>
      <div>{notification.notificationTitle}</div>
      <div>{notification.notificationBody}</div>
    </Toaster>
  );

  // Render
  return (
    <NotificationWrapper>
      {toast.dark(<LoaderToast onClick={clearToast} color="#35c5f3" />, {
        position: "bottom-right",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })}
    </NotificationWrapper>
  );
}

const NotificationWrapper = styled.div`
  display: none;
`;

const Toaster = styled.div`
  align-items: center;
  margin: 0px 10px;
`;

// Export Default
export default NotificationToast;
