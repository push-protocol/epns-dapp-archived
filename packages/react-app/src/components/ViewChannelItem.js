import React from "react";
import styled, { css } from 'styled-components';
import { Device } from 'assets/Device';
import { recoverTypedSignature_v4 as recoverTypedSignatureV4 } from "eth-sig-util"

import { ToastContainer, toast as toaster  } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import Loader from 'react-loader-spinner';
import Skeleton from '@yisheng90/react-loading';
import { IoMdPeople } from 'react-icons/io';
import { GiTwoCoins } from 'react-icons/gi';
import { GoVerified } from 'react-icons/go';
 
import { useWeb3React } from '@web3-react/core';
//import { keccak256, arrayify, hashMessage, recoverPublicKey } from 'ethers/utils';
import NotificationToast from "components/NotificationToast";

import EPNSCoreHelper from 'helpers/EPNSCoreHelper';
import ChannelsDataStore from "singletons/ChannelsDataStore";
import { ALLOWED_CORE_NETWORK } from 'pages/Home';
import { postReq } from "api";
// const VERIFYING_CONTRACT = "0xc882da9660d29c084345083922f8a9292e58787d";
const UNVERIFIED_ADDRESS = "0x0000000000000000000000000000000000000000";

// Create Header
function ViewChannelItem({ channelObject, isOwner, epnsReadProvider, epnsCommWriteProvider, epnsWriteProvide, epnsCommReadProvider }) {
  const { account, library, chainId } = useWeb3React();
  const EPNS_DOMAIN = {
    name: 'EPNS',
    version: '1.0.0',
    chainId: chainId,
    verifyingContract: epnsCommReadProvider.address ,
  }

  const [ channelJson, setChannelJson ] = React.useState({});
  const [ subscribed, setSubscribed ] = React.useState(true);
  const [ loading, setLoading ] = React.useState(true);
  const [ memberCount, setMemberCount ] = React.useState(0);
  const [ isPushAdmin, setIsPushAdmin ] = React.useState(false);
  const [ isVerified, setIsVerified ] = React.useState(false);
  const [ isBlocked, setIsBlocked] = React.useState(false)
  const [ vLoading, setvLoading ] = React.useState(false);
  const [ bLoading, setBLoading ] = React.useState(false);
  const [ txInProgress, setTxInProgress ] = React.useState(false);
  // toast related section
  const onCoreNetwork = ALLOWED_CORE_NETWORK === chainId;
  const [toast, showToast] = React.useState(null);
  const clearToast = () => showToast(null);
  const showNetworkToast = () => {
    showToast({
      notificationTitle: <span style={{color: "#e20880"}}> Invalid Network </span>,
      notificationBody: "Please connect to the Kovan network to opt-in/opt-out of channels"
    });
  }
  //clear toast variable after it is shown
  React.useEffect(() => {
    if (toast) {
      clearToast()
    }
  }, [toast]);
  // toast related section


  React.useEffect(() => {
    fetchChannelJson();
    setIsBlocked(
      channelObject.channelState === 3 || //dont display channel if blocked
      channelObject.channelState === 2 //dont display channel if deactivated
    );
  }, [account, channelObject]);

  // to fetch channels
  const fetchChannelJson = async () => {
    const channelJson = await ChannelsDataStore.instance.getChannelJsonAsync(channelObject.addr);
    const subs = await EPNSCoreHelper.getSubscribedStatus(account, channelObject.addr, epnsCommReadProvider);
    const channelSubscribers = await ChannelsDataStore.instance.getChannelSubscribers(channelObject.addr);
    const subscribed = channelSubscribers.find(sub => {
      return sub.toLowerCase() === account.toLowerCase();
    });
    // check if is push admin
    const channelAdmin = await epnsWriteProvide.pushChannelAdmin();
    setIsPushAdmin(channelAdmin === account);
    setMemberCount(channelSubscribers.length);
    setSubscribed(subscribed);
    const channelVerifiedStatus = await epnsWriteProvide.getChannelVerfication( channelObject.addr);
    setIsVerified(Boolean(channelVerifiedStatus));
    setChannelJson(channelJson);

    setLoading(false);
  }

    // toast customize
    const LoaderToast = ({ msg, color }) => (
      <Toaster>
        <Loader
         type="Oval"
         color={color}
         height={30}
         width={30}
        />
        <ToasterMsg>{msg}</ToasterMsg>
      </Toaster>
    )
  
  // to subscribe
  const subscribe = async () => {
    if(!onCoreNetwork){
      return showNetworkToast();
    } else {
      subscribeAction(false);
    }
  }

  // Toastify
  let notificationToast = () => toaster.dark(<LoaderToast msg="Preparing Notification" color="#fff"/>, {
    position: "bottom-right",
    autoClose: false,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

  const verifyChannel = () => {
    setvLoading(true);
    // post op
    epnsWriteProvide.verifyChannel(channelObject.addr)
    .then(async (tx) => {
      console.log(tx);
      console.log ("Transaction Sent!");

      toaster.update(notificationToast(), {
        render: "Transaction sending",
        type: toaster.TYPE.INFO,
        autoClose: 5000
      });

      await tx.wait(1);
      console.log ("Transaction Mined!");
      setIsVerified(true);
    })
    .catch((err) => {
      console.log("!!!Error verifyChannel() --> %o", err);
      toaster.update(notificationToast(), {
        render: "Transacion Failed: " + err.error.message,
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
    })
    .finally(() => {
      setvLoading(false);
    })
  }

  const unverifyChannel = () => {
    setvLoading(true);
    epnsWriteProvide.unverifyChannel(channelObject.addr)
    .then(async (tx) => {
      console.log(tx);
      console.log ("Transaction Sent!");

      toaster.update(notificationToast(), {
        render: "Transaction Sending",
        type: toaster.TYPE.INFO,
        autoClose: 5000
      });

      await tx.wait(1);
      console.log ("Transaction Mined!");
      setIsVerified(false);
    })
    .catch((err) => {
      console.log("!!!Error handleSendMessage() --> %o", err);
      toaster.update(notificationToast(), {
        render: "Transacion Failed: " + err.error.message,
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
    })
    setvLoading(false);
  }
  const blockChannel = () => {
    setBLoading(true);
    epnsWriteProvide.blockChannel(channelObject.addr)
    .then(async (tx) => {
      console.log(tx);
      console.log ("Transaction Sent!");

      toaster.update(notificationToast(), {
        render: "Transaction Sent",
        type: toaster.TYPE.INFO,
        autoClose: 5000
      });

      await tx.wait(1);
      console.log ("Transaction Mined!");
    })
    .catch((err) => {
      console.log("!!!Error handleSendMessage() --> %o", err);
      toaster.update(notificationToast(), {
        render: "Transacion Failed: " + err.error.message,
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
    })
    .finally(()=>{
      // post op
      setBLoading(false);
      setIsBlocked(true);
    })
  }

  const subscribeAction = async () => {
    setTxInProgress(true);
    const type = {
      Subscribe: [
        { name: "channel", type: "address" },
        { name: "subscriber", type: "address" },
        { name: "action", type: "string" }
      ],
    };
    const message = {
        channel: channelObject.addr,
        subscriber: account,
        action: "Subscribe"
    }

    const signature = await library.getSigner(account)._signTypedData(
      EPNS_DOMAIN,
      type,
      message
    );

    let txToast = toaster.dark(<LoaderToast msg="Waiting for Confirmation..." color="#35c5f3"/>, {
      position: "bottom-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    postReq('/channels/subscribe_offchain', {
      signature,
      message,
      op: "write",
      chainId,
      contractAddress: epnsCommReadProvider.address 
    }).then((res) => {
      setSubscribed(true);
      setMemberCount(memberCount + 1);
      toaster.update(txToast, {
        render: "Sucesfully opted into channel !",
        type: toaster.TYPE.SUCCESS,
        autoClose: 5000
      });
      console.log(res);
    }).catch(err => {
      toaster.update(txToast, {
        render: "There was an error opting into channel (" + err.message + ")",
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
      console.log(err);
    }).finally(() => {
      setTxInProgress(false);
    })
  }

  const unsubscribeAction = async () => {
    if(!onCoreNetwork){
      return showNetworkToast();
    }
    const type = {
      Unsubscribe: [
        { name: "channel", type: "address" },
        { name: "unsubscriber", type: "address" },
        { name: "action", type: "string" }
      ],
    };
    const message = {
      channel: channelObject.addr,
      unsubscriber: account,
      action: "Unsubscribe"
    }
    const signature = await library.getSigner(account)._signTypedData(
      EPNS_DOMAIN,
      type,
      message
    );

    let txToast = toaster.dark(<LoaderToast msg="Waiting for Confirmation..." color="#35c5f3"/>, {
      position: "bottom-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    postReq('/channels/unsubscribe_offchain', {
      signature,
      message,
      op: "write",
      chainId,
      contractAddress: epnsCommReadProvider.address 
    }).then((res) => {
      setSubscribed(false);
      setMemberCount(memberCount + 1);
      toaster.update(txToast, {
        render: "Sucesfully opted out of channel !",
        type: toaster.TYPE.SUCCESS,
        autoClose: 5000
      });
      console.log(res);
    }).catch(err => {
      toaster.update(txToast, {
        render: "There was an error opting into channel (" + err.message + ")",
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
      console.log(err);
    }).finally(() => {
      setTxInProgress(false);
    })
  }

  if(isBlocked) return <></>


  // render
  return (
    <Container key={channelObject.addr}>
      <ChannelLogo>
        <ChannelLogoOuter>
          <ChannelLogoInner>
          {loading &&
            <Skeleton color="#eee" width="100%" height="100%" />
          }
          {!loading &&
            <ChannelLogoImg src={`${channelJson.icon}`} />
          }
          </ChannelLogoInner>
        </ChannelLogoOuter>
      </ChannelLogo>

      <ChannelInfo>
        <ChannelTitle>
          {loading &&
            <Skeleton color="#eee" width="50%" height={24} />
          }
          {!loading &&
            <ChannelTitleLink href={channelJson.url} target="_blank" rel="nofollow">{channelJson.name}</ChannelTitleLink>
          }
        </ChannelTitle>

        <ChannelDesc>
          {loading &&
            <>
              <SkeletonWrapper atH={5} atW={100}>
                <Skeleton color="#eee" width="100%" height={5} />
              </SkeletonWrapper>

              <SkeletonWrapper atH={5} atW={100}>
                <Skeleton color="#eee" width="100%" height={5} />
              </SkeletonWrapper>

              <SkeletonWrapper atH={5} atW={100}>
                <Skeleton color="#eee" width="40%" height={5} />
              </SkeletonWrapper>
            </>
          }
          {!loading &&
            <ChannelDescLabel>{channelJson.info}</ChannelDescLabel>
          }
        </ChannelDesc>

        <ChannelMeta>
          {loading &&
            <>
              <SkeletonWrapper atH={10} atW={30} marginBottom="0">
                <Skeleton />
              </SkeletonWrapper>
            </>
          }
          {!loading &&
            <>
              <Subscribers>
                <IoMdPeople size={20} color="#ccc"/>
                <SubscribersCount>
                  {memberCount}
                </SubscribersCount>
              </Subscribers>
              <Pool>
                <GiTwoCoins size={20} color="#ccc"/>
                <PoolShare>
                  {EPNSCoreHelper.formatBigNumberToMetric(channelObject.poolContribution, true) + " DAI"}
                </PoolShare>
              </Pool>
              {
                isVerified && (
                  <Subscribers>
                    <GoVerified size={18} color="#35c4f3"/>
                    {/* <SubscribersCount>
                      verified
                    </SubscribersCount> */}
                  </Subscribers>
                )
              }
            </>
          }
        </ChannelMeta>
      </ChannelInfo>
      {!!account && !!library &&
        <>
          <LineBreak />
          <ChannelActions>
            {loading &&
              <SkeletonButton>
                <Skeleton />
              </SkeletonButton>
            }
            {!loading && isPushAdmin && (
              <SubscribeButton onClick={blockChannel} disabled={bLoading}>
                {bLoading &&
                  <ActionLoader>
                    <Loader
                     type="Oval"
                     color="#FFF"
                     height={16}
                     width={16}
                    />
                  </ActionLoader>
                }
                <ActionTitle hideit={bLoading}>Block channel</ActionTitle>
              </SubscribeButton>
            )
            }
            {!loading && isPushAdmin && !isVerified && (
              <SubscribeButton onClick={verifyChannel} disabled={vLoading}>
                {vLoading &&
                  <ActionLoader>
                    <Loader
                     type="Oval"
                     color="#FFF"
                     height={16}
                     width={16}
                    />
                  </ActionLoader>
                }
                <ActionTitle hideit={vLoading}>Verify Channel</ActionTitle>
              </SubscribeButton>
            )}
            {!loading && isPushAdmin && isVerified && (
              <UnsubscribeButton onClick={unverifyChannel} disabled={vLoading}>
              {vLoading &&
                <ActionLoader>
                  <Loader
                   type="Oval"
                   color="#FFF"
                   height={16}
                   width={16}
                  />
                </ActionLoader>
              }
              <ActionTitle hideit={vLoading}>Unverify Channel</ActionTitle>
            </UnsubscribeButton>
            ) }
            {!loading && !subscribed &&
              <SubscribeButton onClick={subscribe} disabled={txInProgress}>
                {txInProgress &&
                  <ActionLoader>
                    <Loader
                     type="Oval"
                     color="#FFF"
                     height={16}
                     width={16}
                    />
                  </ActionLoader>
                }
                <ActionTitle hideit={txInProgress}>Opt-In</ActionTitle>
              </SubscribeButton>
            }
            {!loading && subscribed &&
              <>
              {isOwner &&
                <OwnerButton disabled>Owner</OwnerButton>
              }
              {!isOwner &&
                <UnsubscribeButton onClick={unsubscribeAction} disabled={txInProgress}>
                  {txInProgress &&
                    <ActionLoader>
                      <Loader
                       type="Oval"
                       color="#FFF"
                       height={16}
                       width={16}
                      />
                    </ActionLoader>
                  }
                  <ActionTitle hideit={txInProgress}>Opt-Out</ActionTitle>
                </UnsubscribeButton>
              }
              </>
            }
          </ChannelActions>
        </>
      }
      { toast && 
        <NotificationToast
          notification={toast}
          clearToast = {clearToast}
        />
      }
    </Container>
  );
}

// css styles
const Container = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;

  background: #fff;
  border-radius: 10px;
  border: 1px solid rgb(237, 237, 237);

  margin: 15px 0px;
  justify-content: center;
  padding: 10px;
`

const SkeletonWrapper = styled.div`
  overflow: hidden;
  width: ${props => props.atW + '%' || '100%'};
  height: ${props => props.atH}px;
  border-radius: ${props => props.borderRadius || 10}px;
  margin-bottom: ${props => props.marginBottom || 5}px;
  margin-right: ${props => props.marginRight || 0}px;
`

const ChannelLogo = styled.div`
  max-width: 100px;
  min-width: 32px;
  flex: 1;
  margin: 5px;
  padding: 10px;
  border: 2px solid #fafafa;
  overflow: hidden;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: flex-start;
`

const ChannelLogoOuter = styled.div`
  padding-top: 100%;
  position: relative;
`

const ChannelLogoInner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const ChannelLogoImg = styled.img`
  object-fit: contain;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
`

const ChannelInfo = styled.div`
  flex: 1;
  margin: 5px 10px;
  min-width: 120px;
  flex-grow: 4;
  flex-direction: column;
  display: flex;
`

const ChannelTitle = styled.div`
  margin-bottom: 5px;
`

const ChannelTitleLink = styled.a`
  text-decoration: none;
  font-weight: 600;
  color: #e20880;
  font-size: 20px;
  &:hover {
    text-decoration: underline;
    cursor: pointer;
    pointer: hand;
  }
`

const ChannelDesc = styled.div`
  flex: 1;
  display: flex;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 400;
  flex-direction: column;
`

const ChannelDescLabel = styled.label`
  flex: 1;
`

const ChannelMeta = styled.div`
  display: flex;
  flex-direction: row;
  font-size: 13px;
`

const ChannelMetaBox = styled.label`
  margin: 0px 5px;
  color: #fff;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
`

const Subscribers = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const SubscribersCount = styled(ChannelMetaBox)`
  background: #35c4f3;
`

const Pool = styled.div`
  margin: 0px 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
`

const PoolShare = styled(ChannelMetaBox)`
  background: #674c9f;
`

const LineBreak = styled.div`
  display: none;
  flex-basis: 100%;
  height: 0;

  @media ${Device.tablet} {
    display: block;
  }
`

const ChannelActions = styled.div`
  margin: 5px;
  flex-grow: 1;
  // max-width: 250px;
  display: flex;
  justify-content: flex-end;
  // justify-content: center;
  align-items: center;
`

const ChannelActionButton = styled.button`
  border: 0;
  outline: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  margin: 10px;
  color: #fff;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 400;
  position: relative;
  &:hover {
    opacity: 0.9;
    cursor: pointer;
    pointer: hand;
  }
  &:active {
    opacity: 0.75;
    cursor: pointer;
    pointer: hand;
  }
  ${ props => props.disabled && css`
    &:hover {
      opacity: 1;
      cursor: default;
      pointer: default;
    }
    &:active {
      opacity: 1;
      cursor: default;
      pointer: default;
    }
  `}
`

const ActionTitle = styled.span`
  ${ props => props.hideit && css`
    visibility: hidden;
  `};
`

const ActionLoader = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const SkeletonButton = styled.div`
  border: 0;
  outline: 0;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  border-radius: 5px;
  flex: 1;
`

const SubscribeButton = styled(ChannelActionButton)`
  background: #e20880;
`

const UnsubscribeButton = styled(ChannelActionButton)`
  background: #674c9f;
`

const OwnerButton = styled(ChannelActionButton)`
  background: #35c5f3;
`

const Toaster = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0px 10px;
`

const ToasterMsg = styled.div`
  margin: 0px 10px;
`

// Export Default
export default ViewChannelItem;
