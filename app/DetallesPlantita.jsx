import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image, Keyboard, StyleSheet, Modal } from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import { PlusVerticalP, Edit, Delete, Cancel } from '../componentes/Iconos.jsx';

import { seleccionarYSubirImagen, subirImagenFirebase } from '../componentes/IngresoImagen.js';

import { getFirestore, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from '@react-native-firebase/firestore';
import { getStorage, ref, deleteObject } from '@react-native-firebase/storage';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

const app = getApp();
const db = getFirestore(app);

export default function DetallesPlantita({ navigation, route }){

  const uid = getAuth(getApp()).currentUser?.uid;

  const { id, otInvBDinterno } = route.params;

  const [ titulo, setTitulo ] = useState('');

  const [ planta, setPlanta ] = useState(null);
  const [ usuario, setUsuario ] = useState('');

  const [ opcionesVis, setOpcionesVis ] = useState(false);
  const [ opcionesAct, setOpcionesAct ] = useState(false);

  const [ editarHover, setEditarHover ] = useState(false);
  const [ eliminarHover, setEliminarHover ] = useState(false);
  const [ cancelarHover, SetCancelarHover ] = useState(false);

  const [ direccionImg, setDireccionImg ] = useState('');

  const [ editarVis, setEditarVis ] = useState(false);
  const [ confEliminarVis, setConfEliminarVis ] = useState(false);
  const [ plantaActualizada, setPlantaActualizada ] = useState(false);

  const [ editNombre, setEditNombre ] = useState('');
  const [ editRegarPV, setEditRegarPV ] = useState('');
  const [ editRegarOI, setEditRegarOI ] = useState('');
  const [ editHorasSol, setEditHorasSol ] = useState('');
  const [ editDescripcion, setEditDescripcion ] = useState('');

  const [ imgOldTimeStamp, setImOldTimeStamp ] = useState(Date.now());
  const [ imgNewTimeStamp, setImgNewTimeStamp ] = useState(null);

  const refAlerPriVer = useRef(null);
  const [ alerPriVer ,setAlerPriVer ] = useState(false);

  const refAlerOtInv = useRef(null);
  const [ alerOtInv, setAlerOtInv ] = useState(false);

  const refTiempoAlerFal = useRef(null);
  const [ alerta, setAlerta ] = useState({
    mensaje: '',
    visible: false,
    estado: false,
  });

  const [ cargado, setCargado ] = useState(false);

  const [actualizada, setActualizada] = useState(false);

  const [ alturaTeclado, setLaturaTeclado ] = useState(100);

  const btnRightId = useCallback(() => (
    <Pressable disabled={opcionesAct} onPress={() => setOpcionesVis(!opcionesVis)}>
      <PlusVerticalP tamaño={32} color={ planta ? (!usuario.otInvBD ? '#059669' : '#d97706') : 'transparent' }/>
    </Pressable>
  ),[opcionesAct, opcionesVis, planta, usuario]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: titulo.length > 17 ? `${titulo.slice(0, 17)}...` : titulo,
      headerRight: () => btnRightId(),
    });
  },[navigation, titulo, btnRightId]);

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

    return () => unsubscribe();
  },[uid]);

  useEffect(()=>{
    const obtenerDatosPlanta = async () => {
      try {
        const docRef = doc(db, 'Usuarios', uid, 'Plantas', id);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
          const datos = docSnap.data();
          if (datos){
            setPlanta(datos);
            setTitulo(datos.nombre);
            setCargado(true);
          }
        }else{
          console.warn('No se encontro la planta con ese ID');
          setCargado(false);
          setAlerta({
            mensaje:'No se encontró la planta',
            visible: true,
            estado: false,
          });
        }
      }catch (error){
        console.error('Error al obtener la planta: ', error);
        setCargado(false);
        setAlerta({
          mensaje:'Error al obtener la planta',
          visible: true,
          estado: false,
        });
      }
    };
    obtenerDatosPlanta();
  },[uid, id, actualizada]);

  useEffect(()=>{
    if( editarVis === true ){
      setOpcionesAct(true);
    }else if ( editarVis === false ){
      setOpcionesAct(false);
    }
  },[editarVis]);

  const desactivarHover = () => {
    setEditarHover(false);
    setEliminarHover(false);
    SetCancelarHover(false);
  };

  const editarPlanta = () => {
    setEditarVis(true);
    setOpcionesVis(false);
    desactivarHover();

    setEditNombre(planta.nombre);
    setEditRegarPV(planta.diasRiegoPV);
    setEditRegarOI(planta.diasRiegoOI);
    setDireccionImg(planta.imagen);
    setEditHorasSol(planta.horasSol);
    setEditDescripcion(planta.descripcion);
  };



  const guardarEditPlanta = async () => {
    if ( editNombre && direccionImg && editRegarPV && editRegarOI && editHorasSol && editDescripcion){
      setEditarVis(!editarVis);
      setPlantaActualizada(true);
      const docRef = doc(db, 'Usuarios', uid, 'Plantas', id);

      const resultadoImg = await subirImagenFirebase(direccionImg, uid);

      let plantaEdit = {
        nombre: editNombre,
        diasRiegoPV: editRegarPV,
        diasRiegoOI: editRegarOI,
        horasSol: editHorasSol,
        descripcion: editDescripcion,
      };

      if (resultadoImg){
        const { url, path } = resultadoImg;
        try {
          const storage = getStorage();
          const referencia = ref(storage, planta.imagenPath);
          await deleteObject(referencia);
          console.log('imagen antigua borrada');
        }catch (error) {
          console.log('No se ha podido borrar la imagen anterior',error);
          setPlantaActualizada(false);
          setAlerta({
            mensaje: 'No se ha podido borrar la imagen anterior',
            visible: true,
            estado: false,
          });
        }
          plantaEdit.imagen = url;
          plantaEdit.imagenPath = path;
      }

      try{
        await updateDoc(docRef, plantaEdit);
        setTitulo(planta.nombre);
        setActualizada(prev => !prev);
        setPlantaActualizada(false);
        console.log('Planta actualizada correctamente');
        setAlerta({
          mensaje:'Planta actualizada correctamente',
          visible: true,
          estado: true,
        });
      } catch (error){
        console.log('Error al actualizar la planta: ', error);
        setPlantaActualizada(false);
        setAlerta({
          mensaje:'Error al actualizar la planta',
          visible: true,
          estado: false,
        });
      }

    }else{
      setPlantaActualizada(false);
      setAlerta({
        mensaje:'No se pueden dejar campos vacios',
        visible: true,
        estado: false,
      });
      console.log(editNombre, direccionImg, editRegarPV, editRegarOI, editHorasSol, editDescripcion);
      if(refTiempoAlerFal.current){
        clearTimeout(refTiempoAlerFal.current);
      }

      refTiempoAlerFal.current = setTimeout(() => {
        refTiempoAlerFal.current = null;
      }, 2000);
    }
  };

  const escogerImg = async () => {
    const nuevaRutaImg = await seleccionarYSubirImagen();
    if (!nuevaRutaImg){
      return;
    }

    setDireccionImg(nuevaRutaImg.uri);
    setImgNewTimeStamp(Date.now());
  };

  const contPriVer = (value) => {
    const soloNum = value.replace(/[^0-9]/g, '');

    if(value !== soloNum){
      setAlerPriVer(true);

      if(refAlerPriVer.current){
        clearTimeout(refAlerPriVer.current);
      }
      refAlerPriVer.current = setTimeout(() => {
        setAlerPriVer(false);
        refAlerPriVer.current = null;
      }, 2000);
    }
    setEditRegarPV(soloNum);
  };

  const contOtInv = (value) => {
    const soloNum = value.replace(/[^0-9]/g, '');

    if (value !== soloNum){
      setAlerOtInv(true);

      if(refAlerOtInv.current){
        clearTimeout(refAlerOtInv.current);
      }

      refAlerOtInv.current = setTimeout(() => {
        setAlerOtInv(false);
        refAlerOtInv.current = null;
      }, 2000);
    }
    setEditRegarOI(soloNum);
  };

  const contHorasSol = (value) => {
    const soloNum = value.replace(/[^0-9]/g, '');
    setEditHorasSol(soloNum);
  };

  const eliminarPlanta = async () => {
    const docRef = doc(db, 'Usuarios', uid, 'Plantas', id);

    try {
      const storage = getStorage();
      const referencia = ref(storage, planta.imagenPath);
      await deleteObject(referencia);
      console.log('Imagen borrada');
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      setConfEliminarVis(false);
      setAlerta({
        mensaje:'Error al eliminar la imagen',
        visible: true,
        estado: false,
      });

      if (error.code === 'storage/object-not-found'){
        console.log('La imagen no existe');
        setConfEliminarVis(false);
        setAlerta({
          mensaje:'La imagen no existe',
          visible: true,
          estado: false,
        });
      }
    }
    try{
      await deleteDoc(docRef);
      console.log('Planta eliminada correctamente ');
      setConfEliminarVis(false);
      setAlerta({
        mensaje:'Planta eliminada correctamente 🥀',
        visible: true,
        estado: true,
      });
    }catch (error){
      console.error('Error al eliminar la planta:', error);
      setConfEliminarVis(false);
      setAlerta({
        mensaje:'Error al eliminar la planta:',
        visible: true,
        estado: false,
      });
    }
  };


  useEffect(()=>{
    const mostrar = Keyboard.addListener('keyboardDidShow', (e) => {
      setLaturaTeclado(e.endCoordinates.height);
    });

    const ocultar = Keyboard.addListener('keyboardDidHide', () => {
      setLaturaTeclado(0);
    });

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  },[]);

  if (cargado) {
    return(
      <View className="flex-1">
        <View className={`h-full ${ !usuario.otInvBD ? 'bg-emerald-50' : 'bg-orange-50' }`}>
          <View className="items-center p-2 gap-5">
            {
              planta.imagen ? (
                <View className="h-64 w-96">
                  <Image
                    source={planta.imagen ? { uri: `${planta.imagen}?timestamp=${imgOldTimeStamp}` } : require('../assets/menu/NoHaceNada.png') }
                    className="h-full w-full"
                    resizeMode="contain"/>
                </View>
              ) : (
                <View className="h-64 w-72 items-center justify-center bg-red-400">
                  <Text>Error al cargar la imagen 🥀</Text>
                </View>
              )
            }
            <Text className="text-gray-800 text-3xl font-bold w-full text-center">{planta.nombre}</Text>
            <Text className="text-gray-800 text-2xl">
              Primavera/Verano: Cada <Text className="font-bold">{planta.diasRiegoPV}</Text> Día/s
            </Text>
            <Text className="text-gray-800 text-2xl">
              Otoño/Invierno: Cada <Text className="font-bold">{planta.diasRiegoOI}</Text> Día/s
            </Text>
            <Text className="text-gray-800 text-2xl text-center">
              Horas necesarias de sol: <Text className="font-bold">{planta.horasSol}</Text>
            </Text>
            <Text className="text-gray-800 text-1xl">{planta.descripcion}</Text>
          </View>

          {opcionesVis && (
            <View className={`absolute h-48 w-full bottom-0 ${ !usuario.otInvBD ? 'bg-emerald-200 border-emerald-600' : 'bg-orange-200 border-orange-600' } rounded-t-xl border`}>

              <Pressable
                className={`flex-row items-center h-16 pl-2 ${ !usuario.otInvBD ? 'border-emerald-600' : 'border-orange-600' } border-b rounded-t-xl ${editarHover ? (!usuario.otInvBD ? 'bg-emerald-300' : ' bg-orange-300') : ''} `}
                onPress={() => editarPlanta()}
                onPressIn={() => setEditarHover(true)}
                onPressOut={() => setEditarHover(false)}>
                <Edit tamaño={32} color={ !usuario.otInvBD ? '#059669' : '#d97706' }/>
                <Text className={`${!usuario.otInvBD ? 'text-emerald-600' : 'text-amber-800'} self-center text-2xl ml-2`}>Editar</Text>
              </Pressable>

              <Pressable
                className={`flex-row items-center h-16 pl-2 ${eliminarHover ? (!usuario.otInvBD ? 'bg-emerald-300' : 'bg-orange-300') : ''}`}
                onPress={() => {
                  desactivarHover();
                  setConfEliminarVis(true);
                }}
                onPressIn={() => setEliminarHover(true)}
                onPressOut={() => setEliminarHover(false)}>
                <Delete tamaño={32} color={ !usuario.otInvBD ? '#059669' : '#d97706' }/>
                <Text className={`${!usuario.otInvBD ? 'text-emerald-600' : 'text-amber-800'} self-center text-2xl ml-2`}>Eliminar</Text>
              </Pressable>

              <Pressable
                className={`flex-row items-center h-16 pl-2 ${ !usuario.otInvBD ? 'border-emerald-600' : 'border-orange-600' } border-t border-b ${cancelarHover ? (!usuario.otInvBD ? 'bg-emerald-300' : 'bg-orange-300') : ''}`}
                onPress={() => {
                  setOpcionesVis(!opcionesVis);
                  desactivarHover();
                }}
                onPressIn={() => SetCancelarHover(true)}
                onPressOut={() => SetCancelarHover(false)}>
                <Cancel tamaño={32} color={ !usuario.otInvBD ? '#059669' : '#d97706' }/>
                <Text className={`${!usuario.otInvBD ? 'text-emerald-600' : 'text-amber-800'} self-center text-2xl ml-2`}>Cancelar</Text>
              </Pressable>
            </View>
          )}
        </View>
        {
          plantaActualizada && (
            <Modal animationType="fade" transparent={true}>
              <View className={`absolute ${!usuario.otInvBD ? 'bg-cyan-900/40' : 'bg-amber-900/20'} h-full w-full items-center justify-center`}>
                <Text className={`text-3xl font-bold bg-white border ${!usuario.otInvBD ? 'border-emerald-600' : 'border-orange-600'} rounded-2xl px-4 py-2`}>Actualizando...</Text>
              </View>
            </Modal>
          )
        }
        {
          editarVis && (
            <Modal animationType="fade" transparent={true}>
              <View className={`absolute h-full w-full ${!usuario.otInvBD ? 'bg-cyan-900/40' : 'bg-amber-900/20'} justify-center items-center py-1`}>
                <DropShadow style={styles.sombraContenedor}>
                  <View className={`w-96 px-1 py-2 bg-white border ${!usuario.otInvBD ? 'border-emerald-600' : 'border-orange-600'} rounded-3xl`}>
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={[styles.content]}>
                      <View className="items-center flex-1 h-full gap-3">
                        <Pressable onPress={() => escogerImg()}>
                          {
                            planta.imagen || direccionImg ? (
                              <Image
                                className="bg-slate-200 h-52 w-80 rounded-tl-[80px] rounded-br-[80px]"
                                source={ direccionImg ? {uri: `${direccionImg}?timestamp=${imgNewTimeStamp}`} : {uri: `${planta.imagen}?timestamp=${imgOldTimeStamp}`}}
                                resizeMode="contain"/>
                            ) : (
                              <View className="bg-red-500 h-52 w-80 items-center justify-center">
                                <Text>Seleccionar Imagen</Text>
                              </View>
                            )
                          }
                        </Pressable>
                        <View className="w-full">
                          <Text className="text-gray-800 p-1">Nombre</Text>
                          <TextInput
                            placeholder="Nombre de la planta"
                            placeholderTextColor="gray"
                            className="text-1xl px-2 py-4 w-full text-gray-800 border border-gray-200 rounded-2xl"
                            value={editNombre}
                            onChangeText={(value)=> setEditNombre(value)}/>
                        </View>
                        <View className="flex-row w-full justify-between">
                          <View className="items-center">
                            { alerPriVer && (
                                <Text className="absolute text-gray-800 bg-red-100 w-full z-10 text-center rounded-md py-1">Solo numeros</Text>
                              )
                            }
                            <Text className="text-gray-800 p-1">Primavera/Verano</Text>
                            <TextInput
                              placeholder="Regar cada X días"
                              placeholderTextColor="gray"
                              className="text-1xl px-2 py-4 text-gray-800 border border-gray-200 rounded-2xl w-44"
                              value={editRegarPV.toString()}
                              maxLength={2}
                              keyboardType="numeric"
                              onChangeText={contPriVer}/>
                          </View>
                          <View className="items-center">
                            { alerOtInv && (
                                <Text className="absolute text-gray-800 bg-red-100 w-full z-10 text-center rounded-md py-1">Solo numeros</Text>
                              )
                            }
                            <Text className="text-gray-800 p-1">Otoño/Invierno</Text>
                            <TextInput
                              placeholder="Regar cada X días"
                              placeholderTextColor="gray"
                              className="text-1xl px-2 py-4 text-gray-800 border border-gray-200 rounded-2xl w-44"
                              value={editRegarOI.toString()}
                              maxLength={2}
                              keyboardType="numeric"
                              onChangeText={contOtInv}/>
                          </View>
                        </View>
                        <View className="w-full">
                          <Text className="text-gray-800 w-full p-1">Horas necesarias de sol</Text>
                          <TextInput
                            placeholder="Exponer al sol durante X horas"
                            placeholderTextColor="gray"
                            className="text-1xl px-2 py-4 text-gray-800 border border-gray-200 rounded-2xl"
                            value={editHorasSol}
                            maxLength={2}
                            keyboardType="numeric"
                            onChangeText={contHorasSol}/>
                        </View>
                        <View className="w-full">
                          <Text className="text-gray-800 w-full p-1">Descripción</Text>
                          <TextInput
                            placeholder="Anotaciones Generales de la planta"
                            placeholderTextColor="gray"
                            className="text-1xl px-2 py-4 h-32 text-gray-800 border border-gray-200 rounded-2xl"
                            multiline={true}
                            numberOfLines={5}
                            textAlignVertical="top"
                            value={editDescripcion}
                            onChangeText={(value) => setEditDescripcion(value)}/>
                        </View>
                        <View className="flex-row w-full justify-evenly h-20">
                          <DropShadow style={styles.sombraBtn(!usuario.otInvBD)}>
                            <Pressable
                              className={`py-3 px-4 ${!usuario.otInvBD ? 'bg-emerald-400' : 'bg-orange-500'} rounded-full justify-center items-center`}
                              onPress={() => setEditarVis(!editarVis)}>
                              <Text className="text-white text-xl font-bold">Cancelar</Text>
                            </Pressable>
                          </DropShadow>
                          <DropShadow style={styles.sombraBtn(!usuario.otInvBD)}>
                            <Pressable
                              className={`py-3 px-4 ${!usuario.otInvBD ? 'bg-emerald-400' : 'bg-orange-500'} rounded-full justify-center items-center`}
                              onPress={() => guardarEditPlanta()}>
                              <Text className="text-white text-xl font-bold">Guardar</Text>
                            </Pressable>
                          </DropShadow>
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                </DropShadow>
              </View>
            </Modal>
          )
        }
        {
          confEliminarVis && (
            <Modal animationType="fade" transparent={true}>
              <View className={`absolute h-full w-full ${!usuario.otInvBD ? 'bg-cyan-900/40' : 'bg-amber-900/20'} items-center justify-center`}>
                <DropShadow style={styles.sombraContenedor}>
                  <View className={`bg-white px-6 py-7 items-center border ${!usuario.otInvBD ? 'border-emerald-600' : 'border-orange-600'} rounded-3xl`}>
                    <View className="h-64 w-40">
                      <Image className="h-full w-full" source={require('../assets/menu/eliminar.png')}/>
                    </View>
                    <View className="rounded-xl w-72 h-28 justify-center items-center">
                      <Text className="text-2xl font-bold">¡Eliminando Planta!</Text>
                      <Text className="text-lg font-normal text-gray-800 text-center">Estas segur@ de eliminar la planta?🥀🥀🥀</Text>
                    </View>
                    <View className="flex-row w-72 h-15 justify-around">
                      <DropShadow style={styles.sombraBtn(!usuario.otInvBD)}>
                        <Pressable
                          className={`px-3 w-28 h-14 ${!usuario.otInvBD ? 'bg-emerald-400' : 'bg-orange-500'} rounded-full mt-4 justify-center items-center`}
                          onPress={() => setConfEliminarVis(false)}>
                          <Text className="text-white text-xl font-bold">Cancelar</Text>
                        </Pressable>
                      </DropShadow>
                      <DropShadow style={styles.sombraBtn(!usuario.otInvBD)}>
                        <Pressable
                          className={`px-3 w-28 h-14 ${!usuario.otInvBD ? 'bg-emerald-400' : 'bg-orange-500'} rounded-full mt-4 justify-center items-center`}
                          onPress={() => {
                            navigation.goBack();
                            eliminarPlanta();}}>
                          <Text className="text-white text-xl font-bold">Aceptar</Text>
                        </Pressable>
                      </DropShadow>
                    </View>
                  </View>
                </DropShadow>
              </View>
            </Modal>
          )
        }
        {
          alerta.visible && (
            <Modal animationType="fade" transparent={true}>
              <View className={`absolute h-full w-full ${!usuario.otInvBD ? 'bg-cyan-900/40' : 'bg-amber-900/20'} items-center justify-center`}>
                <DropShadow style={styles.sombraContenedor}>
                  <View className={`bg-white items-center border rounded-3xl p-2 ${ alerta.estado ? 'border-emerald-600' : 'border-red-500' }`}>
                    <View className={`rounded-2xl w-72 h-32 justify-center items-center ${ alerta.estado ? 'bg-emerald-50' : 'bg-red-50' }`}>
                      <Text className="text-xl font-bold text-gray-800 text-center">
                        {alerta.mensaje}
                      </Text>
                    </View>
                    <DropShadow style={ alerta.estado ? styles.sombraBtnCorrecto : styles.sombraBtnError }>
                      <Pressable
                        className={`px-3 mt-2 w-28 h-10 rounded-full justify-center items-center ${ alerta.estado ? 'bg-emerald-400' : 'bg-red-400' }`}
                        onPress={() => setAlerta({
                          ...alerta,
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
  } else if (!cargado){
    return (
      <View className={`flex-1 justify-center items-center ${ !otInvBDinterno ? 'bg-emerald-50' : 'bg-orange-50' }`}>
        <View className={` border-y-2 ${ !otInvBDinterno ? 'bg-cyan-900 border-emerald-200' : 'bg-amber-900 border-orange-200'} rounded-lg p-2 items-center`}>
          <View className="h-40 w-40">
            <Image className="h-full w-full" source={require('../assets/menu/cargando.png')}/>
          </View>
          <Text className={`text-xl ${ !otInvBDinterno ? 'text-emerald-100' : 'text-orange-100' } font-medium`}>Cargando información de la planta...</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  sombraContenedor: {
    shadowColor: '#494949',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: {
      width: 5,
      height: 5,
    },
  },
  sombraBtn: (dato) => ({
    shadowColor: dato ? '#02eb76' : '#bb7600',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  }),
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
