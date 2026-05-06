import { getStorageProvider } from '../../lib/storage/storage.provider.js';

const provider = getStorageProvider();

export async function salvarXML(referencia: string, xml: string): Promise<string> {
  try {
    const url = await provider.upload(referencia, xml, 'application/xml');
    return url;
  } catch (error) {
    throw new Error(`Erro ao salvar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function recuperarXML(referencia: string): Promise<string | null> {
  try {
    const data = await provider.get(referencia);
    return data;
  } catch (error) {
    throw new Error(`Erro ao recuperar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function listarXMLs(): Promise<string[]> {
  try {
    const keys = await provider.list('nfe');
    return keys.map(k => {
      // return the filename part
      const parts = k.split('/');
      const last = parts[parts.length - 1];
      return last.endsWith('.xml') ? last.replace('.xml', '') : last;
    });
  } catch (error) {
    throw new Error(`Erro ao listar XMLs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}