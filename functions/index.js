const {setGlobalOptions} = require("firebase-functions/v2/options");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");

initializeApp();

setGlobalOptions({maxInstances: 10});

//                                  every 5 minutes/every day 11:00
exports.verificarRiego = onSchedule("every day 11:00", async () => {
  const db = getFirestore();
  const usuariosSnapshot = await db.collection("Usuarios").get();

  if (usuariosSnapshot.empty) {
    console.log("No se encuentran usuarios");
    return;
  }

  const fechaHoy = new Date();
  const numeroDiaActual = fechaHoy.getDay();


  for ( const userDoc of usuariosSnapshot.docs ) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const tokens = userData.tokens || [];
    const plantasSnapshot = await db.collection("Usuarios").doc(userId).collection("Plantas").get();

    if ( plantasSnapshot.empty ) {
      console.log(`El usuario ${userId} no tiene plantas`);
      continue;
    }

    for ( const plantaDoc of plantasSnapshot.docs ) {
      const planta = plantaDoc.data();
      const docRef = db.collection("Usuarios").doc(userId).collection("Plantas").doc(plantaDoc.id);
      const updateData = {
        diasSinRegar: ( planta.diasSinRegar || 0 ) + 1,
      };

      if (planta.numeroSigDiaRiego === numeroDiaActual) {
        if (tokens.length === 0) continue;
        for ( const token of tokens ) {
          try {
            await getMessaging().send({
              token: token,
              data: {
                title: "Regar",
                body: `Regar la planta: ${planta.nombre}`,
                plantaId: plantaDoc.id,
                uid: userId,
              },
              android: {
                priority: "high",
              },
            });
            console.log(`Notificacion para regar la planta ${planta.nombre} enviada`);
          } catch (error) {
            console.error(`Error al notificar riego de planta ${planta.nombre}:`, error);
            if (error.code === "messaging/registration-token-not-registered") {
              await db.collection("Usuarios").doc(userId).update({
                tokens: FieldValue.arrayRemove(token),
              });
              console.log("Token eliminado desde verificarRiego");
            }
          }
        }
        updateData.regarPlanta = true;
      }

      try {
        console.log(`Aumentando dias sin regar de la planta ${planta.nombre}`);
        console.log(planta.numeroSigDiaRiego, numeroDiaActual);
        await docRef.update(updateData);
      } catch (error) {
        console.error(`Error al aumentar los dias sin regar ${planta.nombre}:`, error);
      }
    }
  }
});

// eslint-disable-next-line eol-last
// SOLUCIONAR QUE AL MOMENTO DE QUE SE EJECUTE regarPlanta SE IMPRIMA "La planta ha sido eliminada"