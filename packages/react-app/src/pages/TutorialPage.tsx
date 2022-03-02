import React from "react";
import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  STATUS,
  Step,
  Props,
} from "react-joyride";
import styled, { css, useTheme } from "styled-components";
import { ThemeProvider } from "styled-components";
import Navigation from "../sections/Navigation";
import {
  Section,
  Content,
  Item,
  H2,
  Span,
  Button,
} from "components/SharedStyling";

function TutorialPage() {
  const themes = useTheme();
  const [Steps, setSteps] = React.useState<Props>({
    run: true,
    steps: [
      {
        content: (
          <div>
            <h2>Let's begin our journey!</h2>
            <p>
              Welcome to the tutorial. This is a guided tour of the features of
              the application.
            </p>
          </div>
        ),
        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
        placement: "center",
        target: "body",
      },
      {
        content: <h2>Walkthrough task 1</h2>,
        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
        placement: "auto",
        target: ".menu",
      },

      {
        content: <h2>Walkthrough task 2</h2>,
        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
        placement: "auto",
        target: "a[href='/tutorial']",
      },
      {
        content: <h2>Walkthrough task 3</h2>,
        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
        placement: "auto",
        target: "a[href='/channels']",
        
      },
      {
        content: <h2>Walkthrough task 4</h2>,
        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
        placement: "auto",
        target: "a[href='/inbox']",
      },
    ],
  });

  const handleJoyrideCallback = () => {
    // const { status, type } = data;
    // if (status === STATUS.FINISHED) {
    //   setSteps({
    //     run: false,
    //   });
    // }
  };

  // Render
  return (
    <ThemeProvider theme={themes}>
      <Joyride
        callback={handleJoyrideCallback}
        continuous={true}
        run={Steps.run}
        scrollToFirstStep={true}
        // showProgress={true}
        showSkipButton={true}
        steps={Steps.steps}
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      />
      <Section margin="20px" className="menu">
        <Content padding="0px 20px 0px">
          <Item align="flex-start">
            <H2 textTransform="uppercase" spacing="0.1em">
              <Span bg="#35c5f3" color="#fff" weight="600" padding="0px 8px">
                Walkthrough
              </Span>
            </H2>
          </Item>
        </Content>
      </Section>
      <Section>hi user</Section>
      <Section margin="20px">
        <Content padding="0px 20px 0px">
          <Button align="flex-start">
            <H2 textTransform="uppercase" spacing="0.1em">
              <Span bg="#35c5f3" color="#fff" weight="600" padding="0px 8px">
                Explore on my own
              </Span>
            </H2>
          </Button>
          <Button
            align="flex-start"
            onClick={() => {
              console.log("clicked");
              // setSteps((state)=>  state.run = true);
              // console.log(Steps);
            }}
          >
            <H2 textTransform="uppercase" spacing="0.1em">
              <Span bg="#35c5f3" color="#fff" weight="600" padding="0px 8px">
                Start Walkthrough
              </Span>
            </H2>
          </Button>
        </Content>
      </Section>
    </ThemeProvider>
  );
}

// Export Default
export default TutorialPage;
