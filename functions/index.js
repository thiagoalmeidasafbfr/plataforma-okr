// Importa os módulos necessários do Firebase Functions e do Admin SDK
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa o Admin SDK para que a função tenha acesso de administrador
admin.initializeApp();

/**
 * Cloud Function para criar um novo utilizador no Firebase Authentication
 * e um perfil correspondente no Firestore.
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  
  // Passo 1: Verificar se o pedido vem de um utilizador autenticado e se esse utilizador é um admin.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'O pedido deve ser feito por um utilizador autenticado.'
    );
  }

  const callerUid = context.auth.uid;
  const userProfileDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!userProfileDoc.exists() || userProfileDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Apenas administradores podem criar novos utilizadores.'
    );
  }

  // Passo 2: Extrair e registar cada variável para depuração.
  console.log("Dados brutos recebidos:", data);
  const { email, password, name, role, jobTitle, teamId } = data;
  
  console.log(`Email: ${email}`);
  console.log(`Password: ${password ? 'Presente' : 'Ausente'}`);
  console.log(`Name: ${name}`);
  console.log(`Role: ${role}`);
  console.log(`JobTitle: ${jobTitle}`);
  console.log(`TeamId: ${teamId}`);

  // Passo 3: Validação dos dados recebidos.
  if (!email || !password || !name || !role || !jobTitle) {
    console.error("Falha na validação. Pelo menos um campo obrigatório está em falta.");
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Dados incompletos. Nome, email, senha, perfil e cargo são obrigatórios.'
    );
  }

  try {
    // Passo 4: Criar o utilizador no Firebase Authentication.
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    const uid = userRecord.uid;

    // Passo 5: Criar o documento de perfil no Firestore.
    await admin.firestore().collection("users").doc(uid).set({
      name: name,
      email: email,
      role: role,
      jobTitle: jobTitle,
      teamId: teamId || "",
    });

    // Retorna uma mensagem de sucesso.
    return { result: `Utilizador ${email} criado com sucesso.` };

  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});