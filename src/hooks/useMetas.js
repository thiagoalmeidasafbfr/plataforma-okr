import { useState, useEffect } from 'react';
/**
 * Faz o download e converte um arquivo CSV simples em um array de objetos.
 * Os campos devem ser separados por vírgula e não possuir vírgulas internas.
 *
 * @param {string} path Caminho do arquivo dentro da pasta `public`.
 * @returns {Promise<Array<Object>>} Dados convertidos para objeto.
 */
async function fetchCSV(path) {
    const response = await fetch(path);
    const text = await response.text();
    const [headerLine, ...lines] = text.trim().split('\n');
    const headers = headerLine.split(',');
    return lines.map(line => {
        const values = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i] ? values[i].trim() : '']));
    });
}

/**
 * Hook para consultar metas e respectivos resultados mensais.
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
                // Carrega as planilhas localizadas em `public/data`.
                const metasData = await fetchCSV('/data/metas.csv');
                const resultadosData = await fetchCSV('/data/resultados.csv');

                // Filtra as metas conforme a área selecionada.
                const metasFiltradas = area ? metasData.filter(m => m.area === area) : metasData;

                const metasComResultados = metasFiltradas.map(meta => {
                    const resultadoLinha = resultadosData.find(r => r.idMeta === meta.idMeta && (!mesReferencia || r.mes === mesReferencia));
                    const resultado = resultadoLinha ? Number(resultadoLinha.resultado) : null;

                    // Cálculo do percentual de conclusão com base no peso da meta.
                    const peso = Number(meta.peso || 0);
                    const percentual = resultado !== null && peso > 0
                        ? Math.min((resultado / peso) * 100, 100)
                        : 0;

                    return { ...meta, resultado, percentual };
                });
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
