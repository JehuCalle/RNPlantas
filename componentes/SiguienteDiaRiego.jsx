import { doc, updateDoc, getDoc } from '@react-native-firebase/firestore';

export async function siguienteDiaRiego({db, uid, identificador, diasOtoInv, numeroSigDiaRiego}){
  if (!uid || !identificador) {return;}

  const docRef = doc(db, 'Usuarios', uid, 'Plantas', identificador);
                      //[ 0, 1, 2, 3, 4, 5, 6]
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const newNumeroDia = Number(numeroSigDiaRiego);
  const newSigNumeroDia = (newNumeroDia + Number(diasOtoInv)) % 7;
  const newNombreDia = diasSemana[newNumeroDia];
  const newSigNombreDia = diasSemana[newSigNumeroDia];

  try {
    await updateDoc(docRef, {
      numeroDiaRiego: Number(newNumeroDia),
      numeroSigDiaRiego: Number(newSigNumeroDia),
      nombreDiaActual: newNombreDia,
      nombreDiaSiguiente: newSigNombreDia,
      regarPlanta: false,
      diasSinRegar: 0,
    });
    console.log('Siguiente día establecido');
  } catch (error) {
    console.log('Error al establecer el siguiente día', error);
    console.log(newSigNumeroDia);
  }
}
