import { useState, useLayoutEffect, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, Keyboard, StyleSheet, Modal } from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import { PlusCheck } from '../componentes/Iconos';

import { subirImagenFirebase, seleccionarYSubirImagen } from '../componentes/IngresoImagen.js';

import { collection, addDoc, getDoc, updateDoc, getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

const app = getApp();
const db = getFirestore(app);

export default function NuevaPlanta({ navigation }){

  const uid = getAuth(getApp()).currentUser?.uid;

  const [ newImg, setNewImg ] = useState('');
  const [ newNombre, setNewNombre ] = useState('');
  const [ newRegarPV, setNewRegarPV ] = useState('');
  const [ newRegarOI, setNewRegarOI ] = useState('');
  const [ newHorasSol, setNewHorasSol ] = useState('');
  const [ newDescripcion, setNewDescripcion ] = useState('');

  const [ alertaVis, setAlertaVis ] = useState({
    mensaje:'a',
    visible: false,
    estado: false,
  });

  const [ alerPriVer, setAlerPriVer ] = useState(false);
  const refTiempoAlerPriVer = useRef(null);

  const [ alerOtInv, setAlerOtInv] = useState(false);
  const refTiempoAlerOtInv = useRef(null);

  const [ activarCargando, setActivarCargando ] = useState(false);
  const [ btnAgPlanBloq, setBtnAgPlanBloq] = useState(false);

  const [alturaTeclado, setAlturaTeclado] = useState(0);

  const [usuario, setUsuario] = useState('');

  useEffect(()=>{
    const docUsuario = doc(db, 'Usuarios', uid);

    const unsubscribe = onSnapshot(docUsuario, (snap) => {
      if (snap.exists()){
        const data = snap.data();
        if (data){
          setUsuario(data);
        }
      }
    });

    return() => unsubscribe();
  },[uid]);

  const agregarPlanta = useCallback( async() => {
    if(btnAgPlanBloq){
      return;
    }
    setBtnAgPlanBloq(true);
    try {
      if( newImg && newNombre && newRegarPV && newRegarOI && newHorasSol && newDescripcion ) {
        setActivarCargando(true);
        const contadorRef = doc(db, 'Usuarios', uid);
        const resultado = await subirImagenFirebase(newImg, uid);
        if (!resultado) {
          setAlertaVis({
            mensaje: 'Error al subir la imagen',
            visible: true,
            estado: false,
          });
          setActivarCargando(false);
          return;
        }
        const { url, path } = resultado;
        try {
          const contadorDoc = await getDoc(contadorRef);

          if (!contadorDoc.exists()){
            //throw new Error('El contador no existe');
            setAlertaVis({
              mensaje: 'El contador no existe',
              visible: true,
              estado: false,
            });
            setActivarCargando(false);
            return;
          }
          const contadorActual = contadorDoc.data().contador;

          const nuevaPlantita = {
            imagen: url,
            imagenPath: path,
            nombre: newNombre,
            diasRiegoPV: parseInt(newRegarPV, 10),
            diasRiegoOI: parseInt(newRegarOI, 10),
            iniciada: false,
            regarPlanta: false,
            horasSol: newHorasSol,
            descripcion: newDescripcion,
            orden: contadorActual,
            diasSinRegar: 0,
          };

          await addDoc(collection(db, 'Usuarios', uid, 'Plantas'),nuevaPlantita);
          console.log('Planta guardada en Firestore correctamente');

          await updateDoc(contadorRef,{
            contador: contadorActual + 1,
          });
          console.log('Planta con contador creada correctamente');

        } catch (error){
          console.error('Error al crear la planta con el contador: ', error);
          setAlertaVis({
            mensaje: 'Error al agregar el contador a la planta',
            visible: true,
            estado: false,
          });
          setActivarCargando(false);
        }
        setActivarCargando(false);
        setAlertaVis({
          mensaje: 'Planta agregada',
          visible: true,
          estado: true,
        });
        setNewImg('');
        setNewNombre('');
        setNewRegarPV('');
        setNewRegarOI('');
        setNewHorasSol('');
        setNewDescripcion('');
      }else{
        setAlertaVis({
          mensaje: 'Faltan datos',
          visible: true,
          estado: false,
        });
        setActivarCargando(false);
      }
    } catch (error) {
      console.error('Error al crear la planta:', error);
      setAlertaVis({
        mensaje: 'Error al crear la planta',
        visible: true,
        estado: false,
      });
      setActivarCargando(false);
    } finally {
      setBtnAgPlanBloq(false);
    }
  },[btnAgPlanBloq, uid, newImg, newNombre, newRegarPV, newRegarOI, newHorasSol, newDescripcion]);

  const btnRightCrePlan = useCallback(() => (
    <Pressable
      onPress={agregarPlanta}
      disabled={btnAgPlanBloq}
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ opacity: btnAgPlanBloq ? 0.5 : 1 }}>
      <PlusCheck tamaño={32}/>
    </Pressable>
  ),[agregarPlanta, btnAgPlanBloq]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Crear Planta',
      headerRight: () => btnRightCrePlan(),
    });

  },[navigation, btnRightCrePlan]);

  const escogerImg = async () => {
    const resultado = await seleccionarYSubirImagen();
    if (!resultado){
      return;
    }
    setNewImg(resultado.uri);
  };

  const contPriVer = (value) => {
    const soloNum = value.replace(/[^0-9]/g, '');

    if ( value !== soloNum ){
      setAlerPriVer(true);

      if( refTiempoAlerPriVer.current ){
        clearTimeout(refTiempoAlerPriVer.current);
      }

      refTiempoAlerPriVer.current = setTimeout(() => {
        setAlerPriVer(false);
        refTiempoAlerPriVer.current = null;
      }, 2000);
    }

    setNewRegarPV(soloNum);
  };

  const contOtInv = (value) => {
    const soloNum = value.replace(/[^0-9]/g, '');

    if ( value !== soloNum ){
      setAlerOtInv(true);

      if( refTiempoAlerOtInv.current ){
        clearTimeout(refTiempoAlerOtInv.current);
      }

      refTiempoAlerOtInv.current = setTimeout(() => {
        setAlerOtInv(false);
        refTiempoAlerOtInv.current = null;
      }, 2000);
    }

    setNewRegarOI(soloNum);
  };

  useEffect(()=>{
    const mostrar = Keyboard.addListener('keyboardDidShow', (e) => {
      setAlturaTeclado(e.endCoordinates.height);
    });

    const ocultar = Keyboard.addListener('keyboardDidHide', () => {
      setAlturaTeclado(0);
    });

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  },[]);

  return(
    <View className="flex-1">
      <ScrollView
        className={`${!usuario.otInvBD ? 'bg-emerald-50' : 'bg-orange-50'}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle= {[styles.content, {paddingBottom: alturaTeclado}]}>
        <View className="px-4 pt-4 pb-8 h-full items-center">
          <View className="items-center pb-5">
            <Text className="text-gray-800 text-2xl font-normal">Subir Foto</Text>
            <Pressable className="bg-white h-64 w-96 items-center justify-center border-dotted border-gray-400 border-4" onPress={escogerImg}>
              {
                newImg ? (
                  <Image
                    className="h-full w-full"
                    source={ {uri: `${newImg}`} }
                    resizeMode="contain"/>
                ) : (
                  <View className="h-60 w-80 items-center justify-center">
                    <Text>Escoger foto</Text>
                  </View>
                )
              }
            </Pressable>
          </View>
          <Text className="text-gray-800 text-2xl font-normal">Nombre:</Text>
          <TextInput
            className="w-full h-16 px-2 text-gray-800 text-xl border bg-white border-gray-200 rounded-2xl"
            value={newNombre}
            onChangeText={(value) => setNewNombre(value)}/>
          <Text className="text-gray-800 text-2xl font-normal pt-2">Regar cada X días en:</Text>
          <View className="w-full flex-row flex-wrap justify-evenly">
            <View className="items-center">
              <Text className="text-gray-800 text-1xl font-normal">
                primavera/verano
              </Text>
              {
                alerPriVer && (
                  <Text className="absolute -top-1 left-5 bg-yellow-300 px-2 py-1 text-gray-800 rounded-md z-10">
                    Solo numeros
                  </Text>
                )
              }
              <TextInput
                className="w-40 h-16 text-gray-800 text-xl border bg-white border-gray-200 rounded-2xl"
                value={newRegarPV}
                maxLength={2}
                keyboardType="numeric"
                onChangeText={contPriVer}/>
            </View>
            <View className="items-center">
              <Text className="text-gray-800 text-1xl font-normal">
                otoño/invierno
              </Text>
              {
                alerOtInv && (
                  <Text className="absolute -top-1 left-5 bg-yellow-300 px-2 py-1 text-gray-800 rounded-md z-10">
                    Solo numeros
                  </Text>
                )
              }
              <TextInput
                className="w-40 h-16 text-gray-800 text-xl border bg-white border-gray-200 rounded-2xl"
                value={newRegarOI}
                maxLength={2}
                keyboardType="numeric"
                onChangeText={contOtInv}/>
            </View>
          </View>
          <View>
            <Text className="text-gray-800 text-2xl font-normal pt-2">Horas necesarias de sol:</Text>
          </View>
          <TextInput
            className="w-full h-16 px-2 text-gray-800 text-xl border bg-white border-gray-200 rounded-2xl"
            value={newHorasSol}
            onChangeText={(value) => setNewHorasSol(value)}/>
          <Text className="text-gray-800 text-2xl font-normal pt-2">Descripcion de la planta:</Text>
          <TextInput
            className="w-full h-32 px-2 text-gray-800 text-xl border bg-white border-gray-200 rounded-2xl"
            multiline={true}
            numberOfLines={5}
            value={newDescripcion}
            textAlignVertical="top"
            onChangeText={(value) => setNewDescripcion(value)}/>
        </View>
      </ScrollView>
      {
        activarCargando && (
          <Modal animationType="fade" transparent={true}>
            <View className={`absolute ${!usuario.otInvBD ? 'bg-cyan-900/40' : 'bg-amber-900/20'} h-full w-full items-center justify-center`}>
              <DropShadow style={styles.sombraContenedor}>
                <Text className={`text-3xl font-bold bg-white border ${!usuario.otInvBD ? 'border-emerald-600' : 'border-orange-600'} rounded-2xl px-4 py-2`}>CARGANDO...</Text>
              </DropShadow>
            </View>
          </Modal>
        )
      }
      {
        alertaVis.visible && (
          <Modal animationType="fade" transparent={true}>
            <View className={`absolute ${!usuario.otInvBD ? 'bg-cyan-900/40' : 'bg-amber-900/20'} h-full w-full items-center justify-center`}>
              <DropShadow style={styles.sombraContenedor}>
                <View className={`bg-white items-center border rounded-3xl p-2 ${ alertaVis.estado ? 'border-emerald-600' : 'border-red-500' }`}>
                  <View className={`rounded-2xl w-72 h-32 justify-center items-center ${ alertaVis.estado ? 'bg-emerald-50' : 'bg-red-50' }`}>
                    <Text className="text-xl font-bold text-gray-800 text-center">
                      {alertaVis.mensaje}
                    </Text>
                  </View>
                  <DropShadow style={ alertaVis.estado ? styles.sombraBtnCorrecto : styles.sombraBtnError }>
                    <Pressable
                      className={`px-3 mt-2 w-28 h-10 rounded-full justify-center items-center ${ alertaVis.estado ? 'bg-emerald-400' : 'bg-red-400' }`}
                      onPress={() => setAlertaVis({
                        ...alertaVis,
                        visible: false,
                      })}>
                      <Text className="text-gray-800 text-xl text-center">Aceptar</Text>
                    </Pressable>
                  </DropShadow>
                </View>
              </DropShadow>
            </View>
          </Modal>
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  sombraContenedor: {
    shadowColor: '#494949',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: {
      widht: 5,
      height: 5,
    },
  },
  sombraBtnCorrecto: {
    shadowColor: '#02eb76',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  sombraBtnError: {
    shadowColor: '#f87171',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
});
