/* eslint-disable no-await-in-loop */
import "@api/config";
import admin from "firebase-admin";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const createFirebaseUser = async () => {
  try {
    const newFirebaseUser = await admin.auth().createUser({
      uid: "",
      email: "",
      emailVerified: true,
      displayName: "",
      phoneNumber: "",
    });

    console.log(`Created user ${newFirebaseUser.displayName} [${newFirebaseUser.email}]`);
  } catch (err: any) {
    console.log(err.message);
  }
};

(async () => {
  await createFirebaseUser();

  console.info("\nDone.");
})();
