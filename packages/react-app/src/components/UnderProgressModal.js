import React from "react";
import styled, { keyframes } from "styled-components";
import { MdClose } from "react-icons/md";

const UnderProgressModal = () => {
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {}, []);
  return (
    <>
      <Modal show={show}>
        {/* <ModalHeader> */}
        <MdClose
          className="closeIcon"
          style={{ margin: "15px" }}
          fontSize="1.5rem"
          onClick={(e) => setShow(false)}
        />
        {/* </ModalHeader> */}
        {/* <ModalBody>
        <h1>Hi User,
            <br/>
             We Are Currently Migrating This Site 
             <br/>To The Mainnet
            <br/>
         So You May Face Some Downtime Here.</h1>
        </ModalBody>
        <ModalFooter>
            <h3>If You Want To Report an Issue Join Here:</h3>
            <div className='contact'>
            <FaTelegramPlane color='#4292e4' fontSize="1.5rem" onClick={e=>window.open("https://t.me/epnsproject")}/>
            <FaDiscord color='#aa24b9' fontSize="1.5rem" onClick={e=>window.open("https://discord.gg/YVPB99F9W5")}/>
            </div>
        </ModalFooter> */}
        <DownTimeImg src="/DOWNTIME2.png" alt="downTime" />
      </Modal>
    </>
  );
};

const animateappear = keyframes`
    
0%{
    opacity:0;
    transform:scale(.4);
}
100%{
    opacity:1;  
    transform: scale(1);
}

`;
const DownTimeImg = styled.img`
  height: 800px;
  width: 900px;
`;
const Modal = styled.div`
  display: ${(props) => {
    if (props.show) return "block";
    else return "none !important";
  }};
  background: #c6edfa;
  box-shadow: 4px 4px 10px gray;
  height: 500px;
  width: 870px;
  flex-direction: column;
  border-radius: 10px;
  position: absolute;
  z-index: 5;
  top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${animateappear} 0.1s linear;

  .closeIcon {
    position: absolute;
    top: 0.1rem;
    right: 0.1rem;
    color: white;
    z-index: 4;
  }
`;

export default UnderProgressModal;
