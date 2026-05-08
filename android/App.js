// App.js
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import UploadScreen from './src/screens/UploadScreen';
import RingkasanScreen from './src/screens/RingkasanScreen';
import WhatsAppScreen from './src/screens/WhatsAppScreen';
import RiwayatScreen from './src/screens/RiwayatScreen';
import RiwayatDetailScreen from './src/screens/RiwayatDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#1565C0' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: true,
};

function UploadStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'SamSuJabar' }} />
      <Stack.Screen name="Ringkasan" component={RingkasanScreen} options={{ title: 'Ringkasan Laporan' }} />
      <Stack.Screen name="WhatsApp" component={WhatsAppScreen} options={{ title: 'Laporan WhatsApp' }} />
    </Stack.Navigator>
  );
}

function RiwayatStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="RiwayatList" component={RiwayatScreen} options={{ title: 'Riwayat Laporan' }} />
      <Stack.Screen name="RiwayatDetail" component={RiwayatDetailScreen} options={{ title: 'Detail Laporan' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#1565C0',
            tabBarInactiveTintColor: '#9E9E9E',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              height: 60,
              paddingBottom: 8,
              paddingTop: 4,
            },
            tabBarIcon: ({ focused }) => {
              const icons = { UploadTab: '📄', RiwayatTab: '📋' };
              return (
                <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
                  {icons[route.name]}
                </Text>
              );
            },
          })}
        >
          <Tab.Screen
            name="UploadTab"
            component={UploadStack}
            options={{ title: 'Upload' }}
          />
          <Tab.Screen
            name="RiwayatTab"
            component={RiwayatStack}
            options={{ title: 'Riwayat' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

