import { createContext, useContext } from 'react';

// Lightweight tab-navigation context — replaces react-navigation's useNavigation
// for in-app tab switching. Kept in its own file to avoid a circular import
// between TabNavigator (provider) and the screens (consumers).
export const TabNavContext = createContext({ activeTab: 'Özet', navigate: () => {} });
export const useTabNavigation = () => useContext(TabNavContext);
