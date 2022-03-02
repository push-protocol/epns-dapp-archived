import React from "react";

import styled, { css, useTheme } from 'styled-components';
import { ThemeProvider } from "styled-components";
import {Section, Content, Item, H2, Span} from 'components/SharedStyling';

function TutorialPage() {
  const themes = useTheme();

  // Render
  return (
    <ThemeProvider theme={themes}>
      <Section margin="20px">
        <Content padding="0px 20px 0px">
          <Item align="flex-start">
            <H2 textTransform="uppercase" spacing="0.1em">
              <Span bg="#35c5f3" color="#fff" weight="600" padding="0px 8px">Walkthrough</Span>
            </H2>
          </Item>
        </Content>
      </Section>
      </ThemeProvider>
  );
}

// Export Default
export default TutorialPage;
