import React from "react";
import Davatar from "@davatar/react";
import styled from "styled-components";
import { useWeb3React } from "@web3-react/core";
import Loader from "react-loader-spinner";
import useENS from "helpers/useENS";
import EPNSCoreHelper from "helpers/EPNSCoreHelper";

// Create Header
function Profile() {
  const { error, account } = useWeb3React();
  const { ensName, loading } = useENS();

  return (
    <>
      {account && account !== "" && !error && (
        <Container>
          <BlockyInner>
            <Davatar
              size={50}
              address={account}
              generatedAvatarType="blockies"
            />
          </BlockyInner>
          <Wallet>
            {loading ? (
              <Loader type="Oval" color="#FFF" height={16} width={16} />
            ) : (
              <>{ensName || EPNSCoreHelper.shortenAddress(account)}</>
            )}
          </Wallet>
        </Container>
      )}
    </>
  );
}

// css styles
const Container = styled.button`
  margin: 0;
  padding: 0;
  background: none;
  border: 0;
  outline: 0;
  justify-content: flex-start;
  flex: 1,
  flex-direction: row;
  align-items: center;
  display: flex;
`;

const BlockyInner = styled.div``;

const Wallet = styled.span`
  margin: 0px 10px;
  padding: 8px 15px;
  height: 16px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #fff;
  border-radius: 15px;
  background: rgb(226, 8, 128);
  background: linear-gradient(
    107deg,
    rgba(226, 8, 128, 1) 30%,
    rgba(103, 76, 159, 1) 70%,
    rgba(53, 197, 243, 1) 100%
  );
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
export default Profile;
