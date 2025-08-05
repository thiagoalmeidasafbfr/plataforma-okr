import fs from 'fs';
import path from 'path';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../src/firebase/config.js';

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const [header, ...lines] = content.split('\n');
  const headers = header.split(',');
  return lines.map(line => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i] ? values[i].trim() : '']));
  });
}

async function main() {
  const email = process.env.FIREBASE_EMAIL;
  const password = process.env.FIREBASE_PASSWORD;
  if (!email || !password) {
    console.error('FIREBASE_EMAIL ou FIREBASE_PASSWORD não definidos.');
    process.exit(1);
  }

  await signInWithEmailAndPassword(auth, email, password);

  const metasPath = path.resolve('public/data/metas.csv');
  const metas = parseCSV(metasPath);
  for (const meta of metas) {
    const { idMeta, tipoMeta, diretoria, area, objetivo, kr, peso } = meta;
    await setDoc(doc(db, 'metas', idMeta), {
      tipoMeta,
      diretoria,
      area,
      objetivo,
      kr,
      peso: Number(peso || 0),
    }, { merge: true });
  }

  const resultadosPath = path.resolve('public/data/resultados.csv');
  const resultados = parseCSV(resultadosPath);
  for (const r of resultados) {
    const { idMeta, mes, resultado } = r;
    await setDoc(doc(db, 'metas', idMeta, 'resultados', mes), {
      resultado: Number(resultado || 0),
    });
  }

  console.log('Sincronização concluída.');
}

main().catch(err => {
  console.error('Erro ao sincronizar metas:', err);
  process.exit(1);
});

