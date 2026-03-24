import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';

// small wrapper component
const Root = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

// Register the wrapper instead of the raw App
registerRootComponent(Root);