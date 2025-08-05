import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook para consultar metas e respectivos resultados mensais armazenados no Firestore.
 *
 * @param {string} area - Área para filtrar as metas (opcional).
 * @param {string} mesReferencia - Mês no formato 'YYYY-MM' para obter o resultado (opcional).
 * @returns {{ metas: Array, loading: boolean }} Metas com percentual de conclusão.
 */
export function useMetas(area, mesReferencia) {
    const [metas, setMetas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function carregarMetas() {
            try {
                const snapshot = await getDocs(collection(db, 'metas'));
                let metasData = snapshot.docs.map(doc => ({ idMeta: doc.id, ...doc.data() }));
                if (area) {
                    metasData = metasData.filter(m => m.area === area);
                }

                const metasComResultados = await Promise.all(metasData.map(async meta => {
                    let resultado = null;
                    if (mesReferencia) {
                        const resultadoDoc = await getDoc(doc(db, 'metas', meta.idMeta, 'resultados', mesReferencia));
                        if (resultadoDoc.exists()) {
                            resultado = Number(resultadoDoc.data().resultado);
                        }
                    }
                    const peso = Number(meta.peso || 0);
                    const percentual = resultado !== null && peso > 0
                        ? Math.min((resultado / peso) * 100, 100)
                        : 0;
                    return { ...meta, resultado, percentual };
                }));

                setMetas(metasComResultados);
            } catch (error) {
                console.error('Erro ao carregar metas:', error);
            } finally {
                setLoading(false);
            }
        }
        carregarMetas();
    }, [area, mesReferencia]);

    return { metas, loading };
}

