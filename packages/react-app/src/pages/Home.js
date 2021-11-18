import React from "react";
import ReactGA from 'react-ga';

import styled, { css } from 'styled-components';

import { addresses, abis } from "@project/contracts";
import { useWeb3React } from '@web3-react/core'
import { ethers } from "ethers";

import Loader from 'react-loader-spinner'

import AliasVerificationodal from 'components/AliasVerificationModal';
import EPNSCoreHelper from 'helpers/EPNSCoreHelper';
import config from 'config';
import NotificationToast from "components/NotificationToast";
import Feedbox from 'segments/Feedbox';
import ViewChannels from 'segments/ViewChannels';
import Info from "segments/Info";
import ChannelOwnerDashboard from 'segments/ChannelOwnerDashboard';
import ChannelCreationDashboard from 'segments/ChannelCreationDashboard';

import ChannelsDataStore, { ChannelEvents } from "singletons/ChannelsDataStore";
import UsersDataStore, { UserEvents } from "singletons/UsersDataStore";
import { postReq } from "api"

export const ALLOWED_CORE_NETWORK = 42 //chainId of networks which we have deployed the core contract on
const CHANNEL_TAB = 1 //Default to 1 which is the channel tab
const NOTIF_TAB = 0;
// Create Header
function Home({ setBadgeCount, bellPressed }) {
  ReactGA.pageview('/home');

  const { active, error, account, library, chainId } = useWeb3React();
  const onCoreNetwork = ALLOWED_CORE_NETWORK === chainId;
  const INITIAL_OPEN_TAB =  CHANNEL_TAB ;//if they are not on a core network.redirect then to the notifications page

  const [epnsReadProvider, setEpnsReadProvider] = React.useState(null); // read provider for epns core functions
  const [epnsCommReadProvider, setEpnsCommReadProvider] = React.useState(null); // read provider for epns communicator functions
  const [epnsWriteProvider, setEpnsWriteProvider] = React.useState(null);
  const [epnsCommWriteProvider, setEpnsCommWriteProvider] = React.useState(null);
 
  const [controlAt, setControlAt] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [adminStatusLoaded, setAdminStatusLoaded] = React.useState(false);
  const [aliasEthAccount, setAliasEthAccount] = React.useState(null);
  const [aliasVerified, setAliasVerified] = React.useState(true);
  const [channelAdmin, setChannelAdmin] = React.useState(false);
  const [channelJson, setChannelJson] = React.useState([]);

  // toast related section
  const [toast, showToast] = React.useState(null);
  const clearToast = () => showToast(null);
  const showNetworkToast = () => {
    showToast({
      notificationTitle: <span style={{color: "#e20880"}}> Invalid Network </span>,
      notificationBody: "Please connect to the Ropsten network to access channels"
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
    (async function(){
      const coreProvider = onCoreNetwork ?
        library : ethers.getDefaultProvider(ALLOWED_CORE_NETWORK, {etherscan: config.etherscanToken})
      // if we are not on the core network then check for if this account is an alias for another channel
      if(!onCoreNetwork){
        // for now resolve a fake promise to return the current user address as the eth account of the channel's current alias
        const aliasEth = await postReq('/channels/get_alias' , {
            "aliasAddress": account,
            "aliasBlockchain":"POLYGON_TEST_MUMBAI", //use this for now, since we are only on polygon network
            "op":"read"
        })
        .then(({data}) => {
          console.log({data})
          const ethAccount =  data || account;
          setAliasEthAccount(ethAccount);
          return data;
        }); 
        if(aliasEth){
          // for now resolve a fake promise to return the current user address as the eth account of the channel's current alias
          const aliasVerified = await postReq('/channels/get_alias_verification_status', {
            "aliasAddress":account,
            "op":"read"
          })
          .then(({data}) => {
            const {status} = data;
            console.log({secd: data})
            const aliasIsVerified =  data;
            setAliasVerified(status);
            return aliasIsVerified
          }); 
        } 
      }
      // if we are not on the core network then fetch if there is an alias address from the api
      // inititalise the read contract for the core network
      const coreContractInstance = new ethers.Contract(addresses.epnscore, abis.epnscore, coreProvider);
      setEpnsReadProvider(coreContractInstance);
      // inititalise the read contract for the core network
  
      // initialise the read contract for the communicator function
      const commAddress = onCoreNetwork ? addresses.epnsEthComm : addresses.epnsPolyComm;
      const commContractInstance = new ethers.Contract(commAddress, abis.epnsComm, library);
      setEpnsCommReadProvider(commContractInstance);
      // initialise the read contract for the communicator function
  
      if (!!(library && account)) {
        let signer = library.getSigner(account);
        const coreSignerInstance = new ethers.Contract(addresses.epnscore, abis.epnscore, signer);
        setEpnsWriteProvider(coreSignerInstance);
        const communicatorSignerInstance = new ethers.Contract(commAddress, abis.epnsComm, signer);
        setEpnsCommWriteProvider(communicatorSignerInstance)
      }
    })();

  }, [account, chainId]);

  React.useEffect(() => {
    if(!epnsReadProvider || !epnsCommReadProvider) return;
    // Reset when account refreshes
    setChannelAdmin(false);
    setAdminStatusLoaded(false);
    userClickedAt(INITIAL_OPEN_TAB);
    setChannelJson([]);

    // EPNS Read Provider Set
    if (epnsReadProvider != null && epnsCommReadProvider != null) {
      // Instantiate Data Stores
      UsersDataStore.instance.init(account, epnsReadProvider, epnsCommReadProvider);
      ChannelsDataStore.instance.init(account, epnsReadProvider, epnsCommReadProvider);
      checkUserForChannelRights();
    }

  }, [epnsReadProvider, epnsCommReadProvider]);


  // Revert to Feedbox on bell pressed
  React.useEffect(() => {
    setControlAt(0);
  }, [bellPressed]);

  // handle user action at control center
  const userClickedAt = (controlIndex) => {
    setControlAt(controlIndex);
  }

  //Start Listening...
  const listenerForChannelRights = async () => {
    ChannelsDataStore.instance.addCallbacks(
      ChannelEvents.ADD_CHANNEL_SELF,
      "FromCreateChannel",
      () => {
        checkUserForChannelRights();
      }
    );
  }

  // Check if a user is a channel or not
  const checkUserForChannelRights = async () => {
    // Check if account is admin or not and handle accordingly
    const ownerAccount = !onCoreNetwork ? aliasEthAccount : account;
    EPNSCoreHelper.getChannelJsonFromUserAddress(ownerAccount, epnsReadProvider)
      .then(response => {
        setChannelJson(response);
        setChannelAdmin(true);
        setAdminStatusLoaded(true);
      })
      .catch(e => {
        setChannelAdmin(false);
        setAdminStatusLoaded(true);
      })
      .finally(() =>{
        setAdminStatusLoaded(true);
      });

    // Start listening
    listenerForChannelRights();
  }

  // Render
  return (
    <Container>
      <Controls>
        <ControlButton index={0} active={controlAt == 0 ? 1 : 0} border="#e20880"
          onClick={() => {
            userClickedAt(0)
          }}
        >
          <ControlImage src="./svg/feedbox.svg" active={controlAt == 0 ? 1 : 0} />
          <ControlText active={controlAt == 0 ? 1 : 0}>Feedbox</ControlText>
        </ControlButton>

        <ControlButton index={1} active={controlAt == 1 ? 1 : 0} border="#35c5f3"
          onClick={() => {
            // if they arent connected to the right channels then we have to restrict access to here
            // if(!onCoreNetwork){
            //   return showNetworkToast();
            // }
            userClickedAt(1)
          }}
        >
          <ControlImage src="./svg/channel.svg" active={controlAt == 1 ? 1 : 0}/>
          <ControlText active={controlAt == 1 ? 1 : 0}>Channels</ControlText>
        </ControlButton>

        <ControlButton index={2} active={controlAt == 2 ? 1 : 0} border="#674c9f"
          disabled={!adminStatusLoaded}
          onClick={() => {
            if (adminStatusLoaded) {
              // if youre not on kovan and you dont have a channel, you cannot create except on kovan, so throw error
              if(!channelAdmin && !onCoreNetwork){
                return showNetworkToast();
              }
              if(channelAdmin && !aliasVerified && !onCoreNetwork){
                return setModalOpen(true);
              }
              userClickedAt(2)
            }
          }}
        >
          {!adminStatusLoaded &&
            <Loader
               type="Oval"
               color="#674c9f"
               height={32}
               width={32}
            />
          }
          {channelAdmin && adminStatusLoaded && (onCoreNetwork ? true : aliasVerified) &&
            <ControlChannelContainer>
              <ControlChannelImage src={`${channelJson.icon}`} active={controlAt == 2 ? 1 : 0}/>
              <ControlChannelText active={controlAt == 2 ? 1 : 0}>{channelJson.name}</ControlChannelText>
            </ControlChannelContainer>
          }
          {channelAdmin && adminStatusLoaded && (!aliasVerified && !onCoreNetwork) &&
            <ControlChannelContainer>
              <ControlChannelImage src={`${channelJson.icon}`} active={controlAt == 2 ? 1 : 0}/>
              <ControlChannelText active={controlAt == 2 ? 1 : 0}>Verify channel alias</ControlChannelText>
            </ControlChannelContainer>
          }
          {!channelAdmin && adminStatusLoaded &&
            <>
              <ControlImage src="./svg/channeladmin.svg" active={controlAt == 2 ? 1 : 0}/>
              <ControlText active={controlAt == 2 ? 1 : 0}>Create Your Channel</ControlText>
            </>
          }
        </ControlButton>

        <ControlButton index={3} active={controlAt == 3 ? 1 : 0} border="#e20880"
          onClick={() => {
            userClickedAt(3)
          }}
        >
          <ControlImage src="./svg/share.svg" active={controlAt == 3 ? 1 : 0} />
          <ControlText active={controlAt == 3 ? 1 : 0}>Receive Notifs</ControlText>
        </ControlButton>
      </Controls>
      <Interface>
        {controlAt == 0 &&
          <Feedbox
            epnsReadProvider={epnsReadProvider}
          />
        }
        {controlAt == 1 &&
          <ViewChannels
            epnsReadProvider={epnsReadProvider}
            epnsCommReadProvider={epnsCommReadProvider}
            epnsWriteProvide={epnsWriteProvider}
            epnsCommWriteProvider={epnsCommWriteProvider}
          />
        }
        {controlAt == 2 && !channelAdmin && adminStatusLoaded &&
          <ChannelCreationDashboard />
        }
        {controlAt == 2 && channelAdmin && adminStatusLoaded &&
          <ChannelOwnerDashboard 
            epnsReadProvider={epnsReadProvider}
            epnsCommReadProvider={epnsCommReadProvider}
            epnsWriteProvider={epnsWriteProvider}
            epnsCommWriteProvider={epnsCommWriteProvider}
          />
        }
        {controlAt == 3 &&
          <Info/>
        }
        { toast && 
          <NotificationToast
            notification={toast}
            clearToast = {clearToast}
          />
        }
        {
          modalOpen &&
          <AliasVerificationodal
            onClose={() => setModalOpen(false)}
            onSuccess={() => setAliasVerified(true)}
          />
        }
      </Interface>
    </Container>
  );
}

// css style
const Container = styled.div`
  flex: 1;
  display: block;
  flex-direction: column;
  min-height: calc(100vh - 100px);
`

const Controls = styled.div`
  flex: 0;
  display: flex;
  flex-direction: row;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`

const ControlButton = styled.div`
  flex: 1 1 21%;
  height: 120px;
  min-width: 200px;
  background: #fff;

  box-shadow: 0px 15px 20px -5px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  border: 1px solid rgb(225,225,225);

  border-bottom: 10px solid rgb(180,180,180);
  margin: 20px;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  border-bottom: 10px solid ${(props) => props.active ? props.border : "rgb(180,180,180)"};

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
`

const ControlImage = styled.img`
  height: 30%;
  margin-right: 15px;
  filter: ${(props) => props.active ? "brightness(1)" : "brightness(0)"};
  opacity: ${(props) => props.active ? "1" : "0.25"};

  transition: transform .2s ease-out;
  ${ props => props.active && css`
    transform: scale(3.5) translate(-20px, 0px);
    opacity: 0.4;
  `};
`

const ControlText = styled.label`
  font-size: 16px;
  font-weight: 200;
  opacity: ${(props) => props.active ? "1" : "0.75"};

  transition: transform .2s ease-out;
  ${ props => props.active && css`
    transform: scale(1.3) translate(-10px, 0px);
  `};
`

const ControlChannelContainer = styled.div`
  margin: 0px 20px;
  flex-direction: column;
  align-items: center;
  display: flex;
`

const ControlChannelImage = styled.img`
    width: 20%;
    margin-bottom: 10px;
    transition: transform .2s ease-out;
    ${ props => props.active && css`
      transform: scale(3.5) translate(-40px, 5px);
      opacity: 0.2;
      z-index: 1;
    `};
`

const ControlChannelText = styled.label`
  font-size: 16px;
  font-weight: 300;
  opacity: ${(props) => props.active ? "1" : "0.75"};
  transition: transform .2s ease-out;
  background: -webkit-linear-gradient(#db268a, #34c6f3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  z-index: 2;
  ${ props => props.active && css`
    transform: scale(1.1) translate(0px, -20px);
  `};

`

const Interface = styled.div`
  flex: 1;
  display: flex;

  box-shadow: 0px 15px 20px -5px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  border: 1px solid rgb(225,225,225);

  margin: 15px;
  overflow: hidden;
`

// Export Default
export default Home;
