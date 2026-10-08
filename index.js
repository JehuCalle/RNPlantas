/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { configureReanimatedLogger } from 'react-native-reanimated';

import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import notifee, { EventType } from '@notifee/react-native';

import { siguienteDiaRiego } from './componentes/SiguienteDiaRiego';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

const db = getFirestore();

notifee.onBackgroundEvent(async ({type, detail}) => {

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
      console.log('Notificación cerrada (app cerrada)');
    }

    if (actionId === 'regar'){
      await siguienteDiaRiego({
        db,
        uid,
        identificador: plantaId,
        diasOtoInv: usuario.otInvBD ? planta.diasRiegoOI : planta.diasRiegoPV ,
        numeroSigDiaRiego: planta.numeroSigDiaRiego,
      });
      console.log('Planta regada (app cerrada)');
    }
  }
});

//NOTIFICACION APP SEGUNDO PLANO Y CERRADA
setBackgroundMessageHandler(getMessaging(getApp()), async remoteMessage => {
  console.log('DESDE APP CERRADA');
  await notifee.createChannel({
    id: 'noti',
    name: 'notificaciones',
  });

  await notifee.displayNotification({
    title: remoteMessage.data?.title,
    body: remoteMessage.data?.body,
    data: remoteMessage.data,
    android: {
      channelId: 'noti',
      smallIcon: 'logo_noti',
      actions:[
        { title: 'Aceptar', pressAction: {id: 'aceptar'} },
        { title: 'Regar', pressAction: {id: 'regar'} },
      ],
    },
  });
});


// DESACTIVA LAS ADVERTENCIAS DE REANMATED
configureReanimatedLogger({
  level: 'error', // SOLO MUESTRA ERRORES, NO WARNINGS
  strict: false, // DESACTIVA EL STRICT MODE
});

AppRegistry.registerComponent(appName, () => App);
