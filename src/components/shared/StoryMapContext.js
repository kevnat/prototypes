import { createContext, useContext } from 'react';

export const StoryMapContext = createContext({
  selectedStory: null,
  setSelectedStory: () => {},
});

export const useStoryMap = () => useContext(StoryMapContext);
