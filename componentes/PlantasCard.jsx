import { useEffect } from 'react';
import { Text, View, Image, StyleSheet, Pressable } from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import { useState } from 'react';

import { siguienteDiaRiego } from '../componentes/SiguienteDiaRiego';

import { getFirestore, doc, updateDoc, getDoc, onSnapshot } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
const db = getFirestore();

export function PlantasCard({id, imagen, nombre, otInv, diasRiegoPV, diasRiegoOI, nombreDiaActual, nombreDiaSiguiente, numeroDiaRiego, numeroSigDiaRiego, horasSol, iniciada, diasSinRegar, regarPlanta, navigation}){

  const uid = getAuth(getApp()).currentUser?.uid;

  const [ imgTimeStamp, setImgTimeStamp ] = useState(Date.now());
  const [ datosUsuario, setDatosUsuario ] = useState('');

  const diasOtoInv = otInv ? diasRiegoOI : diasRiegoPV;

  useEffect(() => {
    const usuario = doc(db, 'Usuarios', uid);

    const unsubscribe = onSnapshot(usuario, (snap) => {
      if (snap.exists){
        const data = snap.data();
        if (data){
          setDatosUsuario(data);
        }
      }
    });
    return() => unsubscribe();
  },[uid]);

  const btnRegar = async (identificador) => {
    if ( regarPlanta ){
      await siguienteDiaRiego({
        db,
        uid,
        identificador,
        diasOtoInv,
        numeroSigDiaRiego,
      });
    }
  };

  useEffect(()=>{
    const alterSigDiaRiegoClima = async () => {
      const docRef = doc(db, 'Usuarios', uid, 'Plantas', id);
      const docSnap = await getDoc(docRef);
      if(docSnap.exists()){
        const datosPlanta = docSnap.data();
        if(datosUsuario.otInvBD === true){
          const alterno = Number(datosPlanta.numeroDiaRiego) + Number(datosPlanta.diasRiegoOI);
          try {
            await updateDoc(docRef,{
              numeroSigDiaRiego:Number(alterno),
            });
          } catch (error) {
            console.log('Error al alternar siguiente dia de riego en Otoño/Invierno');
          }
        }else if (datosUsuario.otInvBD === false){
          const alterno = (Number(datosPlanta.numeroDiaRiego) + Number(datosPlanta.diasRiegoPV)) % 7;
          try {
            await updateDoc(docRef,{
              numeroSigDiaRiego: Number(alterno),
            });
          } catch (error) {
            console.log('Error al alternar siguiente dia de riego en Otoño/Invierno');
          }
        }
      }
    };
    alterSigDiaRiegoClima();
  },[uid, id, datosUsuario.otInvBD]);

  useEffect(()=>{
    const agregarBtnRiegoCambioClima = async () => {
      const docRef = doc(db, 'Usuarios', uid, 'Plantas', id);
      if ((diasOtoInv - diasSinRegar) <= 0){
        try {
          await updateDoc(docRef,{
            regarPlanta: true,
          });
        } catch (error) {
          console.log('Error al activar el riego de planta al cambiar de estación');
        }
      }
    };
    agregarBtnRiegoCambioClima();
  },[uid, id, diasOtoInv, diasSinRegar]);

  const btnIniciar = async (identificador) => {

    const docRef = doc(db, 'Usuarios', uid, 'Plantas', identificador);
    const {nombreDia, nombreSigDia, numeroDia, numeroSigDia} = diaInicioRiego();

    try{
      const inicioDiaR = {
        nombreDiaActual: nombreDia,
        nombreDiaSiguiente: nombreSigDia,
        numeroDiaRiego: numeroDia,
        numeroSigDiaRiego: numeroSigDia,
        iniciada: true,
      };
      console.log('Datos a guardar:', inicioDiaR);
      await updateDoc(docRef,inicioDiaR);
      console.log('Planta iniciada');
    }catch (error){
      console.log('Error al iniciar la planta', error);
    }
  };

  const diaInicioRiego = (identificador) => {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fechaHoy = new Date();
    const diaActual = fechaHoy.getDay();
    const nomDiaActual = diasSemana[diaActual];
    const numeroSigDia = (diaActual + diasOtoInv) % 7;
    const nomDiaSiguiente = diasSemana[numeroSigDia];

    console.log(nomDiaSiguiente);
    return {
      nombreDia: nomDiaActual,
      nombreSigDia: nomDiaSiguiente,
      numeroDia: diaActual,
      numeroSigDia: numeroSigDia,
    };
  };

  return(
    <DropShadow style={styles.sombraCard}>
      <Pressable onPress={()=> navigation.navigate('DetallesPlantita', { id: id, otInvBDinterno: datosUsuario.otInvBD })}>
        <View className="bg-white flex-row items-center rounded-[35px] p-2 min-h-60 h-auto" key={id}>
          <View className="items-center rounded-[30px] h-56 w-40">
            <Image
              className="h-full w-full rounded-[30px]"
              source={{ uri: `${imagen}?timestamp=${imgTimeStamp}` }}/>
            {
              !iniciada && (
                <Pressable className="absolute h-full justify-center" onPress={() => btnIniciar(id)}>
                  <View className="py-5 items-center justify-center">
                    <View className="p-2 h-full items-center justify-center bg-cyan-100 border-orange-500 border-4 rounded-2xl">
                      <Text className="font-bold text-center text-xl text-orange-500">Iniciar Riego</Text>
                      <Image
                        className="h-28 w-24"
                        source={require('../assets/menu/iniciar.png')}/>
                    </View>
                  </View>
                </Pressable>
              )
            }
          </View>
          <View className="flex-1 justify-center p-3 pt-3 pb-2 pl-2">
            <View className="gap-1 px-2">
              <Text
                className="text-2xl font-bold flex-wrap"
                numberOfLines={2}>
                  {nombre}
              </Text>
              <Text className="text-base">Regar cada: {`${ otInv ? diasRiegoOI : diasRiegoPV}`} día/s</Text>
              <Text
                className="text-base"
                numberOfLines={2}>
                  Horas de sol: {horasSol}
              </Text>
              {
                iniciada && (
                  (diasOtoInv - diasSinRegar) > 0 ? (
                    <View>
                      <Text className="text-base">Dias restantes</Text>
                    </View>
                  ) : (diasOtoInv - diasSinRegar) === 0 ? (
                    <Text className="text-base">Hoy hay que regar la plantita</Text>
                  ) : (
                    <View>
                      <Text className="text-base text-wrap">Dias sin regar</Text>
                    </View>
                  )
                )
              }
            </View>
            <View className="flex-row items-center justify-center w-full mt-4">
              {
                iniciada && (
                  (diasOtoInv - diasSinRegar) > 0 ? (
                    <View>
                      <Text className="font-bold text-xl">{diasOtoInv}</Text>
                    </View>
                  ) : (diasOtoInv - diasSinRegar) === 0 ? (
                    <Text className="text-xl">👉</Text>
                  ) : (
                    <View className="">
                      <Text className="font-bold text-xl">{Math.abs(diasOtoInv - diasSinRegar)}</Text>
                    </View>
                  )
                )
              }
              {
                regarPlanta && (
                  <View className="items-center w-28 ml-5">
                    <DropShadow style={styles.sombraRegar(!datosUsuario.otInvBD)}>
                      <Pressable
                        className={`${ !datosUsuario.otInvBD ? 'bg-emerald-400 ' : 'bg-orange-500' } w-32 h-14 items-center justify-center rounded-full`}
                        onPress={()=>btnRegar(id)}>
                        <Text className="text-white text-xl font-bold">💧Regar</Text>
                      </Pressable>
                    </DropShadow>
                  </View>
                )
              }
            </View>
          </View>
        </View>
      </Pressable>
    </DropShadow>
  );
}

const styles = StyleSheet.create({
  nombre:{
    fontSize: 20,
    fontWeight: '',
  },
  sombraCard: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  sombraRegar: (datos) => ({
    shadowColor: datos ? '#02eb76' : '#bb7600',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  }),
});
