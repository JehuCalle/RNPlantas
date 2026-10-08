import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import _layout from './app/_layout.jsx';
import Login from './app/Login.jsx';
import Main from './app/Main.jsx';
import NuevaPlanta from './app/NuevaPlanta.jsx';
import DetallesPlantita from './app/DetallesPlantita.jsx';
import { siguienteDiaRiego } from './componentes/SiguienteDiaRiego';

import { View, Text, Platform, PermissionsAndroid, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getMessaging, onMessage, onNotificationOpenedApp, getInitialNotification, onTokenRefresh, getToken } from '@react-native-firebase/messaging';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { doc, getDoc, getFirestore, arrayUnion, updateDoc, onSnapshot } from '@react-native-firebase/firestore';
import notifee, { EventType, AuthorizationStatus as NotifeeStatus } from '@notifee/react-native';

import BootSplash from 'react-native-bootsplash';

import './global.css';

const Stack = createStackNavigator();

const Tab = createBottomTabNavigator();

const app = getApp();
const db = getFirestore(app);
const messaging = getMessaging(app);


function BarraInferiorMain({estilo}) {
  return(
    <Tab.Navigator
      screenOptions={estilo}>
      {/*APARTADOS QUE TENDRÁN LA BARRA INFERIOR*/}
      <Tab.Screen name="MainTab" component={Main}/>
    </Tab.Navigator>
  );
}

function BarraInferiorNuPl(estilo) {
  return(
    <Tab.Navigator
      screenOptions={estilo}>
      <Tab.Screen name="NuevaPlantaTab" component={NuevaPlanta}/>
    </Tab.Navigator>
  );
}

