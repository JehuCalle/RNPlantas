import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { getStorage, ref, getDownloadURL, putFile } from '@react-native-firebase/storage';

async function pedirPermisosAndroid( permiso, titulo, mensaje) {
  if (Platform.OS === 'android'){
    try {
      const granted = await PermissionsAndroid.request(permiso, {
        title: titulo,
        message: mensaje,
        buttonPositive: 'aceptar',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }
  return true;
}

async function pedirPermisoGaleria() {
  if (Platform.OS === 'android'){
    if (Platform.Version >= 33) {
      return await pedirPermisosAndroid(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        'Permiso para acceder a imagenes',
        'La app necesita acceso a tus imagenes para seleccionar una foto'
      );
    } else {
      return await pedirPermisosAndroid(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        'Permiso para acceder al almacenamiento',
        'La app necesita acceso a tu galería para seleccionar una imagen'
      );
    }
  }
  return true;
}

async function pedirPermisoCamara() {
  return await pedirPermisosAndroid(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    'Permiso para acceder a la camara',
    'La app necesita accesos a tu camara para tomar fotos'
  );
}

export const subirImagenFirebase = async (uri, uid) => {
  if (!uri){
    console.log('URI no proporcionada para subir imagen');
    return null;
  }
  try {
    const imagenReducida = await ImageResizer.createResizedImage(
      uri,
      800,
      800,
      'JPEG',
      70
    );

    const path = `plantas/${uid}/${Date.now()}.jpg`;
    const storage = getStorage();
    const referencia = ref(storage, path);

    await putFile(referencia, imagenReducida.uri);

    const urlParaDescargar = await getDownloadURL(referencia);

    await RNFS.unlink(imagenReducida.uri);

    return {
      url: urlParaDescargar,
      path: path,
    };
  } catch (error) {
    console.log('Error subiendo la imagen a birebase Storage: ', error);
    return null;
  }
};

const abrirGaleria = async () => {
  const permisosOK = await pedirPermisoGaleria();
  if (!permisosOK){
    Alert.alert('Permiso denegado', 'no se puede acceder a la galeria');
    return null;
  }

  return new Promise((resolve) => {
    launchImageLibrary({
      mediaType:  'photo',
    }, (response) => {
      if (response.didCancel || response.errorCode){
        console.log('Cancelado o error', response.errorMessage);
        resolve(null);
        return;
      }
      const asset = response.assets[0];
      resolve({ asset });
    });
  });
};

const tomarFoto = async () => {
  const permisosOK = await pedirPermisoCamara();
  if (!permisosOK){
    Alert.alert('Permiso denegado', 'No se puede acceder a la camara');
    return null;
  }

  return new Promise((resolve) => {
    launchCamera({
      mediaType: 'photo',
    }, (response) => {
      if (response.didCancel || response.errorCode){
        console.log('Cancelado o error', response.errorMessage);
        resolve(null);
        return;
      }
      const asset = response.assets[0];
      resolve({ asset });
    });
  });
};

export const seleccionarYSubirImagen = async (onUploadComplete) => {
  return new Promise((resolve)=>{
    Alert.alert(
      'Seleccionar imagen',
      '¿De donde deseas obtener la imagen?',
      [
        {
          text: 'Galeria',
          onPress: async () => {
            const resultado = await abrirGaleria();
            resolve(resultado ? resultado.asset : null);
          },
        },
        {
          text: 'Camara',
          onPress: async () => {
            const resultado = await tomarFoto();
            resolve(resultado ? resultado.asset : null);
          },
        },
        {
          text: 'Cancelar',
          onPress: () => resolve(null),
          style: 'cancel',
        },
      ]
    );
  });
};