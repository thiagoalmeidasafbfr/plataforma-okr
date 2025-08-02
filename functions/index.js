// Importa os módulos necessários do Firebase Functions e do Admin SDK
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa o Admin SDK para que a função tenha acesso de administrador
admin.initializeApp();

/**
 * Cloud Function para criar um novo usuário no Firebase Authentication
 * e um perfil correspondente no Firestore.
 * Pode ser chamada de forma segura pelo nosso aplicativo React.
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  
  // Extrai os dados enviados pelo nosso app (email, senha, nome, etc.)
  const email = data.email;
  const password = data.password;
  const name = data.name;
  const role = data.role;
  const teamId = data.teamId;

  // Validação básica dos dados recebidos
  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Dados incompletos. Nome, email, senha e cargo são obrigatórios.'
    );
  }

  try {
    // 1. Usa o Admin SDK para criar o usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 2. Com o usuário criado, pega o UID dele
    const uid = userRecord.uid;

    // 3. Cria o documento de perfil correspondente na coleção "users" do Firestore
    await admin.firestore().collection("users").doc(uid).set({
      name: name,
      email: email,
      role: role,
      teamId: teamId || "", // Garante que o campo exista, mesmo que vazio
    });

    // Retorna uma mensagem de sucesso para o nosso app
    return { result: `Usuário ${email} criado com sucesso.` };

  } catch (error) {
    // Se der algum erro (ex: email já existe), retorna o erro para o app
    console.error("Erro ao criar usuário:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
