  import { useState, useEffect, useRef} from 'react';
  import { Pressable, Text, TextInput, View, ScrollView, Keyboard, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from '@react-native-firebase/auth';
  import { getFirestore, doc, serverTimestamp, runTransaction } from '@react-native-firebase/firestore';
  import { getApp } from '@react-native-firebase/app';
  import DropShadow from 'react-native-drop-shadow';

  import { OjoAbierto, OjoCerrado } from '../componentes/Iconos';

  const nombreUnicoRegex = /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]{8,15}$/;
  const correoRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  export default function Login({ navigation }) {

    //INICIO SESIÓN
    const [ correo, setCorreo ] = useState('');
    const [ pass, setPass ] = useState('');

    const [ correoVal, setCorreoVal ] = useState(false);
    const [ passVal, setPassVal ] = useState(false);
    //REGISTRARCE

    const [ nombre, setNombre ] = useState('');
    const [ nombreUnico, setNombreUnico ] = useState('');
    const [ nombreUnicoVal, setNombreUnicoVal ] = useState('');

    const [ correoReg, setCorreoReg ] = useState('');
    const [ passReg, setPassReg ] = useState('');
    const [ passReg2, setPassReg2 ] = useState('');

    const [ correoRegVal, setCorreoRegVal ] = useState(false);
    const [ passRegVal, setPassRegVal ] = useState(false);

    const [ mostrarReg, setMostrarReg ] = useState(false);
    //ALERTA
    const [ alerta, setAlerta ] = useState({
      mensaje: 'a',
      visible: false,
      estado: false,
    });
    const refTiempoAlerta = useRef(null);
    //TEXTINPUT COLORES DE LOS BORDES
    const borderCorreo = correo === '' ? 'border-gray-200' : ( correoVal ? 'border-emerald-600' : 'border-red-800' );
    const borderPass = pass === '' ? 'border-gray-200' : ( passVal ? 'border-emerald-600' : 'border-red-800' );

    const borderNombreUnico = nombreUnico === '' ? 'border-gray-200' : ( nombreUnicoVal ? 'border-emerald-600' : 'border-red-800' );
    const borderCorreoReg = correoReg === '' ? 'border-gray-200' : ( correoRegVal ? 'border-emerald-600' : 'border-red-800' );
    const borderPassReg = passReg === '' ? 'border-gray-200' : ( passRegVal ? 'border-emerald-600' : 'border-red-800' );
    //VALIDAR CREDENCIALES

    const [ alturaTeclado, setAlturaTeclado ] = useState(0);
    const [ ocultarPassL, setOcultarPassL ] = useState(true);
    const [ ocultarPassR1, setOcultarPassR1 ] = useState(true);
    const [ ocultarPassR2, setOcultarPassR2 ] = useState(true);

    useEffect(()=>{
      const nombreUnicoValido = ( value ) => nombreUnicoRegex.test(String(value ?? '').trim());
      const correoValido = ( value ) => correoRegex.test(String(value ?? '').trim().toLowerCase());
      const passValida = ( value ) => passRegex.test(String(value ?? '').trim());

      setCorreoVal(correoValido(correo));
      setPassVal(passValida(pass));

      setNombreUnicoVal(nombreUnicoValido(nombreUnico));
      setCorreoRegVal(correoValido(correoReg));
      setPassRegVal(passValida(passReg));
    },[correo, pass,nombreUnico, correoReg, passReg]);

    const enviarLogin = async ( correoRec, passRec ) => {
      if ( correoRec !== '' && passRec !== '' ) {
        if (correoVal && passVal) {
          try {
            const credenciales = await signInWithEmailAndPassword(auth, String(correoRec).trim().toLowerCase(), String(passRec).trim());
            console.log('Usuario logueado:', credenciales.user.uid);
            setCorreo('');
            setPass('');

            setAlerta({
              mensaje: 'Sesión iniciada',
              visible: true,
              estado: true,
            });
          } catch (error) {
            console.log('Error al iniciar sesión:', error);

            const map = {
              'auth/user-not-found' : 'Usuario no encontrado',
              'auth/wrong-password' : 'Contraseña incorrecta',
              'auth/invalid-email' : 'Correo invalido',
              'auth/too-many-requests' : 'Demasiados intentos, intente más tarde',
              'auth/invalid-credentials' : 'Credenciales inválidas',
            };

            const errorLogin = map[error.code] ?? 'Error al iniciar sesión';

            setAlerta({
              mensaje: errorLogin,
              visible: true,
              estado: false,
            });
          }
        }else if ( !correoVal ){
          setAlerta({
            mensaje: 'Correo inválido',
            visible: true,
            estado: false,
          });
        }else if ( !passVal ){
          setAlerta({
            mensaje: 'Contraseña inválida',
            visible: true,
            estado: false,
          });
        }
      }else {
        setAlerta({
          mensaje: 'Faltan datos por ingresar',
          visible: true,
          estado: false,
        });
      }
    };

    useEffect(()=>{
      if(!mostrarReg){
        setNombre('');
        setNombreUnico('');
        setCorreoReg('');
        setPassReg('');
        setPassReg2('');
      }
    },[mostrarReg]);

    const registro = async () => {
      if ( nombre !== '' && nombreUnico !== '' && correoReg !== '' && passReg !== '' && passReg2 !== ''){

        const nombreUnicoR = String(nombreUnico).toLowerCase().replace(/\s/g, '');
        const correoR = String(correoReg).trim().toLowerCase();
        const passR = String(passReg).trim();
        const pass2R = String(passReg2).trim();
        if ( correoRegVal && passRegVal && passReg === passReg2){
          let credenciales;
          try {
            const nombreRef = doc(db, 'NombresUnicos', nombreUnicoR);

            await runTransaction(db, async (transaction) => {
              const snap = await transaction.get(nombreRef);
              if (snap.exists()){
                throw new Error('Nombre ya en uso');
              }
            });
            credenciales = await createUserWithEmailAndPassword(auth, correoR, passR);
            await runTransaction(db, async (transaction) => {
              const usuarioRef = doc(db, 'Usuarios', credenciales.user.uid);
              transaction.set(usuarioRef, {
                email: correoR,
                nombre: nombre,
                nombreUnico: nombreUnicoR,
                fechaCreacion: serverTimestamp(),
                contador: 0,
                otInvBD: false,
                tutorial: true,
              });

              transaction.set(nombreRef, {
                uid: credenciales.user.uid,
              });
            });
            setCorreoReg('');
            setPassReg('');
            setPassReg2('');
            setMostrarReg(false);

            setAlerta({
              mensaje: 'Registrado Exitosamente',
              visible: true,
              estado: true,
            });

          } catch (error) {
            console.log('Error al registrar:', error);

            let errorRegistro = 'Error al registrar usuario';

            if( error.code === 'auth/email-already-in-use' ){
              errorRegistro = 'El correo ya está en uso';
            }

            if (error.message === 'Nombre ya en uso'){
              errorRegistro = 'Nombre ya existe, use otro';
            }

            setAlerta({
              mensaje: errorRegistro,
              visible: true,
              estado: false,
            });
          }

        } else if (!correoRegVal){
          setAlerta({
            mensaje: 'Correo inválido',
            visible: true,
            estado: false,
          });
        } else if (!passRegVal){
          setAlerta({
            mensaje: 'Contraseña no cumple requisitos',
            visible: true,
            estado: false,
          });
        } else if (!correoRegVal && !passRegVal){
          setAlerta({
            mensaje: 'Correo y contraseña inválidas',
            visible: true,
            estado: false,
          });
        } else if (passReg !== passReg2){
          setAlerta({
            mensaje: 'Contraseñas no coinciden',
            visible: true,
            estado: false,
          });
        }
      } else {
        setAlerta({
          mensaje: 'Faltan datos por ingresar',
          visible: true,
          estado: false,
        });
      }
    };

    useEffect(()=>{
      if (!alerta.visible) {return;}

      if (refTiempoAlerta.current){
        clearTimeout(refTiempoAlerta.current);
      }

      refTiempoAlerta.current = setTimeout(() => {
        setAlerta(prev => ({...prev, visible: false}));
        refTiempoAlerta.current = null;
      }, 2000);

      return () => {
        if (refTiempoAlerta.current){
          clearTimeout(refTiempoAlerta.current);
          refTiempoAlerta.current = null;
        }
      };
    },[alerta.visible]);

    useEffect(() => {
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
      <KeyboardAvoidingView
        className="w-full h-full bg-emerald-900 items-center"
        style={ style.keyStyle }
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/*ALERTA*/}
          <View
            className="absolute top-9 z-50"
            pointerEvents={alerta.visible ? 'auto' : 'none'}>
            <View className={`flex-row items-center justify-between transition duration-300 ease-in-out ${alerta.visible ? 'opacity-100' : 'opacity-0'} ${ alerta.estado ? 'bg-emerald-50 border-emerald-600 -translate-y-4' : 'bg-red-50 border-red-500 -translate-y-4' } border rounded-xl`}>
              <Text className="m-1 p-2 text-xl font-bold">{alerta.mensaje}</Text>
              <Pressable
                className="px-4 border-l-2"
                onPress={() => setAlerta({
                  ...alerta,
                  visible: false,
                })}>
                <Text className="text-xl font-bold">X</Text>
              </Pressable>
            </View>
          </View>

          {/*LOGIN*/}
          <ScrollView
            className="bg-emerald-50 flex-1 w-full"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[ style.content ]}>
            <View className="w-full items-center">
              <Text className="text-gray-800 text-xl font-bold">Correo</Text>
              <TextInput
                className={`w-96 h-16 px-2 text-gray-800 text-xl bg-white border ${borderCorreo} rounded-2xl`}
                value={correo}
                onChangeText={(value) => setCorreo(value)}/>
              <Text className="text-gray-800 text-xl font-bold mt-2">Contraseña</Text>
              <View className={`w-96 h-16 flex-row justify-between bg-white border ${borderPass} rounded-2xl`}>
                <TextInput
                  className="flex-1 px-2 text-gray-800 text-xl"
                  value={pass}
                  onChangeText={(value) => setPass(value)}
                  secureTextEntry={ocultarPassL}/>
                <Pressable
                  className="h-full p-3 rounded-lg justify-center"
                  onPress={() => setOcultarPassL(!ocultarPassL)}>
                    {
                      ocultarPassL ? (<OjoCerrado tamaño={24} color="#059669"/>) : (<OjoAbierto tamaño={24} color="#059669"/>)
                    }
                </Pressable>
              </View>
              <DropShadow style={style.sombraBotonLgRg}>
                <Pressable
                  className="py-4 px-24 mt-4 bg-emerald-400 rounded-full"
                  onPress={() => {enviarLogin( correo, pass );}}>
                  <Text className=" text-white text-xl font-bold">Iniciar Sesión</Text>
                </Pressable>
              </DropShadow>
              <Pressable
                className="mt-2"
                onPress={() => setMostrarReg(!mostrarReg)}>
                <Text className=" text-gray-400 text-lg font-bold">Registrarme</Text>
              </Pressable>
            </View>
          </ScrollView>

          {/*REGISTRARSE*/}
          <View
            className={`absolute w-full h-full z-20 ${mostrarReg ? 'opacity-100' : ' opacity-0'}`}
            pointerEvents={mostrarReg ? 'auto' : 'none'}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[ style.content, { paddingBottom: 80 } ]}>
              <View className="w-full justify-start pt-4 px-9">
                <DropShadow style={style.sombraRegistro}>
                  <View className="pb-5 pt-2 px-0 bg-white justify-center items-center gap-2 border border-emerald-600 rounded-tl-[80px] rounded-tr-3xl rounded-bl-3xl rounded-br-[80px] ">
                    <Pressable className="w-full justify-end items-end">
                      <Text className="right-2 px-3 p-1 text-2xl text-emerald-600 rounded-full" onPress={() => setMostrarReg(!mostrarReg)}>X</Text>
                    </Pressable>
                    <View className="justify-center items-center">
                      <Text className="text-gray-800 text-xl font-normal">Nombre</Text>
                      <TextInput
                        className="w-80 h-16 px-2 text-gray-800 text-xl border bg-white border-gray-200 rounded-2xl"
                        value={nombre}
                        onChangeText={(value)=> setNombre(value)}/>
                      <Text className="text-gray-800 text-xl font-normal mt-2">Nombre Unico</Text>
                      <TextInput
                        className={`w-80 h-16 px-2 text-gray-800 text-xl bg-white border ${borderNombreUnico} rounded-2xl`}
                        value={nombreUnico}
                        onChangeText={(value)=> setNombreUnico(value)}/>
                      <View className="w-80 h-14 bg-emerald-50 rounded-lg">
                        <Text className="text-base">-Solo numeros y letras</Text>
                        <Text className="text-base">-Minimo 8 y maximo 15 caracteres</Text>
                      </View>
                      <Text className="text-gray-800 text-xl font-normal mt-1">Correo</Text>
                      <TextInput
                        className={`w-80 h-16 px-2 text-gray-800 text-xl bg-white border ${borderCorreoReg} rounded-2xl`}
                        value={correoReg}
                        onChangeText={(value)=> setCorreoReg(value)}/>
                      <Text className="text-gray-800 text-xl font-normal mt-2">Contraseña</Text>
                      <View className={`w-80 h-16 flex-row justify-between items-center bg-white border ${borderPassReg} rounded-2xl`}>
                        <TextInput
                          className="flex-1 px-2 text-gray-800 text-xl"
                          value={passReg}
                          onChangeText={(value)=>setPassReg(value)}
                          secureTextEntry={ocultarPassR1}/>
                        <Pressable
                          className="h-full p-3 justify-center"
                          onPress={() => setOcultarPassR1(!ocultarPassR1)}>
                            {
                              ocultarPassR1 ? ( <OjoCerrado tamaño={24} color="#059669"/> ) : ( <OjoAbierto tamaño={24} color="#059669"/> )
                            }
                        </Pressable>
                      </View>
                      <Text className="text-gray-800 text-xl font-normal mt-2">Confirme su contraseña</Text>
                      <View className={`w-80 h-16 flex-row justify-between items-center bg-white border ${ (passReg !== '' && passReg2 !== '') ? (passReg === passReg2 ? 'border-emerald-600' : 'border-red-800') : 'border-gray-200' } rounded-2xl`}>
                        <TextInput
                          className="flex-1 px-2 text-gray-800 text-xl"
                          value={passReg2}
                          onChangeText={(value)=>setPassReg2(value)}
                          secureTextEntry={ocultarPassR2}/>
                        <Pressable
                          className="h-full p-3 justify-center"
                          onPress={() => setOcultarPassR2(!ocultarPassR2)}>
                            {
                              ocultarPassR2 ? ( <OjoCerrado tamaño={24} color="#059669"/> ) : ( <OjoAbierto tamaño={24} color="#059669"/> )
                            }
                        </Pressable>
                      </View>
                      <DropShadow style={style.sombraBotonLgRg}>
                        <Pressable
                          className="w-48 mt-3 bg-emerald-400 rounded-full"
                          onPress={() => registro()}>
                          <Text className="p-2 text-white text-xl text-center font-medium">Registrarme</Text>
                        </Pressable>
                      </DropShadow>
                    </View>
                  </View>
                </DropShadow>
              </View>
            </ScrollView>
          </View>
      </KeyboardAvoidingView>
    );
  }

const style = StyleSheet.create({
  content : {
    flexGrow: 1,
    justifyContent: 'space-around'},
  keyStyle: {
    flex: 1,
  },
  sombraBotonLgRg: {
    shadowColor: '#00be7e',//Color
    shadowOpacity: 0.35,//Opacidad
    shadowRadius: 12,//Distancia
    shadowOffset:{//Dirección
      width: 0,
      height: 8,
    },
  },
  sombraRegistro: {
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
})