export default function App(){
  const [ datosUsuario, setDatosUsuario ] = useState('');

  const estiloBarrasGlobales = {
    headerShown: true,
    headerStyle: {
      backgroundColor: '#ECFDF5',
      elevation: 0,
      borderBottomWidth: 0,
    },
    headerTintColor: 'black',
    headerTitleAlign: 'center',
    headerTitleContainerStyle: {
      left: 0,
      right: 0,
    },
    headerRightContainerStyle: {
      paddingRight:10,
    },
    headerLeftContainerStyle: {
      paddingLeft:10,
    },
    tabBarStyle: {
      backgroundColor: '#ffffff',
      elevation: 0,
      borderTopWidth: 0,
      height: 65,
      paddingBottom: 0,
      borderRadius: 20,

      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
  };

  const temaFondoBarraInf = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: !datosUsuario.otInvBD ? '#ECFDF5' : '#fff7ed',
    },
  };

  useEffect(()=>{
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS){
        const { pressAction, notification } = detail;
        const actionId = pressAction?.id;
        const notificationId = notification?.id;

        const plantaId = notification?.data?.plantaId;
        const uid = notification?.data?.uid;
        //usuario
        const usuarioRef = doc(db, 'Usuarios', uid);
        const usuarioSnap = await getDoc(usuarioRef);
        const usuario = usuarioSnap.data();
        //planta
        const plantaRef = doc(db, 'Usuarios', uid, 'Plantas', plantaId);
        const plantaSnap = await getDoc(plantaRef);
        const planta = plantaSnap.data();

        if (actionId === 'aceptar' && notificationId){
          await notifee.cancelNotification(notificationId);
          console.log('Notificacion cerrada (app abierta)');
        }

        if (actionId === 'regar'){
          await siguienteDiaRiego({
            db,
            uid,
            identificador: plantaId,
            diasOtoInv: usuario.otInvBD ? planta.diasRiegoOI : planta.diasRiegoPV ,
            numeroSigDiaRiego: planta.numeroSigDiaRiego,
          });
          console.log('Planta regada (app abierta)');
        }
      }
    });
  },[]);

  //PERMISO ALERTAS GLOBO
  useEffect(()=>{
    async function inicializarNotificaciones(){
      try {
        await notifee.createChannel({
          id: 'noti',
          name: 'notificaciones',
        });
        console.log('Canal de Notifee creado.');

        //Timeout PARA QUE LA NOTIFICACION NO HAGA CONFLICO CON EL ARRANQUE DE LA APP
        setTimeout( async ()=>{
          if (Platform.OS === 'android' && Platform.Version >= 33){
            console.log('Solicitando permiso de notificaciones automaticamente...');

            const concedido = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (concedido === PermissionsAndroid.RESULTS.GRANTED){
              console.log('Permiso de notificaciones otorgada al iniciar');
            } else {
              console.log('Permiso de notificaciones rechazada por el usuario');
            }
          } else {
            await messaging(getApp()).requestPermission();
            await notifee.requestPermission();
          }
        }, 1000);
      } catch (error) {
        console.error('Error al iniciar las notificaciones', error);
      }
    }

    inicializarNotificaciones();

    //NOTIFICACION APP ABIERTA
    const unsubscribeOnMessage = onMessage(messaging ,async remoteMessage => {
      console.log('DESDE APP ABIERTA');
      if (remoteMessage.notification){
        return;
      }

      await notifee.displayNotification({
        title: remoteMessage.data.title,
        body: remoteMessage.data.body,
        data: remoteMessage.data,
        android: {
          channelId: 'noti',
          smallIcon: 'logo_noti', //icono pequeño
          actions: [
            { title: 'Aceptar', pressAction: {id: 'aceptar'} },
            { title: 'Regar', pressAction: {id: 'regar'}},
          ],
        },
      });
    });

    onNotificationOpenedApp(getMessaging(getApp()), remoteMessage => {
      console.log('Opened from background state: ', remoteMessage.notification);
    });
    getInitialNotification(getMessaging(getApp())).then(remoteMessage => {
      console.log('Open from quit state: ', remoteMessage?.notification);
    });

    return unsubscribeOnMessage;
  },[]);

  const [ user, setUser ] = useState(null);

  useEffect(()=>{
    let unsubscribeSnapshot = null;
    const unsubscribe = onAuthStateChanged(getAuth(), async (usuario) => {
      if (usuario) {
        setUser(usuario);
        const uid = usuario.uid;
        const refDoc = doc(db, 'Usuarios', uid);
        unsubscribeSnapshot = onSnapshot(refDoc, async (snap) => {
          if (snap.exists()){
            const datos = snap.data();
            if (datos) {
              setDatosUsuario(datos);
              await getFcmToken(usuario.uid);
              BootSplash.hide({ fade: true });
            }
          }else{
            BootSplash.hide({ fade: true });
          }
        });
      }else {
        if (unsubscribeSnapshot){
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setUser(null);
        setDatosUsuario({});
        console.log('Usuario no logeado');
        BootSplash.hide({ fade: true });
      }
    });
    return () => {
      unsubscribe();
      if (unsubscribeSnapshot){
        unsubscribeSnapshot();
      }
    };
  },[]);

  useEffect(() => {
    const unsubscribe =  onTokenRefresh(getMessaging(getApp()), async (token) => {
      const usuario = getAuth().currentUser;

      if (usuario) {
        await updateDoc(doc(db, 'Usuarios', usuario.uid),{
          tokens: arrayUnion(token),
        });

        console.log('Token actualizado');
      }
    });

    return unsubscribe;
  },[]);

  const getFcmToken = async (uid) => {
    try{
      const token = await getToken(getMessaging(getApp()));
      if(token){
        console.log('Fcm Token', token);

        await updateDoc(doc(db, 'Usuarios', uid),{
          tokens: arrayUnion(token),
        });

      }else{
        console.log('Failed to get Fcm token');
      }
    }catch(error){
      //SI DA ESTE ERROR, SE SOLUCIONA REINICIANDO EL CELULAR
      console.error('Error fetching FCM token: ', error);
    }
  };



  return(
    <NavigationContainer theme={temaFondoBarraInf}>
      <View style={styles.contenedor}>
        <_layout>
          {!user  ? (
            <Stack.Navigator
              screenOptions={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#ECFDF5',
                  elevation: 0,
                  borderBottomWidth: 0,
                },
                headerTintColor: 'black',
                headerTitleAlign: 'center',
                headerRightContainerStyle: {
                  paddingRight:10,
                },
                headerLeftContainerStyle: {
                  paddingLeft:10,
                },
                }}>
              <Stack.Screen name="Login" component={Login}/>
            </Stack.Navigator>
          ) : (
            <Stack.Navigator
              screenOptions={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: !datosUsuario.otInvBD ? '#ECFDF5' : '#fff7ed',
                  elevation: 0,
                  borderBottomWidth: 0,
                },
                headerTintColor: 'black',
                headerTitleAlign: 'center',
                headerRightContainerStyle: {
                  paddingRight:20,
                },
                headerLeftContainerStyle: {
                  paddingLeft:10,
                },
                }}>
              <Stack.Screen
                name="Main"
                headerShown={false}
                options={{
                  title: datosUsuario.nombre || 'Cargando..',
                }}>
                {(props) => <BarraInferiorMain {...props} estilo={estiloBarrasGlobales}/>}
              </Stack.Screen>
              <Stack.Screen
                name="NuevaPlanta"
                component={NuevaPlanta}/>
              <Stack.Screen
                name="DetallesPlantita"
                component={DetallesPlantita}/>
            </Stack.Navigator>
          )}
        </_layout>
      </View>
    </NavigationContainer>
  );

}
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
})