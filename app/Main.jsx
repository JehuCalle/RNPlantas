import { useState, useEffect, useLayoutEffect, useCallback  } from 'react';
import { View, ScrollView, Pressable, Text, Image, Modal, StyleSheet, ActivityIndicator } from 'react-native';

import { PlantasCard } from '../componentes/PlantasCard.jsx';

import { SnowOutline, Sunny, Logout, Chat, Ajustes, Brote } from '../componentes/Iconos.jsx';

import DropShadow from 'react-native-drop-shadow';

import { collection, getFirestore, onSnapshot, query , orderBy, doc, updateDoc } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';

const app = getApp();
const db = getFirestore(app);

export default function Main({ navigation }){

  const [ listaPlantas, setListaPlantas ] = useState([]);

  const [ cargado, setCargado ] = useState(false);

  const [ otInv, setOtInv ] = useState();

  const uid = getAuth(getApp()).currentUser?.uid;

  const allDatos = doc(db, 'Usuarios', uid);
  const [ datosUsuario, setDatosUsario ] = useState('');

  const [ mensajeCargando, setMensajeCargando ] = useState('Cargando...');

  const [ tutorial, setTutorial ] = useState(1);

  //PARA SABER SI ES OTOÑO/INVIERNO AL INICIAR EL APP
  useEffect(()=>{
    const unsubscribe = onSnapshot(allDatos, (documento) =>{
      if (documento.exists()){
        setOtInv(documento.data().otInvBD);
      }
    });
    return() => unsubscribe();
  },[allDatos]);

  const cambiarEstadoOtInv = useCallback(async () => {
    try {
      await updateDoc(allDatos, {
        otInvBD: !otInv,
      });
    } catch (error) {
      console.error('No se pudo obtener si es o no Otoño o invierno');
    }
  }, [otInv, allDatos]);

  const cerrarSesion = async () => {
    try {
      await signOut(getAuth(app));
      console.log('Se ha cerrado la sesión');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };


  const barraInferior = useCallback(() => (
    <View className={`flex-row items-center justify-between px-8 rounded-3xl border w-full h-full ${ !datosUsuario.otInvBD ? 'bg-emerald-200 border-emerald-600' : 'bg-orange-300/70 border-orange-600' }`}>
      <Pressable onPress={cerrarSesion}>
        <Logout tamaño={32} color={ !datosUsuario.otInvBD ? '#059669' : '#d97706' }/>
      </Pressable>

      <Pressable onPress={() => console.log('Futuro apartado de chats')}>
        <Chat tamaño={29} color={ !datosUsuario.otInvBD ? '#94ddbb' : '#e7bf91' }/>
      </Pressable>

      <DropShadow style={styles.nuevaPlanta(!datosUsuario.otInvBD)}>
        <Pressable
          className={`top-[-24] h-[60] w-[60] items-center justify-center rounded-full border-t border-x ${ !datosUsuario.otInvBD ? 'bg-emerald-400 border-emerald-600' : 'bg-amber-500  border-orange-600' }`}
          onPress={() => navigation.navigate('NuevaPlanta')}>
          <Brote tamaño={32} color="#ffffff"/>
        </Pressable>
      </DropShadow>

      <Pressable onPress={() => console.log(cargado)}>
        <Ajustes tamaño={32} color={ !datosUsuario.otInvBD ? '#94ddbb' : '#e7bf91' }/>
      </Pressable>

      <Pressable className="h-[33] w-[31]" onPress={() => cambiarEstadoOtInv()}>
        { otInv ? (
          <View className="items-center justify-center">
            <SnowOutline tamaño={22} color="#d97706"/>
            <Text className="text-amber-800 w-16 text-center pb-1">Ot/Inv</Text>
          </View>
          ) : (
          <View className="items-center justify-center">
            <Sunny tamaño={22} color="#059669"/>
            <Text className="text-emerald-600 w-16 text-center pb-1">Pri/Ve</Text>
          </View>
          )
        }
      </Pressable>

    </View>
  ),[navigation, cambiarEstadoOtInv, otInv, datosUsuario, cargado]);

  useLayoutEffect(() => {

    //BARRA SUPERIOR
    navigation.setOptions({
      headerShown: false,
    });

    //BARRA INFERIOR
    navigation.setOptions({
      tabBarButton: () => barraInferior(),
    });
  },[navigation, barraInferior]);

  //PARA OBTENER LAS PLANTAS AL INICIAR LA APP
  useEffect(()=>{

    const q = query(collection(db, 'Usuarios', uid, 'Plantas'), orderBy('orden'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const plantitas = querySnapshot.docs.map((documento) => ({
        id: documento.id,
          ...documento.data(),
      }));
      setListaPlantas(plantitas);
      setCargado(true);
    }, (error) => {
      console.log(error);
      setCargado(false);
      setMensajeCargando('Error al cargar las plantas 🥀');
    });

    return () => unsubscribe();
  },[uid]);

  useEffect(()=>{
    const refDoc = doc(db, 'Usuarios', uid);

    const unsubscribe = onSnapshot(refDoc, (snap) => {
      if (snap.exists()){
        const data = snap.data();
        if (data && data.nombre){
          setDatosUsario(data);
        }
      }
    });

    return () => unsubscribe();
  },[uid]);

  //TUTORIAL
  const sumContTuto = () => {
    if (tutorial > 0 && tutorial !== 6){
      setTutorial(tutorial + 1);
    }
  };
  const resContTuto = () => {
    if (tutorial <= 6 && tutorial !== 1){
      setTutorial(tutorial - 1);
    }
  };
  const cerrarTuto = async () => {
    try {
      await updateDoc(allDatos, {
        tutorial: false,
      });
    } catch (error) {
      console.error('No se pudo cerrar el tutorial');
    }
  };

  if ( datosUsuario.tutorial === true ) {
    return(
      <Modal animationType="fade" transparent={true}>
        <View className="h-full w-full bg-black/30 items-center justify-end">
          <View className="absolute bottom-80 right-4">
            <Text className="text-center">{tutorial}/6</Text>
            <View className="flex-row">
              <Pressable
                className="h-11 w-20 bg-red-100 items-center justify-center border-l border-t rounded-tl-3xl"
                onPress={() => resContTuto()}
                >
                <View>
                  <Text className="text-center">Ant</Text>
                </View>
              </Pressable>
              <Pressable
                className="h-11 w-20 bg-red-100 items-center justify-center border-r border-l border-t rounded-tr-3xl"
                onPress={() => sumContTuto()}
                >
                <View>
                  <Text className="text-center">Sig</Text>
                </View>
              </Pressable>
            </View>
            <Pressable
              className="h-8 bg-white items-center justify-center border rounded-b-3xl"
              onPress={() => cerrarTuto()}>
              <Text className="text-center">Cerrar</Text>
            </Pressable>
          </View>
          <View className="h-[91%] w-full items-center">
            <View className="w-96" pointerEvents="none">
              <PlantasCard
                nombre={'Planta de ejemplo'}
                otInv={otInv}
                diasRiegoPV={5}
                diasRiegoOI={2}
                nombreDiaActual={'lunes'}
                nombreDiaSiguiente={'jueves'}
                numeroDiaRiego={1}
                numeroSigDiaRiego={4}
                horasSol={6}
                descripcion={'Descripcion de ejemplo para la planta de ejemplo'}
                iniciada={false}
                regarPlanta={true}
                diasSinRegar={0}/>
            </View>
            <View className="w-96">
            {
              tutorial === 1 ? (
                <View className="w-40 items-center self-start">
                  <Text className="text-2xl text-center">☝️</Text>
                  <Text className="text-base text-center font-bold">presiona "Iniciar Riego" para comenzár a contar los dias para regar la planta</Text>
                </View>
              ) : tutorial === 2 ? (
                <View className="w-40 items-center self-end">
                  <Text className="text-2xl text-center">☝️</Text>
                  <Text className="text-base text-center font-bold">Cuando sea el dia de riego aparecerá el boton, presiona "Regar" para regar la planta</Text>
                </View>
              ) : tutorial === 3 ? (
                <View className="w-96 items-center self-center">
                  <Text className="text-2xl text-center">☝️</Text>
                  <Text className="text-base text-center font-bold">Puedes presionar la tarjeta de la planta para ver sus detalles, también dentro podrás editar o borrar la planta</Text>
                </View>
              ) : null
            }
            </View>
            <View className="h-[63.5%] w-96 justify-end">
              {
                tutorial === 4 ? (
                  <View className="w-32 self-start">
                    <Text className="text-base text-center font-bold">Puedes cerrar sesión con este botón</Text>
                    <Text className="text-2xl text-start">👇</Text>
                  </View>
                ) : tutorial === 5 ? (
                  <View className="w-36 self-end">
                    <Text className="text-base text-center font-bold">Puedes cambiar la estación para alternar los dias de riego</Text>
                    <Text className="text-2xl text-right">👇</Text>
                  </View>
                ) : tutorial === 6 ? (
                  <View className="w-96 self-center pb-6 bg-re">
                    <Text className="text-base text-center font-bold">Presiona este botón cada vez que quieras agregar una nueva planta</Text>
                    <Text className="text-2xl text-center">👇</Text>
                  </View>
                ) : null
              }
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if ( !cargado ) {
    return(
      <View className={`items-center align-content-center ${ !datosUsuario.otInvBD ? 'bg-emerald-50' : 'bg-orange-50' } flex-1 p-3`}>
        <View className={`border-x-2 ${ !datosUsuario.otInvBD ? 'bg-cyan-900 border-emerald-200' : 'bg-amber-900 border-orange-200'} rounded-lg p-2`}>
          <ActivityIndicator size="large" color={ !datosUsuario.otInvBD ? '#d1fae5' : '#ffedd5' }/>
          <Text className={`text-xl ${ !datosUsuario.otInvBD ? 'text-emerald-100' : 'text-orange-100' } font-medium`}>{mensajeCargando}</Text>
        </View>
      </View>
    );
  } else if ( listaPlantas.length === 0 ) {
    return(
      <View className={`items-center align-content-center ${ !datosUsuario.otInvBD ? 'bg-emerald-50' : 'bg-orange-50' } flex-1 p-3`}>
        <View className={`border-y-2 ${ !datosUsuario.otInvBD ? 'bg-cyan-900 border-emerald-200' : 'bg-amber-900 border-orange-200'} rounded-lg p-2 items-center`}>
          <View className="h-40 w-40">
            <Image className="h-full w-full" source={require('../assets/menu/vacio.png')}/>
          </View>
          <Text className={`text-xl ${ !datosUsuario.otInvBD ? 'text-emerald-100' : 'text-orange-100' } font-medium`}>No hay plantas</Text>
        </View>
      </View>
    );
  } else if ( listaPlantas.length !== 0 && cargado ) {
    return(
      <View className="items-center align-content-center">
        <View className="items-center content-center justify-center w-full">
          <ScrollView className={`w-full ${ !datosUsuario.otInvBD ? 'bg-emerald-50' : 'bg-orange-50' }`}>
            <View className="gap-4 p-6">
              {
                listaPlantas.map((planta) =>
                  <PlantasCard
                  key={planta.id}
                  id={planta.id}
                  imagen={planta.imagen}
                  nombre={planta.nombre}
                  otInv={otInv}
                  diasRiegoPV={planta.diasRiegoPV}
                  diasRiegoOI={planta.diasRiegoOI}
                  nombreDiaActual={planta.nombreDiaActual}
                  nombreDiaSiguiente={planta.nombreDiaSiguiente}
                  numeroDiaRiego={planta.numeroDiaRiego}
                  numeroSigDiaRiego={planta.numeroSigDiaRiego}
                  horasSol={planta.horasSol}
                  descripcion={planta.descripcion}
                  iniciada={planta.iniciada}
                  regarPlanta={planta.regarPlanta}
                  diasSinRegar={planta.diasSinRegar}
                  navigation={navigation}/>
                )
              }
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  nuevaPlanta: (datosUsuario) => ({
    shadowColor: datosUsuario ? '#24976d' : '#bb7600',
    shadowOpacity: 1,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  }),
});
