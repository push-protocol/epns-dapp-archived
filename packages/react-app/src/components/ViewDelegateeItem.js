import React from "react";
import styled, { css } from "styled-components";
import Blockies from "components/BlockiesIdenticon";
import {
  Item,
  ItemH,
  ItemBreak,
  Image,
  Span,
  Anchor,
} from "components/SharedStyling";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import Loader from "react-loader-spinner";

import Skeleton from "@yisheng90/react-loading";
import { FiTwitter } from "react-icons/fi";
import { GoVerified } from "react-icons/go";
import { IoMdShareAlt } from "react-icons/io";

import { useWeb3React } from "@web3-react/core";

function ViewDelegateeItem({ delegateeObject, epnsToken, pushBalance, theme }) {
  const { account, library } = useWeb3React();
  const [loading, setLoading] = React.useState(true);
  const [, setTxInProgress] = React.useState(false);
  const [isBalance, setIsBalance] = React.useState(false);

  React.useEffect(() => {
    setLoading(false);
    if (pushBalance !== 0) {
      setIsBalance(true);
    }
    // eslint-disable-next-line
  }, [account, delegateeObject]);

  const delegateAction = async (delegateeAddress) => {
    setTxInProgress(true);
    if (!isBalance) {
      toast.dark("No PUSH to Delegate!", {
        position: "bottom-right",
        type: toast.TYPE.ERROR,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      setTxInProgress(false);
      return;
    }
    let sendWithTxPromise;
    sendWithTxPromise = epnsToken.delegate(delegateeAddress);
    sendWithTxPromise
      .then(async (tx) => {
        let txToast = toast.dark(
          <LoaderToast msg="Waiting for Confirmation..." color="#35c5f3" />,
          {
            position: "bottom-right",
            autoClose: false,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        );
        try {
          await library.waitForTransaction(tx.hash);
          toast.update(txToast, {
            render: "Transaction Completed!",
            type: toast.TYPE.SUCCESS,
            autoClose: 5000,
          });
          setTxInProgress(false);
        } catch (e) {
          toast.update(txToast, {
            render: "Transaction Failed! (" + e.name + ")",
            type: toast.TYPE.ERROR,
            autoClose: 5000,
          });
          setTxInProgress(false);
        }
      })
      .catch(() => {
        toast.dark("Transaction Cancelled!", {
          position: "bottom-right",
          type: toast.TYPE.ERROR,
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setTxInProgress(false);
      });
  };

  // toast customize
  const LoaderToast = ({ msg, color }) => (
    <Toaster>
      <Loader type="Oval" color={color} height={30} width={30} />
      <ToasterMsg>{msg}</ToasterMsg>
    </Toaster>
  );

  // render
  return (
    <Item key={delegateeObject.wallet}>
      <DelegateeItem theme={theme}>
        <DelegateeImageOuter>
          <DelegateeImageInner>
            {loading && <Skeleton color="#eee" width="100%" height="100%" />}
            {!loading && delegateeObject.pic && (
              <Image
                src={`./delegatees/${delegateeObject.pic}.jpg`}
                srcSet={`./delegatees/${delegateeObject.pic}@2x.jpg 2x, ./delegatees/${delegateeObject.pic}@3x.jpg 3x`}
                alt={delegateeObject.name}
              />
            )}
            {!loading && !delegateeObject.pic && (
              <Blockies
                seed={delegateeObject.wallet.toLowerCase()}
                opts={{
                  seed: delegateeObject.wallet.toLowerCase(),
                  size: 30,
                  scale: 10,
                }}
              />
            )}
          </DelegateeImageInner>

          <ItemH
            position="absolute"
            top="10px"
            left="10px"
            bg="#00000088"
            padding="6px 10px"
            radius="22px"
          >
            <GoVerified size={12} color="#fff" />
            <Span
              size="12px"
              color="#fff"
              padding="0px 0px 0px 10px"
              spacing="0.2em"
              weight="600"
              textAlign="center"
            >
              {delegateeObject.votingPower.toLocaleString()}
            </Span>
          </ItemH>
        </DelegateeImageOuter>

        <DelegateeProfile>
          <Item>
            <ItemH>
              <Span weight="400" textAlign="center">
                {delegateeObject.name}
              </Span>
              <Anchor
                href={delegateeObject.url}
                target="_blank"
                title={"Visit Twitter profile of " + delegateeObject.name}
                bg="transparent"
                radius="4px"
                padding="4px"
                margin="0px 6px"
              >
                <FiTwitter size={12} color="#35c5f3" />
              </Anchor>
            </ItemH>

            <DelegateeWallet
              size="0.5em"
              color="#aaa"
              spacing="0.2em"
              weight="600"
              textAlign="center"
            >
              {delegateeObject.wallet}
            </DelegateeWallet>
          </Item>
          <ItemBreak></ItemBreak>
          <UnsubscribeButton>
            <ActionTitle
              onClick={() => {
                delegateAction(delegateeObject.wallet);
              }}
            >
              Delegate
            </ActionTitle>
          </UnsubscribeButton>

          <Item position="absolute" bottom="2px" left="-2px" padding="4px">
            <Anchor
              href={delegateeObject.forum}
              target="_blank"
              title={"Visit forum post of " + delegateeObject.name}
              bg="transparent"
              radius="4px"
              padding="2px"
            >
              <IoMdShareAlt size={16} color="#fff" />
            </Anchor>
          </Item>
        </DelegateeProfile>
      </DelegateeItem>
    </Item>
  );
}

// css styles
const DelegateeItem = styled.div`
  max-width: 220px;
  min-width: 220px;
  flex: 1;
  margin: 20px 20px;
  padding: 4px;
  border: 2px solid #fafafa;
  overflow: hidden;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: flex-start;
  position: relative;
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(props) =>
      props.theme === "nominee"
        ? "#35c5f3"
        : "linear-gradient( 283deg, #34c5f2 0%, #e20880 45%, #35c5f3 100%)"};
  }
`;

const DelegateeImageOuter = styled.div`
  padding-top: 100%;
  position: relative;
`;

const DelegateeImageInner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-top-right-radius: 16px;
  border-top-left-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DelegateeProfile = styled(ItemH)`
  background: #fff;
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 90px;
  padding: 20px;
`;

const DelegateeWallet = styled(Span)`
  word-break: break-all;
  padding-top: 4px;
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
  ${(props) =>
    props.disabled &&
    css`
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
`;

const ActionTitle = styled.span`
  ${(props) =>
    props.hideit &&
    css`
      visibility: hidden;
    `};
`;

const UnsubscribeButton = styled(ChannelActionButton)`
  background: #000;
`;

const Toaster = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0px 10px;
`;

const ToasterMsg = styled.div`
  margin: 0px 10px;
`;

// Export Default
export default ViewDelegateeItem;
