import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';

export default function RootLayout() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#3B44AC',
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: t('menu.home'),
          drawerLabel: t('menu.home'),
        }}
      />
      <Drawer.Screen
        name="add-color"
        options={{
          title: t('inventory.add_color_title'),
          drawerLabel: t('inventory.add_color_title'),
        }}
      />
      <Drawer.Screen
        name="camera"
        options={{
        title: t('camera.title'),
        drawerLabel: t('camera.title'),
        }}
      />
      <Drawer.Screen
        name="brands"
        options={{
          title: t('menu.brands'),
          drawerLabel: t('menu.brands'),
        }}
      />
      <Drawer.Screen
        name="color-detail"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          title: t('color_detail.title'),
        }}
      />
      <Drawer.Screen
        name="dev-seed"
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Dev Tools',
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          drawerLabel: t('settings.title'),
        }}
      />
    </Drawer>
  );
}