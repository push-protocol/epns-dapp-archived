import React from "react";

import {
  Section,
  Content,
  Item,
  ItemH,
  ItemBreak,
  H1,
  H2,
  H3,
  Image,
  P,
  Span,
  Anchor,
  Button,
  Showoff,
  FormSubmision,
  Input,
  TextField,
} from "components/SharedStyling";
import { useClickAway } from "react-use";
import styled, { css } from "styled-components";
import { ToastContainer, toast as toaster  } from 'react-toastify';


import Dropdown from "react-dropdown";
import Slider from "@material-ui/core/Slider";

import "react-dropdown/style.css";

import "react-toastify/dist/ReactToastify.min.css";

import { useWeb3React } from "@web3-react/core";

import { addresses, abis } from "@project/contracts";
import EPNSCoreHelper from "helpers/EPNSCoreHelper";
import { postReq } from "api";
import Loader from 'react-loader-spinner';

const ethers = require("ethers");

const CHANNNEL_DEACTIVATED_STATE = 2;
const CHANNEL_BLOCKED_STATE = 3;
const CHANNEL_ACTIVE_STATE = 1;
const MIN_STAKE_FEES = 50;

// Create Header
function ChannelSettings({
  epnsReadProvider, epnsWriteProvider, epnsCommReadProvider, epnsCommWriteProvider,
  setKey
}) {
  const { active, error, account, library, chainId } = useWeb3React();
  const popupRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [channelState, setChannelState] = React.useState(CHANNEL_ACTIVE_STATE);
  const [showPopup, setShowPopup] = React.useState(false);
  const [channelStakeFees, setChannelStakeFees] = React.useState(MIN_STAKE_FEES);
  const [poolContrib, setPoolContrib] = React.useState(0);

  useClickAway(popupRef, () => {
    if(showPopup){
      setShowPopup(false);
    }
  });

  // toaster customize
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

  const isChannelDeactivated = channelState === CHANNNEL_DEACTIVATED_STATE;
  const isChannelBlocked = channelState === CHANNEL_BLOCKED_STATE;

  const getChannelData = async (contract, channel) => {
    return new Promise((resolve, reject) => {
      // To get channel info from a channel address
      contract
        .channels(channel)
        .then((response) => {
          console.log("getChannelInfo() --> %o", response);
          setChannelState(response.channelState);
          setPoolContrib(
           +EPNSCoreHelper.formatBigNumberToMetric(
              response.poolContribution,
              true
            )
          );
        })
        .catch((err) => {
          console.log("!!!Error, getChannelInfo() --> %o", err);
          reject(err);
        });
    });
  };

  React.useEffect(() => {
    var signer = library.getSigner(account);
    let contract = new ethers.Contract(
      addresses.epnscore,
      abis.epnscore,
      signer
    );
    getChannelData(contract, account);
  }, [account]);

  const toggleChannel = () => {
    if(isChannelBlocked) return;
    if(isChannelDeactivated){
      setShowPopup(true)
    }else{
      deactivateChannel();
    }
  }

  const bn = function (number, defaultValue = null) { if (number == null) { if (defaultValue == null) { return null } number = defaultValue } return ethers.BigNumber.from(number) }
  const tokensBN = function (amount) { return (bn(amount).mul(bn(10).pow(18))) }

  const activateChannel = async () => {
    // First Approve DAI
    setLoading(true);
    var signer = library.getSigner(account);
    let daiContract = new ethers.Contract(addresses.dai, abis.erc20, signer);
    const fees = ethers.utils.parseUnits(channelStakeFees.toString(), 18);
    var sendTransactionPromise = daiContract.approve(addresses.epnscore, fees);
    const tx = await sendTransactionPromise;

    console.log(tx);
    console.log("waiting for tx to finish");

    await library.waitForTransaction(tx.hash);

    console.log(
      {
        bignum: tokensBN(channelStakeFees),
        bignumstr: tokensBN(channelStakeFees).toString()
      }
    )
    await epnsWriteProvider.reactivateChannel(fees)
    .then(async (tx) => {
      console.log(tx);
      console.log ("Transaction Sent!");

      toaster.update(notificationToast(), {
        render: "Transaction sent",
        type: toaster.TYPE.INFO,
        autoClose: 5000
      });

      await tx.wait(1);
      toaster.update(notificationToast(), {
        render: "Channel Recreated",
        type: toaster.TYPE.INFO,
        autoClose: 5000
      });
      setChannelState(CHANNEL_ACTIVE_STATE);
      setKey(Math.random());//force the sibling component to rerender
    })
    .catch(err => {
      console.log("!!!Error reactivateChannel() --> %o", err);
      toaster.update(notificationToast(), {
        render: "Transacion Failed: " + err.error?.message || err.message,
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
    })
    .finally(() => {
      setLoading(false);
      setShowPopup(false);
    })
  }

  const deactivateChannel = async () => {
    setLoading(true);

    const amountToBeConverted = parseInt(""+poolContrib) - 10;
    console.log("Amount To be converted==>", amountToBeConverted);

      
    const {data: response} = await postReq('/channels/get_dai_to_push', {
      value: amountToBeConverted
    });

    const pushValue = response.response.data.quote.PUSH.price;

    const amountsOut = pushValue * Math.pow(10, 18);

    console.log("amountsOut", amountsOut);

    await epnsWriteProvider.deactivateChannel()
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
      setChannelState(CHANNNEL_DEACTIVATED_STATE);
      setKey(Math.random());//force the sibling component to rerender
    })
    .catch(err => {
      console.log("!!!Error deactivateChannel() --> %o", err);
      toaster.update(notificationToast(), {
        render: "Transacion Failed: " + err.error?.message || err,
        type: toaster.TYPE.ERROR,
        autoClose: 5000
      });
    })
    .finally(() => {
      // post op
      setLoading(false);
    })
    // const deactivateRes = await contract.deactivateChannel(
    //   amountsOut
    // );

    // console.log(deactivateRes);
  }


  return (
    <>
      <Section>
        <Content padding="10px 10px">
          <Item align="flex-end">
            <ChannelActionButton
              onClick={toggleChannel}
            >
              <ActionTitle>
                { loading ?
                  <Loader
                    type="Oval"
                    color="#FFF"
                    height={16}
                    width={16}
                  /> : (isChannelBlocked ? "Channel Blocked" : (isChannelDeactivated ? "Activate Channel" : "Deactivate Channel"))
                }
              </ActionTitle>
            </ChannelActionButton>
          </Item>
        </Content>
        {
          showPopup && (
            <PopupOverlay >
              <PopupSlider ref={popupRef}>
              <Section>
                <Content padding="50px 0px 0px 0px">
                  <Item align="flex-start" margin="0px 20px">
                    <H3 color="#e20880">Set your staking fees in DAI</H3>
                  </Item>

                  <Item
                    margin="-10px 20px 20px 20px"
                    padding="20px 20px 10px 20px"
                    bg="#f1f1f1"
                  >
                    <Slider
                      defaultValue={MIN_STAKE_FEES}
                      onChangeCommitted={(event, value) => setChannelStakeFees(Number(value))}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="auto"
                      step={MIN_STAKE_FEES}
                      marks
                      min={MIN_STAKE_FEES}
                      max={25000}
                    />
                    <Span
                      weight="400"
                      size="1.0em"
                      textTransform="uppercase"
                      spacing="0.2em"
                    >
                      Amount Staked: {channelStakeFees} DAI
                    </Span>
                  </Item>

                  <Item self="stretch" align="stretch" margin="20px 0px 0px 0px">
                    <Button
                      bg="#e20880"
                      color="#fff"
                      flex="1"
                      radius="0px"
                      padding="20px 10px"
                      onClick={activateChannel}
                    >
                      {loading ?
                        <Loader
                          type="Oval"
                          color="#FFF"
                          height={16}
                          width={16}
                        /> : (
                          <Span
                            color="#fff"
                            weight="400"
                            textTransform="uppercase"
                            spacing="0.1em"
                          >
                            Reactivate Channel
                          </Span>
                        ) 
                      }
                    </Button>
                  </Item>
                </Content>
              </Section>
              </PopupSlider>
            </PopupOverlay>
          )
        } 
      </Section>
    </>
  );
}

