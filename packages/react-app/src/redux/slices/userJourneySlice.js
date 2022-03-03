/**
 * This file helps us to maintain the state of the user journey tutorial
 */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  run: false,
  stepIndex: 0,
};

export const userJourneySlice = createSlice({
    name: "tutorial",
    initialState,
    reducers: {
        incrementStepIndex: (state) => {
            state.stepIndex += 1;
        },
        decrementStepIndex: (state) => {
          if (state.stepIndex > 0)
            state.stepIndex -= 1;
        },
        setRun: (state, action) => {
            state.run = action.payload;
        },
        setIndex: (state, action) => {
          state.index = action.payload;
        },
    }
});

export const {
    incrementStepIndex,
    decrementStepIndex,
    setRun,
    setIndex,
} = userJourneySlice.actions;

export default userJourneySlice.reducer;