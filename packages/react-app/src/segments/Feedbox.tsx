import React from "react";
import { api, utils, NotificationItem } from "@epnsproject/frontend-sdk-staging";
import styled from 'styled-components';
import Loader from 'react-loader-spinner'
import { Waypoint } from "react-waypoint";

import {ALLOWED_CORE_NETWORK} from 'pages/Home'
import { useWeb3React } from '@web3-react/core'
import { addresses, abis } from "@project/contracts";
import { ethers } from "ethers";
import ChannelsDataStore from "singletons/ChannelsDataStore";

import NotificationToast from "components/NotificationToast";

// Create Header
function Feedbox() {
  const [epnsReadProvider, setEpnsReadProvider] = React.useState(null);
  const { account, library, chainId } = useWeb3React();

  const [notifications, setNotifications] = React.useState([]);
  // since we dont have how many notifications there are in total
  // we use this field to note when there are no more notifications to load
  const [finishedFetching, setFinishedFetching] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [toast, showToast] = React.useState(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  //define query
  const notificationsPerPage = 6;

  React.useEffect(() => {
    const signer = library.getSigner(account);
    // define the epns comms contracts
    const ethCommsContract = new ethers.Contract(addresses.epnsEthComm, abis.epnsComm, signer);
    const polygonCommsContract = new ethers.Contract(addresses.epnsPolyComm, abis.epnsComm, signer);
    const communicatorContract = chainId === ALLOWED_CORE_NETWORK ? ethCommsContract : polygonCommsContract;
    // define the epns comms contracts
    setEpnsReadProvider(communicatorContract);
  }, [chainId]);
  
  const loadNotifications = async (currentPage:any) => {
    setLoading(true);
    try{
      const {count, results} = await api.fetchNotifications(account, notificationsPerPage, currentPage);
      const parsedResponse = utils.parseApiResponse(results);
      setNotifications((oldNotifications) => ([
        ...oldNotifications,
        ...parsedResponse,
      ]));
      if(count === 0){
        setFinishedFetching(true);
      }
    }catch(err){
      console.log(err)
    } finally{
      setLoading(false);
    }
  }

  const clearToast = () => showToast(null);

  React.useEffect(() => {
    if (epnsReadProvider) {
      loadNotifications(currentPage);
      return subscribe()
    }
  }, [epnsReadProvider]);

  //clear toast variable after it is shown
  React.useEffect(() => {
    if (toast) {
      clearToast()
    }
  }, [toast]);

  //function to query more notifications
  const handlePagination = async() => {
    setCurrentPage((prevPage) => {
      const newPage = prevPage + 1;
      loadNotifications(newPage);
      return newPage;
    });
  };
  
  const subscribe = () => {
    if (account) {
      return newNotification(onReceive);
    }
  };

  //handle new notification
  const onReceive = async notification => {
    showToast(notification);
    setNotifications(existingNotifications => [notification, ...existingNotifications]);
    // setNotifications(notifications => [notification].concat(notifications));
  };

  //subscribe to SendNotification
  const newNotification = (fn) => {
    const event = 'SendNotification'

    //callback function for listener
    const cb = async (
      eventChannelAddress: string,
      eventUserAddress: string,
      identityHex: string
    ) => {
      const userAddress = account
      const identity = hex2ascii(identityHex)
      const notificationId = identity
        .concat('+')
        .concat(eventChannelAddress)
        .concat('+')
        .concat(eventUserAddress)
        .toLocaleLowerCase()
      const ipfsId = identity.split('+')[1];

      const channelJson = await ChannelsDataStore.instance.getChannelJsonAsync(eventChannelAddress);

      // Form Gateway URL
      const url = "https://ipfs.io/ipfs/" + ipfsId;
      fetch(url)
        .then(result => result.json())
        .then(result => {
      const ipfsNotification = {...result}
      const notification = {
        id: notificationId,
        userAddress: eventUserAddress,
        channelAddress: eventChannelAddress,
        indexTimeStamp: Date.now() / 1000, // todo
        notificationTitle: ipfsNotification.notification.title || channelJson.name,
        notificationBody: ipfsNotification.notification.body,
        // ...ipfsNotification.data,
      }
      if (ipfsNotification.data.type === '1') {
        const isSubscribed = 
        epnsReadProvider.memberExists(
          userAddress,
          eventChannelAddress
        )
        .then(isSubscribed => {
          if (isSubscribed) {
            fn(notification)
          }
        })
      } else if (userAddress === eventUserAddress) {
        fn(notification)
      }
      })
      .catch(err => {
        console.log("!!!Error, getting new notification data from ipfs --> %o", err);
      });
    }
    epnsReadProvider.on(event, cb)
    return epnsReadProvider.off.bind(epnsReadProvider, event, cb)
  }
  // transform the data gotten from the API into a workable format
  const parseAPINotifications = (oneAPINotification) => {
    // extract required data
    let {
      payload_id: payloadId,
      payload: {
        data: {
          amsg
        },
        notification: {
          body,
          title
        }
      }
    } = oneAPINotification;

    let timeStamp = "";
    // parse the text for the timestamp
    const matches = amsg.match(/\[timestamp:(.*?)\]/);
    if (matches) {
      timeStamp = matches[1];
      amsg = amsg.replace(/ *\[timestamp:[^)]*\] */g, "");
    }
    // save payload into object
    const parsedNotification = {
      id: payloadId,
      notificationBody: body,
      notificationTitle: title,
      indexTimeStamp: parseInt(timeStamp)
    };
    return parsedNotification
  };
  const showWayPoint = (index) => {
    return (Number(index) === notifications.length - 1) && !finishedFetching;
  }

  // Render
  return (
    <>
      <Container>
        {notifications &&
          <Items id="scrollstyle-secondary">
            {notifications.map((oneNotification, index) => {
              const { cta, title, message, app, icon, image} = oneNotification;

              // render the notification item
              return (
                <>
                  {showWayPoint(index) && (<Waypoint onEnter = { () => handlePagination()}/>)}
                  <NotificationItem
                    notificationTitle={title}
                    notificationBody={message}
                    cta={cta}
                    app={app}
                    icon={icon}
                    image={image}
                  />
                </>
              );
            })}
          </Items>
        }
        {(loading) && 
          <Loader
          type="Oval"
          color="#35c5f3"
          height={40}
          width={40}
        />
        }
      
        {
        toast && 
        <NotificationToast
          notification={toast}
          clearToast = {clearToast}
          />
        }
      </Container>
    </>
  );
}


const Items = styled.div`
  display: block;
  align-self: stretch;
  padding: 10px 20px;
  overflow-y: scroll;
  background: #fafafa;
`
// css styles
const Container = styled.div`
display: flex;
  flex: 1;
  flex-direction: column;

  font-weight: 200;
  align-content: center;
  align-items: center;
  justify-content: center;
  max-height: 100vh;

  // padding: 20px;
  // font-size: 16px;
  // display: flex;
  // font-weight: 200;
  // align-content: center;
  // align-items: center;
  // justify-content: center;
  // width: 100%;
  // min-height: 40vh;
`

const ContainerInfo = styled.div`
  padding: 20px;
`

// Export Default
export default Feedbox;