const PopupOverlay = styled.div`
  background: rgba(0,0,0,0.5);
  height: 100vh;
  width: 100vw;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  justify-content: center;
  align-items: center;
`;

const PopupSlider = styled.div`
    height: 200px;
    width: 70vw;
    background: white;
`;

// css styles
const Toaster = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0px 10px;
`;

const ActionTitle = styled.span`
  ${(props) =>
    props.hideit &&
    css`
      visibility: hidden;
    `};
`;

const ToasterMsg = styled.div`
  margin: 0px 10px;
`;

const DropdownStyledParent = styled.div`
  .is-open {
    margin-bottom: 130px;
  }
`;

const MultiRecipientsContainer = styled.div`
  width: 100%;
  padding: 0px 20px;
  padding-top: 10px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 7px 15px;

  span {
    color: white;
    background: #e20880;
    padding: 6px 10px;
    border-radius: 5px;

    i {
      cursor: pointer;
      margin-left: 25px;
    }
  }
`;
const Parent = styled(Section)`
  padding: 20px;
  margin: 0px 20px 0px 20px;
`;

const DropdownStyled = styled(Dropdown)`
  .Dropdown-control {
    background-color: #000;
    color: #fff;
    padding: 12px 52px 12px 10px;
    border: 1px solid #000;
    border-radius: 4px;
  }

  .Dropdown-placeholder {
    text-transform: uppercase;
    font-weight: 400;
    letter-spacing: 0.2em;
    font-size: 0.8em;
  }

  .Dropdown-arrow {
    top: 18px;
    bottom: 0;
    border-color: #fff transparent transparent;
  }

  .Dropdown-menu {
    border: 1px solid #000;
    box-shadow: none;
    background-color: #000;
    border-radius: 0px;
    margin-top: -3px;
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  .Dropdown-option {
    background-color: rgb(35 35 35);
    color: #ffffff99;

    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.7em;
    padding: 15px 20px;
  }

  .Dropdown-option:hover {
    background-color: #000000;
    color: #fff;
  }
`;

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
  background-color: #674c9f;
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
`;

// Export Default
export default ChannelSettings;
